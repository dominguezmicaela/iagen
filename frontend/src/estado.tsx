import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { obtenerTrabajo, restaurar, type Trabajo } from './api'
import { ES_EJEMPLO, SUB_TAREAS, type SubTareaId } from './datos/ejemplo'
import { datosDemo, datosReales, type Datos } from './datos/vista'

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

const TERMINADO = ['listo', 'error']

export type ModoMapa = 'diferencia' | 'variacion'

const Ctx = createContext<Estado | null>(null)

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [pantalla, setPantalla] = useState<PantallaId>(leerHash)
  const [subTarea, setSubTarea] = useState<SubTareaId>('A')
  const [semilla, setSemilla] = useState(42)
  const [archivoPropio, setArchivoPropio] = useState<ArchivoPropio | null>(null)
  const [entradaElegida, setEntradaElegida] = useState<SubTareaId | 'propia' | null>(null)
  const [modoMapa, setModoMapa] = useState<ModoMapa>('diferencia')
  const [ajustes, setAjustes] = useState<Partial<Record<SubTareaId, Record<string, number>>>>({})
  const setAjuste = (t: SubTareaId, clave: string, valor: number) => setAjustes((a) => ({ ...a, [t]: { ...a[t], [clave]: valor } }))
  const [trabajoId, setTrabajoId] = useState<string | null>(null)
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null)
  const [historial, setHistorial] = useState<Restauracion[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!trabajoId) return
    let vigente = true
    let espera = 0
    const consultar = async () => {
      try {
        const t = await obtenerTrabajo(trabajoId)
        if (!vigente) return
        setTrabajo(t)
        if (!TERMINADO.includes(t.estado)) espera = window.setTimeout(consultar, 500)
      } catch (e) {
        if (vigente) setTrabajo((t) => t && { ...t, estado: 'error', error: (e as Error).message })
      }
    }
    consultar()
    return () => {
      vigente = false
      window.clearTimeout(espera)
    }
  }, [trabajoId])

  const abrir = (id: string) => {
    if (id !== trabajoId) setTrabajo(null)
    setTrabajoId(id)
    setSemilla(42)
  }

  const iniciar = async () => {
    const ejemplo = entradaElegida && entradaElegida !== 'propia' ? SUB_TAREAS[entradaElegida] : null
    if (!ejemplo && !archivoPropio) return
    setEnviando(true)
    try {
      const nombre = ejemplo ? ejemplo.archivo : archivoPropio!.nombre
      const imagen = ejemplo ? await (await fetch(ejemplo.entrada)).blob() : archivoPropio!.archivo
      const valores = Object.fromEntries(SUB_TAREAS.A.parametros.map((p) => [p.clave, ajustes.A?.[p.clave] ?? p.valor]))
      const id = await restaurar(imagen, nombre, valores)
      setHistorial((h) => [{ id, archivo: nombre, miniatura: ejemplo ? ejemplo.entrada : archivoPropio!.url }, ...h])
      abrir(id)
      irA('restaurar')
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    const alCambiar = () => {
      setPantalla(leerHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  return (
    <Ctx.Provider value={{ pantalla, subTarea, setSubTarea, semilla, setSemilla, archivoPropio, setArchivoPropio, entradaElegida, setEntradaElegida, modoMapa, setModoMapa, ajustes, setAjuste, trabajo, historial, abrir, enviando, iniciar }}>
      {children}
    </Ctx.Provider>
  )
}

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
