import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SubTareaId } from './datos/ejemplo'

export const PANTALLAS = [
  { id: 'subir', numero: '1', nombre: 'Subir' },
  { id: 'restaurar', numero: '2', nombre: 'Restaurar' },
  { id: 'revisar', numero: '3', nombre: 'Revisar' },
  { id: 'lampara', numero: '4', nombre: 'Lámpara UV' },
] as const

export type PantallaId = (typeof PANTALLAS)[number]['id']

/** Navegación con "#/pantalla": funciona en cualquier hosting estático sin configurar rutas. */
function leerHash(): PantallaId {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (PANTALLAS.find((p) => p.id === h)?.id ?? 'subir') as PantallaId
}

export function irA(p: PantallaId) {
  window.location.hash = `/${p}`
}

interface Estado {
  pantalla: PantallaId
  subTarea: SubTareaId
  setSubTarea: (s: SubTareaId) => void
  semilla: number
  setSemilla: (s: number) => void
  archivoPropio: { url: string; nombre: string } | null
  setArchivoPropio: (a: { url: string; nombre: string } | null) => void
  /** Qué imagen eligió la persona en la pantalla Cargar. */
  entradaElegida: SubTareaId | 'propia' | null
  setEntradaElegida: (e: SubTareaId | 'propia' | null) => void
  /** Valores de los parámetros que la persona ajustó (por sub-tarea). */
  ajustes: Partial<Record<SubTareaId, Record<string, number>>>
  setAjuste: (t: SubTareaId, clave: string, valor: number) => void
  /** Qué mapa se ve en Analizar. */
  modoMapa: ModoMapa
  setModoMapa: (m: ModoMapa) => void
}

export type ModoMapa = 'diferencia' | 'variacion'

const Ctx = createContext<Estado | null>(null)

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [pantalla, setPantalla] = useState<PantallaId>(leerHash)
  const [subTarea, setSubTarea] = useState<SubTareaId>('A')
  const [semilla, setSemilla] = useState(42)
  const [archivoPropio, setArchivoPropio] = useState<{ url: string; nombre: string } | null>(null)
  const [entradaElegida, setEntradaElegida] = useState<SubTareaId | 'propia' | null>(null)
  const [modoMapa, setModoMapa] = useState<ModoMapa>('diferencia')
  const [ajustes, setAjustes] = useState<Partial<Record<SubTareaId, Record<string, number>>>>({})
  const setAjuste = (t: SubTareaId, clave: string, valor: number) => setAjustes((a) => ({ ...a, [t]: { ...a[t], [clave]: valor } }))

  useEffect(() => {
    const alCambiar = () => {
      setPantalla(leerHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  return (
    <Ctx.Provider value={{ pantalla, subTarea, setSubTarea, semilla, setSemilla, archivoPropio, setArchivoPropio, entradaElegida, setEntradaElegida, modoMapa, setModoMapa, ajustes, setAjuste }}>
      {children}
    </Ctx.Provider>
  )
}

export function useEstado() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useEstado fuera de ProveedorEstado')
  return v
}
