import io
import json
import threading
import time
import uuid
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime

import torch
from PIL import Image, ImageDraw, ImageFont
from PIL.PngImagePlugin import PngInfo

from app import config
from app.pipeline.diferencias import mapa_diferencias, mapa_variacion, zonas
from app.pipeline.restaurar import Restaurador, preparar_entrada
from app.pipeline.verificar import Verificador

# Cola de un solo hilo: nunca corren dos difusiones a la vez en la GPU.


def png(imagen: Image.Image, info: PngInfo | None = None) -> bytes:
    buffer = io.BytesIO()
    imagen.save(buffer, "PNG", pnginfo=info)
    return buffer.getvalue()


@dataclass
class Trabajo:
    parametros: dict
    entrada: Image.Image
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    creado: str = field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    estado: str = "en_cola"
    etapa: str = "Esperando turno"
    paso: int = 0
    total: int = 0
    segundos_por_paso: float | None = None
    semilla_indice: int = 0
    semillas_total: int = 1
    error: str | None = None
    resultado: dict | None = None
    imagenes: dict[str, bytes] = field(default_factory=dict)
    fotogramas: list[dict] = field(default_factory=list)

    def url(self, nombre: str) -> str:
        return f"/api/trabajos/{self.id}/imagen/{nombre}"

    def guardar(self, nombre: str, imagen: Image.Image) -> str:
        self.imagenes[nombre] = png(imagen)
        return self.url(nombre)

    def estado_publico(self) -> dict:
        return {
            "id": self.id,
            "estado": self.estado,
            "etapa": self.etapa,
            "paso": self.paso,
            "total": self.total,
            "segundos_por_paso": self.segundos_por_paso,
            "semilla_indice": self.semilla_indice,
            "semillas_total": self.semillas_total,
            "fotogramas": self.fotogramas,
            "error": self.error,
            "resultado": self.resultado,
        }


