import argparse
import threading
import time
from collections.abc import Callable
from pathlib import Path

import torch
from PIL import Image, ImageFilter

from app import config

# Upscaler ×4 por difusión, con carga perezosa y un modo simulado que no necesita GPU ni modelos.

Progreso = Callable[[int, int], None]
Fotograma = Callable[[int, Image.Image], None]

FRACCIONES_FOTOGRAMA = (0.1, 0.3, 0.5, 0.7, 0.9)


def validar(noise_level: int, steps: int, guidance: float) -> None:
    if not 0 <= noise_level <= 350:
        raise ValueError("El nivel de ruido tiene que estar entre 0 y 350.")
    if not 10 <= steps <= 100:
        raise ValueError("Los pasos tienen que estar entre 10 y 100.")
    if not 0 <= guidance <= 15:
        raise ValueError("El guidance tiene que estar entre 0 y 15.")


def preparar_entrada(imagen: Image.Image, max_lado: int) -> Image.Image:
    imagen = imagen.convert("RGB")
    escala = min(1.0, max_lado / max(imagen.size))
    ancho, alto = (max(8, round(lado * escala / 8) * 8) for lado in imagen.size)
    if (ancho, alto) == imagen.size:
        return imagen
    return imagen.resize((ancho, alto), Image.LANCZOS)


def pasos_fotograma(total: int) -> set[int]:
    return {max(1, round(total * f)) for f in FRACCIONES_FOTOGRAMA}


class Restaurador:
    def __init__(self, simulado: bool = config.SIMULADO, dispositivo: str = config.DISPOSITIVO):
        self.simulado = simulado
        self.dispositivo = dispositivo
        self.max_lado = config.MAX_LADO_ENTRADA
        self._pipe = None
        self._lock = threading.Lock()

    @property
    def cargado(self) -> bool:
        return self._pipe is not None

    def cargar(self):
        with self._lock:
            if self._pipe is None and not self.simulado:
                from diffusers import StableDiffusionUpscalePipeline

                dtype = torch.float16 if self.dispositivo == "cuda" else torch.float32
                pipe = StableDiffusionUpscalePipeline.from_pretrained(
                    config.MODELO_RESTAURACION, dtype={"default": dtype, "vae": torch.float32}
                )
                pipe.enable_attention_slicing()
                if config.OFFLOAD and self.dispositivo == "cuda":
                    pipe.enable_model_cpu_offload()
                else:
                    pipe.to(self.dispositivo)
                pipe.set_progress_bar_config(disable=True)
                self._pipe = pipe
        return self._pipe

    def restaurar(
        self,
        imagen: Image.Image,
        *,
        noise_level: int = 20,
        steps: int = 50,
        guidance: float = 7.5,
        prompt: str = config.PROMPT,
        negative_prompt: str = config.NEGATIVE_PROMPT,
        seed: int = 42,
        progreso: Progreso | None = None,
        fotograma: Fotograma | None = None,
    ) -> Image.Image:
        validar(noise_level, steps, guidance)
        entrada = preparar_entrada(imagen, self.max_lado)
        if self.simulado:
            return self._simular(entrada, steps, progreso, fotograma)

        pipe = self.cargar()
        capturar = pasos_fotograma(steps) if fotograma else set()

        def al_paso(i: int, _t, latents: torch.Tensor) -> None:
            if i + 1 in capturar:
                fotograma(i + 1, self._decodificar(latents))
            if progreso:
                progreso(i + 1, steps)

        return pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=entrada,
            noise_level=noise_level,
            num_inference_steps=steps,
            guidance_scale=guidance,
            generator=torch.Generator(self.dispositivo).manual_seed(seed),
            callback=al_paso,
            callback_steps=1,
        ).images[0]

    @torch.no_grad()
    def _decodificar(self, latents: torch.Tensor) -> Image.Image:
        vae = self._pipe.vae
        imagen = vae.decode(latents.to(vae.dtype) / vae.config.scaling_factor).sample
        return self._pipe.image_processor.postprocess(imagen, output_type="pil")[0]

    @staticmethod
    def _simular(entrada: Image.Image, steps: int, progreso: Progreso | None, fotograma: Fotograma | None):
        salida = entrada.resize((entrada.width * 4, entrada.height * 4), Image.LANCZOS)
        salida = salida.filter(ImageFilter.UnsharpMask(radius=2, percent=120, threshold=2))
        capturar = pasos_fotograma(steps)
        for paso in range(1, steps + 1):
            time.sleep(0.01)
            if fotograma and paso in capturar:
                fotograma(paso, salida.filter(ImageFilter.GaussianBlur(12 * (1 - paso / steps))))
            if progreso:
                progreso(paso, steps)
        return salida


def main() -> None:
    parser = argparse.ArgumentParser(description="Super-resolución ×4 con difusión")
    parser.add_argument("imagen", type=Path)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--steps", type=int, default=50)
    parser.add_argument("--noise-level", type=int, default=20)
    parser.add_argument("--guidance", type=float, default=7.5)
    parser.add_argument("--prompt", default=config.PROMPT)
    args = parser.parse_args()

    restaurador = Restaurador()
    inicio = time.perf_counter()
    salida = restaurador.restaurar(
        Image.open(args.imagen),
        seed=args.seed,
        steps=args.steps,
        noise_level=args.noise_level,
        guidance=args.guidance,
        prompt=args.prompt,
        progreso=lambda paso, total: print(f"\rpaso {paso}/{total}", end="", flush=True),
    )
    config.SALIDAS.mkdir(parents=True, exist_ok=True)
    destino = config.SALIDAS / f"{args.imagen.stem}-s{args.seed}.png"
    salida.save(destino)
    print(f"\n{destino} ({salida.width} × {salida.height} px, {time.perf_counter() - inicio:.1f} s)")


if __name__ == "__main__":
    main()
