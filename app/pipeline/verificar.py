import re
import threading
from functools import cached_property

import torch
from PIL import Image

from app import config

# Analiza entrada y salida por separado con CLIP, BLIP y DETR, y compara qué cambió entre ambas.

CALIDAD = ["a high resolution photo", "a low resolution, pixelated photo"]
CONTENIDO = [
    "a photo of a person",
    "a photo of an animal",
    "a photo of a building",
    "a photo of a landscape",
    "a photo of text or a sign",
    "a photo of food",
    "a photo of an object",
]
STOPWORDS = {
    "a",
    "an",
    "the",
    "of",
    "in",
    "on",
    "at",
    "with",
    "and",
    "or",
    "to",
    "is",
    "are",
    "there",
    "it",
    "its",
    "this",
    "that",
    "for",
    "from",
    "by",
    "as",
    "up",
    "down",
    "close",
    "over",
    "near",
    "next",
    "some",
    "has",
    "have",
    "his",
    "her",
    "their",
    "into",
}


def palabras(texto: str) -> set[str]:
    return {p for p in re.findall(r"[a-z]+", texto.lower()) if p not in STOPWORDS}


def comparar_descripciones(entrada: str, salida: str) -> dict:
    nuevas = palabras(salida) - palabras(entrada)
    fragmentos: list[dict] = []
    for parte in filter(None, re.split(r"([A-Za-z]+)", salida)):
        nuevo = parte.lower() in nuevas
        if fragmentos and fragmentos[-1]["nuevo"] == nuevo:
            fragmentos[-1]["texto"] += parte
        else:
            fragmentos.append({"texto": parte, "nuevo": nuevo})
    cantidad = len(nuevas)
    return {
        "descripcionEntrada": entrada,
        "descripcionSalida": fragmentos,
        "descripcionResumen": "La descripción no suma palabras nuevas."
        if not cantidad
        else f"{cantidad} {'palabra nueva' if cantidad == 1 else 'palabras nuevas'}: "
        "verificá si se ven en la entrada.",
        "descripcionOk": not cantidad,
    }


def comparar_clip(entrada: dict[str, float], salida: dict[str, float], contenido: list[str]) -> dict:
    top_entrada = max(contenido, key=entrada.get)
    top_salida = max(contenido, key=salida.get)
    ok = top_entrada == top_salida
    principales = sorted(contenido, key=entrada.get, reverse=True)[:3]
    return {
        "clip": [
            {"etiqueta": e, "entrada": round(entrada[e], 3), "salida": round(salida[e], 3)}
            for e in principales + CALIDAD
        ],
        "clipResumen": f"El contenido se mantiene: «{top_salida}»."
        if ok
        else f"Cambió el contenido principal: «{top_entrada}» pasó a «{top_salida}».",
        "clipOk": ok,
    }


def comparar_detr(entrada: list[dict], salida: list[dict]) -> dict:
    def mejores(detecciones):
        por_objeto = {}
        for d in detecciones:
            if d["score"] > por_objeto.get(d["label"], {"score": 0})["score"]:
                por_objeto[d["label"]] = d
        return por_objeto

    antes, despues = mejores(entrada), mejores(salida)
    nuevos = sorted(despues.keys() - antes.keys())
    perdidos = sorted(antes.keys() - despues.keys())
    filas = []
    for objeto in sorted(antes.keys() | despues.keys()):
        d = despues.get(objeto) or antes[objeto]
        filas.append(
            {
                "objeto": objeto,
                "entrada": round(antes[objeto]["score"], 3) if objeto in antes else 0,
                "salida": round(despues[objeto]["score"], 3) if objeto in despues else 0,
                "caja": d["caja"],
            }
        )
    if nuevos or perdidos:
        partes = [
            f"aparecen {', '.join(nuevos)}" if nuevos else "",
            f"desaparecen {', '.join(perdidos)}" if perdidos else "",
        ]
        resumen = "Cambian los objetos: " + "; ".join(p for p in partes if p) + "."
    else:
        resumen = "Mismos objetos en la entrada y en la salida." if filas else "No detectó objetos."
    return {
        "detr": filas,
        "detrResumen": resumen,
        "detrOk": not (nuevos or perdidos),
        "nuevos": nuevos,
        "perdidos": perdidos,
    }


