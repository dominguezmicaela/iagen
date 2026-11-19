import { Check } from 'lucide-react'
import { cx } from '../utilidades'
import { Seccion } from './ui'

// Piezas de la pantalla Restaurar que muestran cómo avanza la difusión.

/** Las etapas del modelo, con las hechas tildadas y la actual resaltada. */
export function FasesModelo({ fases, actual }: { fases: { titulo: string; detalle: string }[]; actual: number }) {
  return (
    <ol className="-mx-2 flex flex-col">
      {fases.map((f, i) => {
        const hecho = i < actual
        const ahora = i === actual
        return (
          <li key={f.titulo} className={cx('flex items-start gap-3 rounded-md p-2 transition-colors duration-300', ahora && 'bg-tarjeta-2')}>
            <span
              className={cx(
                'grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold',
                hecho && 'bg-white text-black',
                ahora && 'fondo-ia text-black',
                !hecho && !ahora && 'bg-elevado text-gris',
              )}
            >
              {hecho ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <span>
              <span className={cx('block text-[15px] font-bold', ahora && 'text-fluor', !hecho && !ahora && 'text-gris')}>{f.titulo}</span>
              <span className="block text-[13px] text-gris">{f.detalle}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Tira de fotogramas intermedios; los que todavía no llegaron quedan vacíos. */
export function TiraFotogramas({ fotogramas, total }: { fotogramas: { paso: number; imagen: string; visto: boolean }[]; total: number }) {
  return (
    <Seccion titulo="Cómo fue apareciendo">
      <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {fotogramas.map((f) => (
          <li key={f.paso} className="rounded-lg bg-tarjeta p-2">
            <span className="block aspect-[16/9] overflow-hidden rounded-md bg-tarjeta-2">
              {f.visto && <img src={f.imagen} alt="" className="size-full animate-entrar object-cover" />}
            </span>
            <span className={cx('mt-1.5 block text-[13px] font-bold', !f.visto && 'text-gris-2')}>{f.paso === total ? 'Final' : `Paso ${f.paso}`}</span>
          </li>
        ))}
      </ol>
    </Seccion>
  )
}
