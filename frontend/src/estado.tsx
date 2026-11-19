import { useEffect, useState, type ReactNode } from 'react'
import { obtenerTrabajo, restaurar, type Trabajo } from './api'
import { Ctx, type ArchivoPropio, type ModoMapa, type Restauracion } from './contexto'
import { SUB_TAREAS, type SubTareaId } from './datos/ejemplo'
import { irA, leerHash, type PantallaId } from './navegacion'

// Proveedor del estado compartido: pantalla actual, imagen elegida, ajustes y el trabajo en curso.
// La forma del estado y los hooks para leerlo están en contexto.ts.

const TERMINADO = ['listo', 'error']

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
