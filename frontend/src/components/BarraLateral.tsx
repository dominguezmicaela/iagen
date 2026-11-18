import { Columns2, FlaskConical, Flashlight, Plus, Upload, Wand } from 'lucide-react'
import type { ReactNode } from 'react'
import { SUB_TAREAS, type SubTareaId } from '../datos/ejemplo'
import { PANTALLAS, useEstado, type PantallaId } from '../estado'
import { cx } from './ui'

const ICONOS: Record<PantallaId, ReactNode> = {
  subir: <Upload size={22} />,
  restaurar: <Wand size={22} />,
  revisar: <Columns2 size={22} />,
  lampara: <Flashlight size={22} className="rotate-90" />,
}

export function Logo() {
  return (
    <a href="#/subir" className="flex items-center gap-2.5 text-white no-underline">
      <span aria-hidden="true" className="fondo-ia grid size-8 place-items-center rounded-full">
        <span className="size-3 rounded-full bg-black" />
      </span>
      <span className="text-[19px] font-extrabold tracking-tight">Restaurá</span>
    </a>
  )
}

export function BarraLateral() {
  const { pantalla, subTarea, setSubTarea, setEntradaElegida } = useEstado()
  const ids: SubTareaId[] = ['A', 'B', 'C']

  return (
    <div className="hidden min-h-0 flex-col gap-2 lg:col-start-1 lg:row-start-1 lg:flex">
      <nav aria-label="Pasos" className="flex flex-col gap-1 rounded-lg bg-fondo px-3 py-5">
        <div className="mb-4 px-3">
          <Logo />
        </div>
        {PANTALLAS.map((p) => {
          const activa = p.id === pantalla
          return (
            <a
              key={p.id}
              href={`#/${p.id}`}
              aria-current={activa ? 'page' : undefined}
              className={cx(
                'flex min-h-11 items-center gap-4 rounded-md px-3 text-[15px] font-bold no-underline transition-colors duration-200',
                activa ? 'bg-tarjeta-2 text-white' : 'text-gris hover:text-white',
              )}
            >
              <span className={activa ? 'text-fluor' : ''}>{ICONOS[p.id]}</span>
              {p.nombre}
            </a>
          )
        })}
      </nav>

      <section aria-label="Tus restauraciones" className="flex min-h-0 flex-1 flex-col rounded-lg bg-fondo">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-[15px] font-bold text-gris">Tus restauraciones</h2>
          <a href="#/subir" aria-label="Nueva restauración" title="Nueva restauración" className="grid size-9 place-items-center rounded-full text-gris transition-colors hover:bg-tarjeta-2 hover:text-white">
            <Plus size={20} />
          </a>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2">
          {ids.map((id) => {
            const t = SUB_TAREAS[id]
            const activa = id === subTarea && pantalla !== 'subir'
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setSubTarea(id)
                    setEntradaElegida(id)
                    window.location.hash = '/revisar'
                  }}
                  className={cx('flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-200', activa ? 'bg-tarjeta-2' : 'hover:bg-tarjeta')}
                >
                  <img src={t.entrada} alt="" className="size-12 shrink-0 rounded object-cover" />
                  <span className="min-w-0">
                    <span className={cx('block truncate text-[15px] font-semibold', activa && 'text-fluor')}>{t.archivo}</span>
                    <span className="block truncate text-[13px] text-gris">{t.titulo}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="m-3 flex gap-2.5 rounded-md bg-tarjeta-2 p-3 text-[12.5px] leading-snug text-gris">
          <FlaskConical size={16} className="mt-0.5 shrink-0" />
          Datos de ejemplo: nada de esto lo generó un modelo real.
        </p>
      </section>
    </div>
  )
}

/** En pantallas chicas: logo y pasos arriba. */
export function EncabezadoMovil() {
  const { pantalla } = useEstado()
  return (
    <header className="flex items-center justify-between gap-3 rounded-lg bg-fondo px-4 py-3 lg:hidden">
      <Logo />
      <nav aria-label="Pasos" className="flex gap-1">
        {PANTALLAS.map((p) => (
          <a
            key={p.id}
            href={`#/${p.id}`}
            aria-label={p.nombre}
            aria-current={p.id === pantalla ? 'page' : undefined}
            className={cx('grid size-10 place-items-center rounded-full', p.id === pantalla ? 'bg-tarjeta-2 text-fluor' : 'text-gris')}
          >
            {ICONOS[p.id]}
          </a>
        ))}
      </nav>
    </header>
  )
}
