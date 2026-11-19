import { ZoomIn } from 'lucide-react'
import { SUB_TAREAS, type SubTareaId } from '../datos/ejemplo'

/** Qué va a hacer el modelo con la foto y qué parte va a inventar. */
export function TareaElegida({ id }: { id: SubTareaId }) {
  const t = SUB_TAREAS[id]
  return (
    <div className="-mx-2 flex items-start gap-3 rounded-md bg-tarjeta-2 p-2">
      <span className="fondo-ia grid size-12 shrink-0 place-items-center rounded-md text-black">
        <ZoomIn size={22} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-fluor">
          {t.titulo} · {t.tecnico}
        </span>
        <span className="block text-[13px] text-gris">{t.bajada}</span>
        <span className="mt-0.5 block text-[13px] text-fluor">Inventa {t.inventa}.</span>
      </span>
    </div>
  )
}
