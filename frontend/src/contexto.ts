import { createContext, useContext } from 'react'
import type { Trabajo } from './api'
import { ES_EJEMPLO, type SubTareaId } from './datos/ejemplo'
import { datosDemo, datosReales, type Datos } from './datos/vista'
import type { PantallaId } from './navegacion'

// Forma del estado compartido y los hooks para leerlo. El proveedor vive en estado.tsx.

export interface Estado {
  pantalla: PantallaId
  subTarea: SubTareaId
  setSubTarea: (s: SubTareaId) => void
  semilla: number
  setSemilla: (s: number) => void
  archivoPropio: ArchivoPropio | null
  setArchivoPropio: (a: ArchivoPropio | null) => void
  /** Qué imagen eligió la persona en la pantalla Cargar. */
  entradaElegida: SubTareaId | 'propia' | null
  setEntradaElegida: (e: SubTareaId | 'propia' | null) => void
  /** Valores de los parámetros que la persona ajustó (por sub-tarea). */
  ajustes: Partial<Record<SubTareaId, Record<string, number>>>
  setAjuste: (t: SubTareaId, clave: string, valor: number) => void
  /** Qué mapa se ve en Analizar. */
  modoMapa: ModoMapa
  setModoMapa: (m: ModoMapa) => void
  /** El trabajo que se está mostrando, tal como lo devuelve la API. */
  trabajo: Trabajo | null
  historial: Restauracion[]
  abrir: (id: string) => void
  enviando: boolean
  /** Manda la imagen elegida y los ajustes al backend y pasa a Restaurar. */
  iniciar: () => Promise<void>
}

export interface ArchivoPropio {
  url: string
  nombre: string
  archivo: File
}

export interface Restauracion {
  id: string
  archivo: string
  miniatura: string
}

export type ModoMapa = 'diferencia' | 'variacion'

export const Ctx = createContext<Estado | null>(null)

export function useEstado() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEstado fuera de ProveedorEstado')
  return v
}

/** Datos de la restauración en pantalla: los de ejemplo en modo demo, los del backend si no. */
export function useDatos(): Datos | null {
  const { subTarea, trabajo, historial } = useEstado()
  if (ES_EJEMPLO) return datosDemo(subTarea)
  if (!trabajo?.resultado) return null
  return datosReales(trabajo.id, trabajo.resultado, historial.find((h) => h.id === trabajo.id)?.archivo ?? 'Tu imagen')
}
