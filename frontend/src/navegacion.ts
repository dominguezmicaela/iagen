// Las cuatro pantallas y la navegación entre ellas con "#/pantalla":
// funciona en cualquier hosting estático sin configurar rutas.

export const PANTALLAS = [
  { id: 'subir', numero: '1', nombre: 'Subir' },
  { id: 'restaurar', numero: '2', nombre: 'Restaurar' },
  { id: 'revisar', numero: '3', nombre: 'Revisar' },
  { id: 'lampara', numero: '4', nombre: 'Lámpara UV' },
] as const

export type PantallaId = (typeof PANTALLAS)[number]['id']

export function leerHash(): PantallaId {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (PANTALLAS.find((p) => p.id === h)?.id ?? 'subir') as PantallaId
}

export function irA(p: PantallaId) {
  window.location.hash = `/${p}`
}
