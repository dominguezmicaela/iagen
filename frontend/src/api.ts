// Cliente tipado de la API de FastAPI: mismo contrato que devuelve app/trabajos.py.

export type EstadoTrabajo = 'en_cola' | 'restaurando' | 'verificando' | 'listo' | 'error'

export interface Fotograma {
  paso: number
  imagen: string
}

export interface VerificacionApi {
  clip: { etiqueta: string; entrada: number; salida: number }[]
  clipResumen: string
  clipOk: boolean
  detr: { objeto: string; entrada: number; salida: number }[]
  detrResumen: string
  detrOk: boolean | null
  descripcionEntrada: string
  descripcionSalida: { texto: string; nuevo?: boolean }[]
  descripcionResumen: string
  descripcionOk: boolean
  resumen: { ok: number; alertas: number }
  simulado: boolean
}

export interface Zona {
  x: number
  y: number
  titulo: string
  detalle: string
}

export interface Resultado {
  sub_tarea: 'A'
  modelo: string
  parametros: { noise_level: number; steps: number; guidance: number; prompt: string }
  medidas_entrada: string
  medidas_salida: string
  semilla: number
  semillas: { valor: number; imagen: string }[]
  imagenes: { entrada: string; diferencias: string; variacion: string | null }
  fotogramas: Fotograma[]
  porcentajes: { diferencia: number[]; variacion: number[] | null }
  cambio_medio: number
  zonas: Zona[]
  verificacion: VerificacionApi
  tiempos: { restauracion_s: number; verificacion_s: number }
  dispositivo: string
  simulado: boolean
}

export interface Trabajo {
  id: string
  estado: EstadoTrabajo
  etapa: string
  paso: number
  total: number
  segundos_por_paso: number | null
  semilla_indice: number
  semillas_total: number
  fotogramas: Fotograma[]
  error: string | null
  resultado: Resultado | null
}

export interface Parametros {
  noise_level?: number
  steps?: number
  guidance?: number
  seed?: number
}

async function leer<T>(respuesta: Response): Promise<T> {
  if (respuesta.ok) return respuesta.json()
  const cuerpo = await respuesta.json().catch(() => null)
  const detalle = typeof cuerpo?.detail === 'string' ? cuerpo.detail : null
  throw new Error(detalle ?? `El servidor respondió con un error (${respuesta.status}).`)
}

async function pedir(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está corriendo uvicorn?')
  }
}

export async function restaurar(imagen: Blob, nombre: string, parametros: Parametros): Promise<string> {
  const datos = new FormData()
  datos.append('imagen', imagen, nombre)
  datos.append('parametros', JSON.stringify(parametros))
  const { id } = await leer<{ id: string }>(await pedir('/api/restaurar', { method: 'POST', body: datos }))
  return id
}

export async function obtenerTrabajo(id: string): Promise<Trabajo> {
  return leer<Trabajo>(await pedir(`/api/trabajos/${id}`))
}

export const urlDescarga = (id: string) => `/api/trabajos/${id}/descarga.png`
export const urlInforme = (id: string) => `/api/trabajos/${id}/informe.json`

export function descargar(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.click()
}
