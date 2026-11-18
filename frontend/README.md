# Frontend

Interfaz en React 19 + TypeScript + Tailwind CSS 4 sobre Vite. La documentación completa del proyecto está en el [README principal](../README.md).

## Concepto

Los restauradores de arte revisan los cuadros bajo **luz ultravioleta**: lo original queda opaco y los retoques se ven distinto. Esta app hace lo mismo con la IA: **lo que se ilumina, lo inventó el modelo**.

- Negro profundo, superficies carbón y un solo color de marca (lavanda), que además marca todo lo inventado. Otros tonos con `?ia=ambar` o `?ia=coral`.
- Herramientas: lupa ×2, mantener para ver el original, lámpara UV arrastrable y atajos de teclado (L, Espacio, U, Z).
- Tipografía *Figtree* (vía Fontsource). Tokens en `src/index.css`.

## Pantallas

| # | Ruta | Qué muestra |
|---|------|-------------|
| 1 | `#/subir` | Carga de imagen, qué va a inventar el modelo, ajustes y libertad para inventar |
| 2 | `#/restaurar` | La difusión paso a paso: progreso real, fases y fotogramas intermedios |
| 3 | `#/revisar` | Antes/después, otras semillas, aviso de detalle inventado y chequeo con CLIP, BLIP y DETR |
| 4 | `#/lampara` | Lámpara UV: lo inventado brilla. Contra tu foto o entre semillas, con zonas y exportación |

## Datos

- **Modo real** (por defecto): todo sale de la API (`src/api.ts`) y se arma en `src/datos/vista.ts`.
- **Modo demo** (`?demo=1`): usa los datos de ejemplo de `src/datos/ejemplo.ts` y no necesita backend. Esas "salidas" son ilustrativas, no las generó un modelo.

## Comandos

```bash
npm ci
npm run dev      # :5173, con proxy de /api a :8000
npm test
npm run lint
npm run build    # genera dist/, que se versiona y sirve FastAPI
```
