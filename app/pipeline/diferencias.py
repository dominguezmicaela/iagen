import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

# Mapas de cuánto cambió cada píxel: contra la entrada (diferencias) y entre semillas (variación).

UMBRALES = np.arange(5, 100, 5) / 100


def _a_float(imagen: Image.Image) -> np.ndarray:
    return np.asarray(imagen.convert("RGB"), dtype=np.float32)


def _mapa(valores: np.ndarray) -> dict:
    suave = gaussian_filter(valores, sigma=1)
    tope = np.percentile(suave, 99.5)
    normalizado = np.clip(suave / tope, 0, 1) if tope > 0 else np.zeros_like(suave)
    return {
        "imagen": Image.fromarray(np.round(normalizado * 255).astype(np.uint8), "L"),
        "porcentajes": [round(float((normalizado >= u).mean() * 100), 1) for u in UMBRALES],
    }


def mapa_diferencias(entrada: Image.Image, salida: Image.Image) -> dict:
    base = entrada.convert("RGB").resize(salida.size, Image.BICUBIC)
    diff = np.abs(_a_float(salida) - _a_float(base)).mean(axis=2)
    return {**_mapa(diff), "cambio_medio": round(float(diff.mean() / 255 * 100), 2)}


def mapa_variacion(salidas: list[Image.Image]) -> dict:
    pila = np.stack([_a_float(s) for s in salidas])
    return _mapa(pila.std(axis=0).mean(axis=2))


def _ubicacion(x: float, y: float) -> str:
    fila = ("Arriba", "Al medio", "Abajo")[min(int(y / (100 / 3)), 2)]
    columna = ("a la izquierda", "al centro", "a la derecha")[min(int(x / (100 / 3)), 2)]
    return "En el centro" if (fila, columna) == ("Al medio", "al centro") else f"{fila}, {columna}"


def zonas(mapa: Image.Image, n: int = 4) -> list[dict]:
    valores = gaussian_filter(np.asarray(mapa, dtype=np.float32), sigma=min(mapa.size) * 0.04)
    alto, ancho = valores.shape
    radio = max(1, int(min(alto, ancho) * 0.15))
    encontradas = []
    for i in range(n):
        fila, col = np.unravel_index(np.argmax(valores), valores.shape)
        if valores[fila, col] <= 0:
            break
        x, y = round(col / ancho * 100, 1), round(fila / alto * 100, 1)
        encontradas.append({"x": x, "y": y, "titulo": f"Zona {i + 1}", "detalle": _ubicacion(x, y)})
        valores[max(0, fila - radio) : fila + radio + 1, max(0, col - radio) : col + radio + 1] = 0
    return encontradas
