import { Check, ChevronDown, Download, Eye, FileText, Flashlight, Search, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { descargar, urlDescarga, urlInforme } from '../api'
import { SUB_TAREAS, type Estado } from '../datos/ejemplo'
import { useDatos, useEstado } from '../estado'
import { useAvisar } from '../components/avisos'
import { Comparador } from '../components/Comparador'
import { Actual, Boton, BotonIcono, Diseno, Seccion, Tarjeta, Tecla, cx, escribiendo } from '../components/ui'
import { SinResultado } from '../components/SinResultado'

const n2 = (v: number) => v.toFixed(2).replace('.', ',')
const estado = (ok: boolean): Estado => (ok ? 'ok' : 'alerta')

function Chequeo({ titulo, modelo, estado, resumen, abierto, children }: { titulo: string; modelo: string; estado: Estado; resumen: string; abierto?: boolean; children?: ReactNode }) {
  return (
    <details open={abierto} className={cx('group rounded-md transition-colors', estado === 'ok' ? 'bg-tarjeta open:bg-tarjeta-2' : 'bg-tarjeta-2 ring-1 ring-fluor/40')}>
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md p-3 hover:bg-tarjeta-2 [&::-webkit-details-marker]:hidden">
        <span
          className={cx('grid size-9 shrink-0 place-items-center rounded-full', estado === 'ok' ? 'bg-white text-black' : 'fondo-ia text-black')}
          aria-label={estado === 'ok' ? 'Bien' : 'Para revisar'}
        >
          {estado === 'ok' ? <Check size={17} strokeWidth={3} /> : <TriangleAlert size={16} strokeWidth={2.5} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">{titulo}</span>
          <span className={cx('block truncate text-[13px]', estado === 'ok' ? 'text-gris' : 'text-fluor')}>{resumen}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-gris transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-3 pl-[60px]">
        <p className="text-[12.5px] text-gris-2">{modelo}</p>
        {children}
      </div>
    </details>
  )
}

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
  const chequeos = [v.descripcionOk, v.clipOk, v.detrOk].filter((x) => x !== null)

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

  const panel = (
    <div className="flex flex-col gap-4 p-5">
      <Seccion titulo="Chequeo" accion={`${chequeos.filter(Boolean).length} de ${chequeos.length} bien`}>
        <div className="flex flex-col gap-2">
          <Chequeo titulo="Cómo la describe" modelo="BLIP, Salesforce/blip-image-captioning-large" estado={estado(v.descripcionOk)} resumen={v.descripcionResumen} abierto={!v.descripcionOk}>
            <p className="text-[14px] text-gris">
              <span className="text-gris-2">Antes </span>“{v.descripcionEntrada}”
            </p>
            <p className="text-[14px] leading-relaxed">
              <span className="text-gris-2">Después </span>“
              {v.descripcionSalida.map((f, i) =>
                f.nuevo ? (
                  <mark key={i} className="rounded bg-fluor/20 px-1 font-bold text-fluor [box-decoration-break:clone]">
                    {f.texto}
                  </mark>
                ) : (
                  <span key={i}>{f.texto}</span>
                ),
              )}
              ”
            </p>
          </Chequeo>

          <Chequeo titulo="Qué hay en la foto" modelo="CLIP, openai/clip-vit-base-patch32" estado={estado(v.clipOk)} resumen={v.clipResumen} abierto={!v.clipOk}>
            {v.clip.map((c) => (
              <p key={c.etiqueta} className="flex justify-between gap-3 text-[13.5px]">
                <span className="truncate text-gris">{c.etiqueta}</span>
                <span className="shrink-0 font-bold">
                  <span className="font-normal text-gris-2">{n2(c.entrada)} a </span>
                  {n2(c.salida)}
                </span>
              </p>
            ))}
          </Chequeo>

          {v.detrOk !== null && (
          <Chequeo titulo="Qué objetos detecta" modelo="DETR, facebook/detr-resnet-50" estado={estado(v.detrOk)} resumen={v.detrResumen} abierto={!v.detrOk}>
            {v.detr.map((d) => (
              <p key={d.objeto} className="flex justify-between text-[13.5px]">
                <span className="text-gris">{d.objeto}</span>
                <span className="font-bold">
                  <span className="font-normal text-gris-2">{n2(d.entrada)} a </span>
                  {n2(d.salida)}
                </span>
              </p>
            ))}
          </Chequeo>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Atajos" className="hidden lg:flex">
        <ul className="flex flex-col gap-2 text-[13.5px] text-gris">
          <li className="flex items-center justify-between">
            Prender o apagar la lupa <Tecla>L</Tecla>
          </li>
          <li className="flex items-center justify-between">
            Ver el original mientras mantenés <Tecla>Espacio</Tecla>
          </li>
          <li className="flex items-center justify-between">
            Mover el divisor <Tecla>← →</Tecla>
          </li>
        </ul>
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

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Chequeo" />
}
