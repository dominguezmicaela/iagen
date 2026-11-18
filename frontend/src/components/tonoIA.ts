/**
 * Color de "lo que inventó la IA". Se elige uno y se usa en toda la app.
 * Para comparar: agregá ?ia=ambar, ?ia=coral o ?ia=lavanda a la URL.
 */
export type TonoIA = 'ambar' | 'coral' | 'lavanda'

/** Rampa del mapa de calor (poco → mucho cambio), por canal R, G, B en 0–1. */
export const RAMPAS: Record<TonoIA, { r: string; g: string; b: string }> = {
  ambar: { r: '0.75 0.96 1', g: '0.38 0.71 0.92', b: '0.08 0.27 0.62' },
  coral: { r: '0.78 1 1', g: '0.27 0.54 0.86', b: '0.22 0.42 0.76' },
  lavanda: { r: '0.42 0.71 0.93', g: '0.3 0.61 0.9', b: '0.85 1 1' },
}

export function tonoActual(porDefecto: TonoIA = 'lavanda'): TonoIA {
  const t = new URLSearchParams(window.location.search).get('ia')
  return t === 'ambar' || t === 'coral' || t === 'lavanda' ? t : porDefecto
}
