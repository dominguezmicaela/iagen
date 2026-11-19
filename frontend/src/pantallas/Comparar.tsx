import { Download, Eye, FileText, Flashlight, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { descargar, urlDescarga, urlInforme } from '../api'
import { SUB_TAREAS } from '../datos/ejemplo'
import { useDatos, useEstado } from '../contexto'
import { useAvisar } from '../components/usarAvisos'
import { Comparador } from '../components/Comparador'
import { PanelChequeo } from '../components/PanelChequeo'
import { Actual, Boton, BotonIcono, Diseno, Seccion, Tarjeta } from '../components/ui'
import { escribiendo } from '../utilidades'
import { SinResultado } from '../components/SinResultado'

export function Comparar() {
  const { subTarea, semilla, setSemilla, setModoMapa } = useEstado()
  const avisar = useAvisar()
  const d = useDatos()
  const t = SUB_TAREAS[subTarea]
  const [lupa, setLupa] = useState(true)
  const [original, setOriginal] = useState(false)

  // Atajos: L = lupa · mantener Espacio = ver el original
  useEffect(() => {
    const abajo = (e: KeyboardEvent) => {
      if (escribiendo(e)) return
      if (e.key.toLowerCase() === 'l' && !e.repeat) setLupa((x) => !x)
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault()
        setOriginal(true)
      }
    }
    const arriba = (e: KeyboardEvent) => {
      if (e.code === 'Space') setOriginal(false)
    }
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
    }
  }, [])

  if (!d) return <SinResultado />
  const v = d.verificacion
  const salida = d.semillas.find((s) => s.valor === semilla)?.imagen ?? d.semillas[0].imagen

  const principal = (
    <div className="flex min-h-full flex-col gap-5 p-6">
      <div role="note" className="flex items-start gap-3 rounded-md bg-fluor/[0.12] p-3.5 ring-1 ring-fluor/30">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-fluor" />
        <p className="text-[14px] leading-snug text-gris">
          <strong className="text-white">Tiene detalle inventado. </strong>
          {d.aviso}
        </p>
      </div>

      <div className="flex min-h-[240px] flex-1 items-center justify-center">
        <Comparador entrada={d.entrada} salida={salida} semilla={semilla} lupa={lupa} original={original} />
      </div>

      <Seccion titulo="Otras semillas" accion="El detalle fino cambia con cada una">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.semillas.map((s) => (
            <Tarjeta
              key={s.valor}
              imagen={s.imagen}
              titulo={`Semilla ${s.valor}`}
              subtitulo={s.valor === semilla ? 'En pantalla' : 'Ver esta versión'}
              activa={s.valor === semilla}
              etiqueta={`Ver la salida con la semilla ${s.valor}`}
              onClick={() => setSemilla(s.valor)}
            />
          ))}
        </div>
      </Seccion>
    </div>
  )

  const barra = (
    <>
      <Actual imagen={salida} titulo="Restaurada con IA" subtitulo={`${t.titulo}, semilla ${semilla}`} />
      <div className="flex items-center justify-center gap-3">
        <BotonIcono etiqueta={lupa ? 'Apagar lupa (L)' : 'Prender lupa (L)'} activo={lupa} aria-pressed={lupa} onClick={() => setLupa((x) => !x)}>
          <Search size={20} />
        </BotonIcono>
        <a
          href="#/lampara"
          onClick={() => setModoMapa('diferencia')}
          className="fondo-ia flex min-h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold text-black no-underline transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97]"
        >
          <Flashlight size={18} className="rotate-90" /> Encender lámpara UV
        </a>
        <BotonIcono
          etiqueta="Mantené para ver el original (Espacio)"
          activo={original}
          aria-pressed={original}
          className="select-none"
          onPointerDown={() => setOriginal(true)}
          onPointerUp={() => setOriginal(false)}
          onPointerLeave={() => setOriginal(false)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              setOriginal(true)
            }
          }}
          onKeyUp={() => setOriginal(false)}
          onBlur={() => setOriginal(false)}
        >
          <Eye size={20} />
        </BotonIcono>
      </div>
      <div className="hidden items-center justify-end gap-2 sm:flex">
        <BotonIcono
          etiqueta="Descargar informe"
          onClick={() => {
            if (d.descarga) descargar(urlInforme(d.descarga.trabajo))
            avisar('Informe descargado: modelo, parámetros, semilla y chequeos')
          }}
        >
          <FileText size={20} />
        </BotonIcono>
        <Boton variante="blanco" className="min-h-10 px-5 text-[14px]" onClick={() => {
            if (d.descarga) descargar(urlDescarga(d.descarga.trabajo))
            avisar('Imagen descargada con la marca «Restaurada con IA»')
          }}>
          <Download size={17} /> Descargar
        </Boton>
      </div>
    </>
  )

  return <Diseno principal={principal} panel={<PanelChequeo v={v} />} barra={barra} etiquetaPanel="Chequeo" />
}
