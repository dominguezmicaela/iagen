"""Arranca la app completa con un solo comando: `uv run iniciar.py`.

Compila el frontend si hace falta (y si hay Node), levanta la API con uvicorn y abre el navegador.
Con `--simulado` corre sin GPU ni modelos, para probar la interfaz.
"""

import argparse
import os
import shutil
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FRONTEND = RAIZ / "frontend"
DIST = FRONTEND / "dist" / "index.html"


def ultima_modificacion(carpeta: Path) -> float:
    return max((p.stat().st_mtime for p in carpeta.rglob("*") if p.is_file()), default=0)


def frontend_desactualizado() -> bool:
    if not DIST.exists():
        return True
    fuentes = max(ultima_modificacion(FRONTEND / "src"), (FRONTEND / "index.html").stat().st_mtime)
    return fuentes > DIST.stat().st_mtime


def compilar_frontend() -> None:
    npm = shutil.which("npm")
    if npm is None:
        if DIST.exists():
            print("Aviso: no encontré Node/npm; uso el frontend ya compilado en frontend/dist.")
            return
        sys.exit(
            "Falta frontend/dist y no encontré Node/npm para compilarlo. Instalá Node 20+ o bajá el repo completo."
        )
    if not (FRONTEND / "node_modules").exists():
        print("Instalando dependencias del frontend (npm ci)...")
        subprocess.run([npm, "ci", "--no-audit", "--no-fund"], cwd=FRONTEND, check=True)
    print("Compilando el frontend (npm run build)...")
    subprocess.run([npm, "run", "build"], cwd=FRONTEND, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Restauración con difusión: arranca la app")
    parser.add_argument("--simulado", action="store_true", help="sin GPU ni modelos (resultados simulados)")
    parser.add_argument("--puerto", type=int, default=8000)
    parser.add_argument("--sin-navegador", action="store_true", help="no abrir el navegador")
    parser.add_argument("--compilar", action="store_true", help="recompilar el frontend aunque esté al día")
    args = parser.parse_args()

    if args.simulado:
        os.environ["RESTAURA_SIMULADO"] = "1"
    if args.compilar or frontend_desactualizado():
        compilar_frontend()

    # Se importa recién acá para que app.config lea las variables de entorno ya definidas.
    import uvicorn

    url = f"http://127.0.0.1:{args.puerto}"
    print(f"\nAbrí {url} (modo {'simulado' if args.simulado else 'real'}). Ctrl+C para cortar.\n")
    if not args.sin_navegador:
        threading.Timer(2, webbrowser.open, [url]).start()
    uvicorn.run("app.main:app", host="127.0.0.1", port=args.puerto)


if __name__ == "__main__":
    main()
