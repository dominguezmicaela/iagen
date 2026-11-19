import { Check, ChevronDown, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Estado } from '../datos/ejemplo'
import type { Datos } from '../datos/vista'
import { cx } from '../utilidades'
import { Seccion, Tecla } from './ui'

// Panel derecho de Revisar: el chequeo con CLIP, BLIP y DETR, y los atajos de teclado.

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

export function PanelChequeo({ v }: { v: Datos['verificacion'] }) {
  const chequeos = [v.descripcionOk, v.clipOk, v.detrOk].filter((x) => x !== null)
  return (
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
}
