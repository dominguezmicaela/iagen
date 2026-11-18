from PIL import Image

from app.pipeline.verificar import CALIDAD, Verificador, comparar_clip, comparar_descripciones, comparar_detr


def test_descripcion_marca_palabras_nuevas_sin_stopwords():
    r = comparar_descripciones("a blurry picture of a cat", "a close up of a tabby cat")
    assert [f["texto"] for f in r["descripcionSalida"] if f["nuevo"]] == ["tabby"]
    assert "".join(f["texto"] for f in r["descripcionSalida"]) == "a close up of a tabby cat"
    assert r["descripcionOk"] is False


def test_descripcion_igual_esta_ok():
    r = comparar_descripciones("a cat on a sofa", "a cat on the sofa")
    assert r["descripcionOk"] and not any(f["nuevo"] for f in r["descripcionSalida"])


def test_clip_ok_si_el_top_de_contenido_no_cambia():
    contenido = ["a cat", "a dog"]
    calidad = dict(zip(CALIDAD, (0.5, 0.5)))
    assert comparar_clip(
        {"a cat": 0.8, "a dog": 0.2} | calidad, {"a cat": 0.9, "a dog": 0.1} | calidad, contenido
    )["clipOk"]
    cambio = comparar_clip(
        {"a cat": 0.8, "a dog": 0.2} | calidad, {"a cat": 0.3, "a dog": 0.7} | calidad, contenido
    )
    assert not cambio["clipOk"] and len(cambio["clip"]) == 4


def test_detr_detecta_nuevos_y_perdidos():
    caja = {"x": 0, "y": 0, "ancho": 10, "alto": 10}
    r = comparar_detr(
        [{"label": "cat", "score": 0.9, "caja": caja}, {"label": "cup", "score": 0.8, "caja": caja}],
        [{"label": "cat", "score": 0.95, "caja": caja}, {"label": "dog", "score": 0.75, "caja": caja}],
    )
    assert r["nuevos"] == ["dog"] and r["perdidos"] == ["cup"] and not r["detrOk"]
    assert {f["objeto"]: (f["entrada"], f["salida"]) for f in r["detr"]}["dog"] == (0, 0.75)


def test_modo_simulado_no_carga_modelos():
    r = Verificador(simulado=True).verificar(Image.new("RGB", (8, 8)), Image.new("RGB", (32, 32)))
    assert r["simulado"] and r["resumen"] == {"ok": 1, "alertas": 1}
