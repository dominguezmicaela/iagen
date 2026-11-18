import io
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, ValidationError

from app import config
from app.pipeline.restaurar import Restaurador, validar
from app.pipeline.verificar import Verificador
from app.trabajos import GestorTrabajos, descarga, informe

# API de restauración: recibe la imagen, encola el trabajo y sirve resultados y el frontend compilado.

FRONTEND = Path(__file__).resolve().parent.parent / "frontend" / "dist"


class Parametros(BaseModel):
    noise_level: int = 20
    steps: int = 50
    guidance: float = 7.5
    prompt: str = Field(default=config.PROMPT, max_length=300)
    seed: int = Field(default=config.SEMILLA, ge=0, le=2**32 - 1)
    semillas_extra: list[int] = Field(default_factory=lambda: list(config.SEMILLAS_EXTRA), max_length=3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    restaurador, verificador = Restaurador(), Verificador()
    if config.PRECARGAR:
        restaurador.cargar()
        verificador.cargar()
    app.state.gestor = GestorTrabajos(restaurador, verificador)
    yield
    app.state.gestor.cerrar()


app = FastAPI(title="Restauración con difusión", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=config.ORIGENES_DEV, allow_methods=["*"], allow_headers=["*"]
)


def gestor(request: Request) -> GestorTrabajos:
    return request.app.state.gestor


def trabajo_o_404(request: Request, id: str):
    trabajo = gestor(request).obtener(id)
    if trabajo is None:
        raise HTTPException(404, "No existe ese trabajo (puede que se haya borrado de la memoria).")
    return trabajo


def trabajo_listo(request: Request, id: str):
    trabajo = trabajo_o_404(request, id)
    if trabajo.estado != "listo":
        raise HTTPException(409, "El trabajo todavía no terminó.")
    return trabajo


@app.get("/api/salud")
def salud(request: Request):
    g = gestor(request)
    return {
        "dispositivo": g.restaurador.dispositivo,
        "simulado": g.restaurador.simulado,
        "modelos": {
            "restauracion": config.MODELO_RESTAURACION,
            "clip": config.MODELO_CLIP,
            "blip": config.MODELO_BLIP,
            "detr": config.MODELO_DETR if g.verificador.usar_detr else None,
        },
        "semillas_extra": config.SEMILLAS_EXTRA,
    }


@app.post("/api/restaurar")
async def restaurar(
    request: Request, imagen: Annotated[UploadFile, File()], parametros: Annotated[str, Form()] = "{}"
):
    if not (imagen.content_type or "").startswith("image/"):
        raise HTTPException(415, "El archivo tiene que ser una imagen (PNG, JPG o WEBP).")
    datos = await imagen.read(config.MAX_BYTES + 1)
    if len(datos) > config.MAX_BYTES:
        raise HTTPException(413, "La imagen pesa más de 10 MB.")
    try:
        p = Parametros.model_validate(json.loads(parametros))
        validar(p.noise_level, p.steps, p.guidance)
    except (json.JSONDecodeError, ValidationError):
        raise HTTPException(422, "Los parámetros no tienen el formato esperado.") from None
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    try:
        pil = Image.open(io.BytesIO(datos))
        pil.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(
            415, "No se pudo leer la imagen: puede estar dañada o en un formato no soportado."
        ) from None
    return {"id": gestor(request).crear(pil, p.model_dump()).id}


@app.get("/api/trabajos/{id}")
def estado(request: Request, id: str):
    return trabajo_o_404(request, id).estado_publico()


@app.get("/api/trabajos/{id}/imagen/{nombre}")
def imagen(request: Request, id: str, nombre: str):
    datos = trabajo_o_404(request, id).imagenes.get(nombre)
    if datos is None:
        raise HTTPException(404, "No existe esa imagen.")
    return Response(datos, media_type="image/png")


@app.get("/api/trabajos/{id}/descarga.png")
def descargar(request: Request, id: str):
    trabajo = trabajo_listo(request, id)
    return Response(
        descarga(trabajo),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="restaurada-con-ia-{id}.png"'},
    )


@app.get("/api/trabajos/{id}/informe.json")
def descargar_informe(request: Request, id: str):
    trabajo = trabajo_listo(request, id)
    return JSONResponse(
        informe(trabajo), headers={"Content-Disposition": f'attachment; filename="informe-{id}.json"'}
    )


app.mount("/", StaticFiles(directory=FRONTEND, html=True, check_dir=False), name="frontend")
