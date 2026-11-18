import os
from pathlib import Path

import torch

# Todo lo configurable por variables de entorno vive acá.
SIMULADO = os.getenv("RESTAURA_SIMULADO") == "1"
OFFLOAD = os.getenv("RESTAURA_OFFLOAD") == "1"
DISPOSITIVO = "cuda" if torch.cuda.is_available() else "cpu"
MAX_LADO_ENTRADA = int(os.getenv("RESTAURA_MAX_LADO", "256" if DISPOSITIVO == "cuda" else "128"))

MODELO_RESTAURACION = "stabilityai/stable-diffusion-x4-upscaler"
PROMPT = "a high quality photo"
NEGATIVE_PROMPT = "blurry, low quality, jpeg artifacts, distorted, oversaturated"

SALIDAS = Path(os.getenv("RESTAURA_SALIDAS", "salidas"))

MODELO_CLIP = "openai/clip-vit-base-patch32"
MODELO_BLIP = "Salesforce/blip-image-captioning-large"
MODELO_DETR = "facebook/detr-resnet-50"
DETR = os.getenv("RESTAURA_DETR", "1" if DISPOSITIVO == "cuda" else "0") == "1"
UMBRAL_DETR = 0.7
