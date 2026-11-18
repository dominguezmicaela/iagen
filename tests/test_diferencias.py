import numpy as np
from PIL import Image, ImageDraw

from app.pipeline.diferencias import mapa_diferencias, mapa_variacion, zonas


def _ruido(lado: int, semilla: int) -> Image.Image:
    rng = np.random.default_rng(semilla)
    return Image.fromarray(rng.integers(0, 256, (lado, lado, 3), dtype=np.uint8))


def test_imagen_identica_no_cambia():
    entrada = Image.new("RGB", (32, 32), "gray")
    mapa = mapa_diferencias(entrada, entrada.resize((128, 128)))
    assert mapa["cambio_medio"] == 0
    assert mapa["porcentajes"] == [0] * 19
    assert mapa["imagen"].size == (128, 128) and mapa["imagen"].mode == "L"


def test_porcentajes_van_de_mayor_a_menor():
    mapa = mapa_diferencias(_ruido(32, 1), _ruido(128, 2))
    assert len(mapa["porcentajes"]) == 19
    assert mapa["porcentajes"] == sorted(mapa["porcentajes"], reverse=True)
    assert mapa["cambio_medio"] > 0


def test_variacion_entre_salidas_iguales_es_cero():
    salida = _ruido(64, 3)
    assert mapa_variacion([salida, salida.copy()])["porcentajes"] == [0] * 19
    assert mapa_variacion([salida, _ruido(64, 4)])["porcentajes"][0] > 0


def test_zonas_encuentra_los_cambios_separados():
    mapa = Image.new("L", (200, 200))
    dibujo = ImageDraw.Draw(mapa)
    dibujo.ellipse((10, 10, 40, 40), fill=255)
    dibujo.ellipse((150, 150, 190, 190), fill=200)
    encontradas = zonas(mapa, n=4)
    assert len(encontradas) >= 2
    assert encontradas[0]["detalle"] == "Arriba, a la izquierda"
    assert encontradas[1]["detalle"] == "Abajo, a la derecha"
    assert [z["titulo"] for z in encontradas[:2]] == ["Zona 1", "Zona 2"]


def test_sin_cambios_no_hay_zonas():
    assert zonas(Image.new("L", (64, 64))) == []