class GestorTrabajos:
    def __init__(self, restaurador: Restaurador, verificador: Verificador):
        self.restaurador = restaurador
        self.verificador = verificador
        self.trabajos: OrderedDict[str, Trabajo] = OrderedDict()
        self._lock = threading.Lock()
        self._cola = ThreadPoolExecutor(max_workers=1)

    def crear(self, imagen: Image.Image, parametros: dict) -> Trabajo:
        trabajo = Trabajo(parametros=parametros, entrada=preparar_entrada(imagen, self.restaurador.max_lado))
        with self._lock:
            self.trabajos[trabajo.id] = trabajo
            while len(self.trabajos) > config.MAX_TRABAJOS:
                self.trabajos.popitem(last=False)
        self._cola.submit(self._procesar, trabajo)
        return trabajo

    def obtener(self, id: str) -> Trabajo | None:
        return self.trabajos.get(id)

    def cerrar(self) -> None:
        self._cola.shutdown(wait=False, cancel_futures=True)

    def _restaurar(self, trabajo: Trabajo, semilla: int, etapa: str, principal: bool) -> Image.Image:
        p = trabajo.parametros
        trabajo.etapa, trabajo.paso, trabajo.total = etapa, 0, p["steps"]
        inicio = time.perf_counter()

        def progreso(paso: int, total: int) -> None:
            trabajo.paso, trabajo.total = paso, total
            trabajo.segundos_por_paso = round((time.perf_counter() - inicio) / paso, 3)

        def fotograma(paso: int, imagen: Image.Image) -> None:
            trabajo.fotogramas.append(
                {"paso": paso, "imagen": trabajo.guardar(f"paso-{paso:02d}.png", imagen)}
            )

        return self.restaurador.restaurar(
            trabajo.entrada,
            noise_level=p["noise_level"],
            steps=p["steps"],
            guidance=p["guidance"],
            prompt=p["prompt"],
            seed=semilla,
            progreso=progreso,
            fotograma=fotograma if principal else None,
        )

    def _procesar(self, trabajo: Trabajo) -> None:
        try:
            p = trabajo.parametros
            semillas = [p["seed"], *(s for s in p["semillas_extra"] if s != p["seed"])]
            trabajo.estado, trabajo.semillas_total = "restaurando", len(semillas)
            inicio = time.perf_counter()
            salidas = []
            for i, semilla in enumerate(semillas):
                trabajo.semilla_indice = i
                etapa = (
                    "Inventa el detalle fino"
                    if i == 0
                    else f"Prueba otra semilla ({i + 1} de {len(semillas)})"
                )
                salidas.append(self._restaurar(trabajo, semilla, etapa, principal=i == 0))
            restauracion_s = time.perf_counter() - inicio

            trabajo.estado, trabajo.etapa = "verificando", "Calcula los mapas de cambio"
            diferencias = mapa_diferencias(trabajo.entrada, salidas[0])
            variacion = mapa_variacion(salidas) if len(salidas) > 1 else None

            trabajo.etapa = "Verifica con CLIP, BLIP y DETR"
            inicio = time.perf_counter()
            verificacion = self.verificador.verificar(trabajo.entrada, salidas[0])
            verificacion_s = time.perf_counter() - inicio

            trabajo.resultado = self._resultado(
                trabajo,
                semillas,
                salidas,
                diferencias,
                variacion,
                verificacion,
                restauracion_s,
                verificacion_s,
            )
            trabajo.estado, trabajo.etapa = "listo", "Listo"
        except torch.OutOfMemoryError:
            self._fallar(
                trabajo, "La GPU se quedó sin memoria. Probá con RESTAURA_OFFLOAD=1 o con menos pasos."
            )
        except Exception as error:  # noqa: BLE001
            self._fallar(trabajo, f"No se pudo procesar la imagen: {error}")

    @staticmethod
    def _fallar(trabajo: Trabajo, mensaje: str) -> None:
        trabajo.estado, trabajo.etapa, trabajo.error = "error", "Error", mensaje

    def _resultado(
        self, trabajo, semillas, salidas, diferencias, variacion, verificacion, restauracion_s, verificacion_s
    ):
        entrada, salida = trabajo.entrada, salidas[0]
        imagenes = {
            "entrada": trabajo.guardar("entrada.png", entrada),
            "diferencias": trabajo.guardar("diferencias.png", diferencias["imagen"]),
            "variacion": trabajo.guardar("variacion.png", variacion["imagen"]) if variacion else None,
        }
        return {
            "sub_tarea": "A",
            "modelo": config.MODELO_RESTAURACION,
            "parametros": {k: trabajo.parametros[k] for k in ("noise_level", "steps", "guidance", "prompt")},
            "medidas_entrada": f"{entrada.width} × {entrada.height} px",
            "medidas_salida": f"{salida.width} × {salida.height} px",
            "semilla": semillas[0],
            "semillas": [
                {"valor": s, "imagen": trabajo.guardar(f"salida-{s}.png", img)}
                for s, img in zip(semillas, salidas)
            ],
            "imagenes": imagenes,
            "fotogramas": trabajo.fotogramas,
            "porcentajes": {
                "diferencia": diferencias["porcentajes"],
                "variacion": variacion["porcentajes"] if variacion else None,
            },
            "cambio_medio": diferencias["cambio_medio"],
            "zonas": zonas(diferencias["imagen"]),
            "verificacion": verificacion,
            "tiempos": {
                "restauracion_s": round(restauracion_s, 1),
                "verificacion_s": round(verificacion_s, 1),
            },
            "dispositivo": self.restaurador.dispositivo,
            "simulado": self.restaurador.simulado,
        }


def descarga(trabajo: Trabajo) -> bytes:
    r = trabajo.resultado
    salida = Image.open(io.BytesIO(trabajo.imagenes[f"salida-{r['semilla']}.png"])).convert("RGBA")
    capa = Image.new("RGBA", salida.size)
    dibujo = ImageDraw.Draw(capa)
    fuente = ImageFont.load_default(size=max(12, salida.width // 30))
    texto = "Restaurada con IA"
    x0, y0, x1, y1 = dibujo.textbbox((0, 0), texto, font=fuente)
    margen = fuente.size // 2
    caja = (margen, salida.height - (y1 - y0) - 3 * margen, x1 - x0 + 3 * margen, salida.height - margen)
    dibujo.rectangle(caja, fill=(0, 0, 0, 160))
    dibujo.text((caja[0] + margen - x0, caja[1] + margen - y0), texto, font=fuente, fill=(255, 255, 255, 230))
    info = PngInfo()
    info.add_text("Software", "Restaurada con IA")
    info.add_text("modelo", r["modelo"])
    info.add_text("semilla", str(r["semilla"]))
    info.add_text("parametros", json.dumps(r["parametros"], ensure_ascii=False))
    return png(Image.alpha_composite(salida, capa).convert("RGB"), info)


def informe(trabajo: Trabajo) -> dict:
    return {"id": trabajo.id, "creado": trabajo.creado, **trabajo.resultado}
