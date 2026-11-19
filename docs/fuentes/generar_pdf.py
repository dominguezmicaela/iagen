"""Genera docs/SRS.pdf y docs/Manual_de_usuario.pdf a partir de los HTML de esta carpeta.

Usa Microsoft Edge sin ventana para imprimir y pypdf para numerar el índice en dos pasadas:
primero imprime con el índice sin números, busca en qué página quedó cada título y vuelve a imprimir.

Uso:  uv run --with pypdf python docs/fuentes/generar_pdf.py
"""

import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader

AQUI = Path(__file__).resolve().parent
DOCS = AQUI.parent
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
DOCUMENTOS = {"srs.html": "SRS.pdf", "manual.html": "Manual_de_usuario.pdf"}

TITULO = re.compile(r'<h([23])(?: class="capitulo")?>(.*?)</h\1>', re.DOTALL)


def titulos(fuente: str) -> list[tuple[int, str]]:
    """Títulos numerados (h2 y h3) en orden, sin el del índice."""
    salida = []
    for nivel, texto in TITULO.findall(fuente):
        limpio = html.unescape(re.sub(r"<[^>]+>", "", texto)).strip()
        if re.match(r"\d", limpio):
            salida.append((int(nivel), limpio))
    return salida


def indice(entradas: list[tuple[int, str]], paginas: dict[str, int]) -> str:
    filas = []
    for nivel, texto in entradas:
        n = paginas.get(texto, "")
        filas.append(
            f'<li class="n{nivel - 1}"><span class="t">{html.escape(texto)}</span>'
            f'<span class="relleno"></span><span class="n">{n}</span></li>'
        )
    return "<ol>\n" + "\n".join(filas) + "\n</ol>"


def imprimir(html_origen: Path, pdf: Path) -> None:
    with tempfile.TemporaryDirectory() as perfil:
        subprocess.run(
            [
                str(EDGE),
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--user-data-dir={perfil}",
                f"--print-to-pdf={pdf}",
                html_origen.as_uri(),
            ],
            check=True,
            capture_output=True,
        )


def normalizar(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip().casefold()


def ubicar(pdf: Path, entradas: list[tuple[int, str]]) -> dict[str, int]:
    """Página de cada título: la primera aparición después de la página del índice (que ocupa una sola)."""
    paginas = [normalizar(p.extract_text() or "") for p in PdfReader(pdf).pages]
    inicio = next(i for i, t in enumerate(paginas) if "índice" in t) + 1
    ubicadas = {}
    for _, texto in entradas:
        for i in range(inicio, len(paginas)):
            if texto.casefold() in paginas[i]:
                ubicadas[texto] = i + 1
                break
    faltan = [t for _, t in entradas if t not in ubicadas]
    if faltan:
        sys.exit(f"No encontré estos títulos en el PDF: {faltan}")
    return ubicadas


def generar(nombre: str, destino: str) -> None:
    fuente = (AQUI / nombre).read_text(encoding="utf-8")
    entradas = titulos(fuente)
    temporal = AQUI / f"_{nombre}"
    pdf = DOCS / destino
    try:
        temporal.write_text(fuente.replace("<!--INDICE-->", indice(entradas, {})), encoding="utf-8")
        imprimir(temporal, pdf)
        paginas = ubicar(pdf, entradas)
        temporal.write_text(fuente.replace("<!--INDICE-->", indice(entradas, paginas)), encoding="utf-8")
        imprimir(temporal, pdf)
    finally:
        temporal.unlink(missing_ok=True)
    print(f"{destino}: {len(PdfReader(pdf).pages)} páginas")


if __name__ == "__main__":
    for nombre, destino in DOCUMENTOS.items():
        generar(nombre, destino)