def resumir(resultado: dict) -> dict:
    chequeos = [resultado[k] for k in ("clipOk", "descripcionOk", "detrOk") if resultado.get(k) is not None]
    return {"ok": sum(chequeos), "alertas": len(chequeos) - sum(chequeos)}


SIMULADO = {
    **comparar_clip(
        {e: 0.1 for e in CONTENIDO} | {"a photo of an animal": 0.6} | dict(zip(CALIDAD, (0.2, 0.8))),
        {e: 0.05 for e in CONTENIDO} | {"a photo of an animal": 0.7} | dict(zip(CALIDAD, (0.9, 0.1))),
        CONTENIDO,
    ),
    **comparar_descripciones("a blurry picture of an animal", "a close up of a tabby cat with green eyes"),
    "detr": [],
    "detrResumen": "DETR no se usa en modo simulado.",
    "detrOk": None,
    "nuevos": [],
    "perdidos": [],
}


class Verificador:
    def __init__(
        self,
        simulado: bool = config.SIMULADO,
        dispositivo: str = config.DISPOSITIVO,
        detr: bool = config.DETR,
    ):
        self.simulado = simulado
        self.dispositivo = dispositivo
        self.usar_detr = detr
        self._lock = threading.Lock()

    @cached_property
    def clip(self):
        from transformers import pipeline

        return pipeline("zero-shot-image-classification", model=config.MODELO_CLIP, device=self.dispositivo)

    @cached_property
    def blip(self):
        from transformers import BlipForConditionalGeneration, BlipProcessor

        modelo = BlipForConditionalGeneration.from_pretrained(config.MODELO_BLIP).to(self.dispositivo)
        return BlipProcessor.from_pretrained(config.MODELO_BLIP), modelo

    @cached_property
    def detr(self):
        from transformers import pipeline

        return pipeline("object-detection", model=config.MODELO_DETR, device=self.dispositivo)

    def cargar(self) -> None:
        with self._lock:
            if not self.simulado:
                _ = self.clip, self.blip
                if self.usar_detr:
                    _ = self.detr

    def _puntajes_clip(self, imagen: Image.Image, etiquetas: list[str]) -> dict[str, float]:
        return {r["label"]: r["score"] for r in self.clip(imagen, candidate_labels=etiquetas)}

    @torch.no_grad()
    def describir(self, imagen: Image.Image) -> str:
        procesador, modelo = self.blip
        entradas = procesador(images=imagen.convert("RGB"), return_tensors="pt").to(self.dispositivo)
        return procesador.decode(modelo.generate(**entradas, max_new_tokens=30)[0], skip_special_tokens=True)

    def detectar(self, imagen: Image.Image) -> list[dict]:
        ancho, alto = imagen.size
        return [
            {
                "label": d["label"],
                "score": d["score"],
                "caja": {
                    "x": round(d["box"]["xmin"] / ancho * 100, 1),
                    "y": round(d["box"]["ymin"] / alto * 100, 1),
                    "ancho": round((d["box"]["xmax"] - d["box"]["xmin"]) / ancho * 100, 1),
                    "alto": round((d["box"]["ymax"] - d["box"]["ymin"]) / alto * 100, 1),
                },
            }
            for d in self.detr(imagen.convert("RGB"), threshold=config.UMBRAL_DETR)
        ]

    def verificar(
        self, entrada: Image.Image, salida: Image.Image, contenido: list[str] | None = None
    ) -> dict:
        if self.simulado:
            return {**SIMULADO, "resumen": resumir(SIMULADO), "simulado": True}
        self.cargar()
        contenido = contenido or CONTENIDO
        clip = {
            "entrada": self._puntajes_clip(entrada, contenido) | self._puntajes_clip(entrada, CALIDAD),
            "salida": self._puntajes_clip(salida, contenido) | self._puntajes_clip(salida, CALIDAD),
        }
        resultado = {
            **comparar_clip(clip["entrada"], clip["salida"], contenido),
            **comparar_descripciones(self.describir(entrada), self.describir(salida)),
        }
        if self.usar_detr:
            resultado |= comparar_detr(self.detectar(entrada), self.detectar(salida))
        else:
            resultado |= {
                "detr": [],
                "detrResumen": "DETR desactivado.",
                "detrOk": None,
                "nuevos": [],
                "perdidos": [],
            }
        return {**resultado, "resumen": resumir(resultado), "simulado": False}
