import pytest
from PIL import Image

from app.pipeline.restaurar import Restaurador, pasos_fotograma, preparar_entrada


@pytest.fixture
def restaurador():
    return Restaurador(simulado=True)


def test_agranda_x4_y_limita_la_entrada(restaurador):
    restaurador.max_lado = 64
    salida = restaurador.restaurar(Image.new("RGB", (200, 100), "red"), steps=10)
    assert salida.size == (256, 128)


def test_no_agranda_entradas_chicas():
    assert preparar_entrada(Image.new("RGB", (40, 24)), 128).size == (40, 24)


def test_misma_semilla_misma_salida(restaurador):
    imagen = Image.effect_noise((48, 32), 50).convert("RGB")
    a = restaurador.restaurar(imagen, seed=42, steps=10)
    b = restaurador.restaurar(imagen, seed=42, steps=10)
    assert a.tobytes() == b.tobytes()


def test_reporta_progreso_y_fotogramas(restaurador):
    pasos, fotogramas = [], []
    restaurador.restaurar(
        Image.new("RGB", (32, 32)),
        steps=20,
        progreso=lambda paso, total: pasos.append((paso, total)),
        fotograma=lambda paso, img: fotogramas.append(paso),
    )
    assert pasos[-1] == (20, 20) and len(pasos) == 20
    assert fotogramas == sorted(pasos_fotograma(20)) and len(fotogramas) == 5


@pytest.mark.parametrize(
    "parametros",
    [{"noise_level": 351}, {"steps": 9}, {"steps": 101}, {"guidance": -1}, {"guidance": 15.5}],
)
def test_valida_rangos(restaurador, parametros):
    with pytest.raises(ValueError):
        restaurador.restaurar(Image.new("RGB", (32, 32)), **parametros)
