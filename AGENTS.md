# Instrucciones para agentes

Proyecto: TP Integrador 2 (IFTS). Super-resolución ×4 con difusión, con verificación de qué es real y qué es inventado. Leé el `README.md` antes de cambiar algo.

## Stack

- Python 3.12 con **uv** (nunca `pip` directo). PyTorch viene del índice CUDA 12.8 (`pyproject.toml`): la GPU es una RTX 5060 Ti (sm_120).
- Backend: FastAPI + diffusers + transformers, en `app/`.
- Frontend: React 19 + TypeScript + Vite + Tailwind 4, en `frontend/`. El build (`frontend/dist`) **se versiona**, para que el repo corra sin Node.

## Comandos

```bash
uv sync                              # entorno
uv run iniciar.py                    # app completa (compila el front si cambió)
uv run iniciar.py --simulado         # sin GPU ni modelos
uv run pytest                        # pruebas del backend (usan modo simulado)
uv run ruff check . && uv run ruff format --check .
cd frontend && npm test && npm run lint && npm run build
```

## Reglas

- Un cambio, un commit, con mensaje en español del estilo `feat:`, `fix:`, `test:`, `docs:` o `chore:`.
- Toda función nueva del pipeline lleva una prueba que corra **sin GPU** (modo simulado o imágenes sintéticas).
- Si cambiás el frontend, recompilá y commiteá `frontend/dist` junto con el cambio.
- Nombres, comentarios y textos de la interfaz en **español rioplatense** y sin jerga para la persona usuaria.
- Los errores que ve la persona se escriben en lenguaje simple y dicen qué hacer.
- El contrato de la API vive en `app/trabajos.py` (`estado_publico`, `_resultado`) y en `frontend/src/api.ts`: cambialos juntos.
- Toda la configuración va en `app/config.py`, leída de variables de entorno `RESTAURA_*`.
- Nunca quitar los avisos de "reconstruido por IA" ni la marca de la descarga: son el centro del proyecto.
- No subir tokens, `.env`, modelos ni la carpeta `salidas/`.
