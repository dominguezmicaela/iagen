import { Focus, Palette, ZoomIn } from 'lucide-react'
import type { ReactNode } from 'react'
import { disponible, SUB_TAREA_IDS, SUB_TAREAS, type SubTareaId } from '../datos/ejemplo'
import { cx } from '../utilidades'

const ICONO: Record<SubTareaId, ReactNode> = { A: <ZoomIn size={22} />, B: <Focus size={22} />, C: <Palette size={22} /> }

/** Opciones de "Qué querés arreglar": una por sub-tarea, con lo que inventa cada una. */
export function SelectorSubTarea({ valor, onChange }: { valor: SubTareaId; onChange: (id: SubTareaId) => void }) {
  return (
    <fieldset className="-mx-2 flex flex-col">
      <legend className="sr-only">Tipo de restauración</legend>
      {SUB_TAREA_IDS.map((id) => {
        const m = SUB_TAREAS[id]
        const activo = valor === id
        const habilitado = disponible(id)
        return (
          <label
            key={id}
            className={cx(
              'flex items-start gap-3 rounded-md p-2 transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white',
              activo ? 'bg-tarjeta-2' : habilitado ? 'cursor-pointer hover:bg-tarjeta' : 'cursor-not-allowed opacity-50',
            )}
          >
            <input type="radio" name="modo" value={id} checked={activo} disabled={!habilitado} onChange={() => onChange(id)} className="sr-only" />
            <span className={cx('grid size-12 shrink-0 place-items-center rounded-md', activo ? 'fondo-ia text-black' : 'bg-elevado text-white')}>{ICONO[id]}</span>
            <span className="min-w-0">
              <span className={cx('block text-[15px] font-bold', activo && 'text-fluor')}>{m.titulo}</span>
              <span className="block text-[13px] text-gris">{m.bajada}</span>
              <span className="mt-0.5 block text-[13px] text-fluor">{habilitado ? `Inventa ${m.inventa}.` : 'Próximamente.'}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
