# Restauración con difusión · Mockup

Mockup navegable del MVP del **TP Integrador 2**: restauración y mejora de imágenes con modelos de difusión, con verificación visual y foco en una pregunta: *¿qué parte es real y qué parte es inventada?*

> Todo lo que se ve son **datos de ejemplo** (ver más abajo). No hay modelos corriendo.

## Concepto

Los restauradores de arte revisan los cuadros bajo **luz ultravioleta**: lo original queda opaco y los retoques se ven distinto. Esta app hace lo mismo con la IA: **lo que se ilumina, lo inventó el modelo**.

- **Estilo de app de streaming:** negro profundo, superficies carbón y un solo color de marca (lavanda), que además marca todo lo inventado.
- **Layout:** barra lateral con los pasos y "Tus restauraciones", contenido central con la imagen y filas de tarjetas, panel derecho y una barra inferior fija con la acción principal (como un reproductor).
- **Herramientas:** lupa ×2, mantener para ver el original, lámpara UV arrastrable, atajos de teclado (L, Espacio, U, Z) y avisos al descargar.
- Tipografía: *Figtree* (incluida vía Fontsource). Tokens en `src/index.css`. Otros tonos para lo inventado con `?ia=ambar` o `?ia=coral`.

## Pantallas

| # | Ruta | Qué muestra |
|---|------|-------------|
| 1 | `#/subir` | Carga de imagen, qué querés arreglar (y qué va a inventar), ajustes y libertad para inventar |
| 2 | `#/restaurar` | La difusión paso a paso: progreso, fases y fotogramas intermedios |
| 3 | `#/revisar` | Antes/después, otras semillas, aviso de detalle inventado y chequeo con CLIP, DETR y BLIP |
| 4 | `#/lampara` | Lámpara UV arrastrable: lo inventado brilla. Contra tu foto o entre semillas, zonas numeradas y exportación |

## Stack

React 19 + TypeScript + Tailwind CSS v4 sobre Vite. Íconos con `lucide-react`.

## Uso

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # genera dist/ listo para hostear
npm run preview  # sirve dist/ localmente
```

## Hosting

`dist/` es un sitio estático con rutas relativas (`base: './'`) y navegación por `#`, así que no necesita configurar redirecciones:

- **Vercel / Netlify:** importás el repo; detectan Vite solos (build `npm run build`, salida `dist`).
- **GitHub Pages:** subís el contenido de `dist/` a la rama o carpeta que publique Pages. Funciona también en un subdirectorio.
- **FastAPI (monolito):** `app.mount("/", StaticFiles(directory="dist", html=True))` al final de tu `main.py`, después de las rutas de la API.

## Datos de ejemplo

Todo el contenido sale de [`src/datos/ejemplo.ts`](src/datos/ejemplo.ts):

- Las "salidas" son la foto original escalada (no las generó un modelo de difusión) y las variantes por semilla son simuladas.
- Los puntajes de CLIP, DETR y las descripciones de BLIP son ilustrativos.
- Los mapas de diferencias / variación y sus porcentajes por umbral **sí** están calculados (numpy) sobre esas imágenes.

Para conectarlo al backend, reemplazá esas constantes por respuestas de la API respetando los mismos tipos. La interfaz no necesita cambios.

Imagen de ejemplo: *Chelsea the cat*, incluida en `scikit-image` (dominio público, CC0).

## Estructura

```
src/
  datos/ejemplo.ts        datos de ejemplo (único lugar a reemplazar)
  estado.tsx              estado global + navegación por hash
  components/             BarraLateral, Comparador, LamparaUV, avisos, movimiento, ui
  pantallas/              Cargar, Revelando, Comparar, Analizar
  index.css               tokens de Tailwind (paleta y tipografías) y utilidades
```
