import io
import json
import time

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import main
from app.pipeline.restaurar import Restaurador
from app.pipeline.verificar import Verificador


@pytest.fixture
def cliente(monkeypatch):
    monkeypatch.setattr(main, "Restaurador", lambda: Restaurador(simulado=True))
    monkeypatch.setattr(main, "Verificador", lambda: Verificador(simulado=True))
    with TestClient(main.app) as c:
        yield c


def _png(tamano=(40, 30)) -> bytes:
    buffer = io.BytesIO()
    Image.effect_noise(tamano, 60).convert("RGB").save(buffer, "PNG")
    return buffer.getvalue()


def _subir(cliente, parametros=None, datos=None, tipo="image/png"):
    return cliente.post(
        "/api/restaurar",
        files={"imagen": ("x.png", datos or _png(), tipo)},
        data={"parametros": json.dumps(parametros or {"steps": 10, "semillas_extra": [7]})},
    )


def _esperar(cliente, id):
    for _ in range(200):
        trabajo = cliente.get(f"/api/trabajos/{id}").json()
        if trabajo["estado"] in ("listo", "error"):
            return trabajo
        time.sleep(0.05)
    raise AssertionError("el trabajo no terminó")


def test_salud(cliente):
    assert cliente.get("/api/salud").json()["simulado"] is True


def test_flujo_completo(cliente):
    trabajo = _esperar(cliente, _subir(cliente).json()["id"])
    assert trabajo["estado"] == "listo", trabajo["error"]
    r = trabajo["resultado"]
    assert r["medidas_entrada"] == "40 × 32 px" and r["medidas_salida"] == "160 × 128 px"
    assert [s["valor"] for s in r["semillas"]] == [42, 7]
    assert len(r["porcentajes"]["diferencia"]) == 19 and len(r["porcentajes"]["variacion"]) == 19
    assert len(r["fotogramas"]) == 5 and r["verificacion"]["simulado"]
    for url in [
        r["imagenes"]["entrada"],
        r["imagenes"]["diferencias"],
        r["imagenes"]["variacion"],
        r["semillas"][1]["imagen"],
    ]:
        assert cliente.get(url).headers["content-type"] == "image/png"

    descarga = cliente.get(f"/api/trabajos/{trabajo['id']}/descarga.png")
    info = Image.open(io.BytesIO(descarga.content)).info
    assert info["modelo"] == r["modelo"] and info["semilla"] == "42"
    assert cliente.get(f"/api/trabajos/{trabajo['id']}/informe.json").json()["semilla"] == 42


@pytest.mark.parametrize(
    ("kwargs", "codigo", "texto"),
    [
        ({"datos": b"no soy una imagen"}, 415, "No se pudo leer"),
        ({"tipo": "text/plain"}, 415, "tiene que ser una imagen"),
        ({"parametros": {"steps": 5}}, 422, "pasos"),
        ({"parametros": {"noise_level": "mucho"}}, 422, "formato"),
    ],
)
def test_errores_claros(cliente, kwargs, codigo, texto):
    respuesta = _subir(cliente, **kwargs)
    assert respuesta.status_code == codigo and texto in respuesta.json()["detail"]


def test_imagen_demasiado_pesada(cliente, monkeypatch):
    monkeypatch.setattr(main.config, "MAX_BYTES", 100)
    assert _subir(cliente).status_code == 413


def test_trabajo_inexistente(cliente):
    assert cliente.get("/api/trabajos/nada").status_code == 404
