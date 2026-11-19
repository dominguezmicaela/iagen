import { ChevronDown, Columns2, FlaskConical, Flashlight, History, Plus, Upload, Wand } from 'lucide-react'
import type { ReactNode } from 'react'
import { ES_EJEMPLO, SUB_TAREAS, type SubTareaId } from '../datos/ejemplo'
import { useEstado } from '../contexto'
import { PANTALLAS, type PantallaId } from '../navegacion'
import { cx } from '../utilidades'

const ICONOS: Record<PantallaId, ReactNode> = {
  subir: <Upload size={20} />,
  restaurar: <Wand size={20} />,
  revisar: <Columns2 size={20} />,
  lampara: <Flashlight size={20} className="rotate-90" />,
}

export function Logo() {
  return (
    <a href="#/subir" className="flex shrink-0 items-center gap-2.5 text-white no-underline">
      <span aria-hidden="true" className="fondo-ia grid size-8 place-items-center rounded-full">
        <span className="size-3 rounded-full bg-black" />
      </span>
      <span className="hidden text-[19px] font-extrabold tracking-tight sm:inline">Restaurá</span>
    </a>
  )
}

/** Restauraciones de la sesión (en el modo demo, los tres ejemplos). */
function useRestauraciones() {
  const { pantalla, subTarea, setSubTarea, setEntradaElegida, historial, trabajo, abrir } = useEstado()
  const ids: SubTareaId[] = ['A', 'B', 'C']
  return ES_EJEMPLO
    ? ids.map((id) => ({
        clave: id,
        miniatura: SUB_TAREAS[id].entrada,
        archivo: SUB_TAREAS[id].archivo,
        detalle: SUB_TAREAS[id].titulo,
        activa: id === subTarea && pantalla !== 'subir',
        elegir: () => {
          setSubTarea(id)
          setEntradaElegida(id)
        },
      }))
    : historial.map((h) => ({
        clave: h.id,
        miniatura: h.miniatura,
        archivo: h.archivo,
        detalle: SUB_TAREAS.A.titulo,
        activa: h.id === trabajo?.id && pantalla !== 'subir',
        elegir: () => abrir(h.id),
      }))
}

/** Título, lista y aviso de "Tus restauraciones"; lo comparten la columna y el desplegable. */
function ListaRestauraciones({ alElegir }: { alElegir?: () => void }) {
  const items = useRestauraciones()
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-gris">Tus restauraciones</h2>
        <a
          href="#/subir"
          onClick={alElegir}
          aria-label="Nueva restauración"
          title="Nueva restauración"
          className="grid size-9 place-items-center rounded-full text-gris transition-colors hover:bg-tarjeta-2 hover:text-white"
        >
          <Plus size={20} />
        </a>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {items.map(({ clave, miniatura, archivo, detalle, activa, elegir }) => (
          <li key={clave}>
            <button
              type="button"
              onClick={() => {
                elegir()
                alElegir?.()
                window.location.hash = '/revisar'
              }}
              className={cx('flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-200', activa ? 'bg-tarjeta-2' : 'hover:bg-tarjeta')}
            >
              <img src={miniatura} alt="" className="size-12 shrink-0 rounded object-cover" />
              <span className="min-w-0">
                <span className={cx('block truncate text-[15px] font-semibold', activa && 'text-fluor')}>{archivo}</span>
                <span className="block truncate text-[13px] text-gris">{detalle}</span>
              </span>
            </button>
          </li>
        ))}
        {!items.length && <li className="px-3 py-2 text-[13px] text-gris">Todavía no restauraste ninguna imagen.</li>}
      </ul>
      {ES_EJEMPLO && (
        <p className="m-3 mt-0 flex gap-2.5 rounded-md bg-tarjeta-2 p-3 text-[12.5px] leading-snug text-gris">
          <FlaskConical size={16} className="mt-0.5 shrink-0" />
          Datos de ejemplo: nada de esto lo generó un modelo real.
        </p>
      )}
    </>
  )
}

/** En pantallas grandes: columna a la izquierda, debajo del menú. */
export function ColumnaRestauraciones() {
  return (
    <section aria-label="Tus restauraciones" className="hidden min-h-0 flex-col rounded-lg bg-fondo lg:col-start-1 lg:row-start-2 lg:flex">
      <ListaRestauraciones />
    </section>
  )
}

/** En pantallas chicas: botón en el menú que despliega la misma lista. */
function BotonRestauraciones() {
  const cantidad = useRestauraciones().length
  return (
    <>
      <button
        type="button"
        popoverTarget="historial"
        aria-label="Tus restauraciones"
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-tarjeta-2 px-3 text-[14px] font-bold text-gris transition-colors hover:text-white sm:px-4 lg:hidden"
      >
        <History size={18} />
        {cantidad > 0 && <span className="fondo-ia grid size-5 place-items-center rounded-full text-[12px] text-black">{cantidad}</span>}
        <ChevronDown size={16} className="hidden sm:block" />
      </button>
      <section
        id="historial"
        popover="auto"
        aria-label="Tus restauraciones"
        className="fixed inset-auto top-[76px] right-2 m-0 max-h-[min(70dvh,560px)] w-[min(360px,calc(100vw-16px))] overflow-hidden rounded-lg bg-fondo p-0 text-white shadow-[0_16px_48px_rgb(0_0_0/0.7)] open:flex open:flex-col"
      >
        <ListaRestauraciones alElegir={() => document.getElementById('historial')?.hidePopover()} />
      </section>
    </>
  )
}

/** Menú horizontal arriba: logo y los cuatro pasos. */
export function BarraSuperior() {
  const { pantalla } = useEstado()
  return (
    <header className="flex min-h-[68px] items-center justify-between gap-3 rounded-lg bg-fondo px-4 py-2 lg:col-span-2 lg:row-start-1 lg:justify-start lg:gap-0">
      {/* en pantallas grandes, el logo ocupa el ancho de la columna para que los pasos arranquen junto al contenido */}
      <div className="lg:w-[292px] lg:shrink-0">
        <Logo />
      </div>
      <nav aria-label="Pasos" className="flex min-w-0 items-center gap-1">
        {PANTALLAS.map((p) => {
          const activa = p.id === pantalla
          return (
            <a
              key={p.id}
              href={`#/${p.id}`}
              aria-current={activa ? 'page' : undefined}
              aria-label={p.nombre}
              className={cx(
                'flex min-h-11 items-center gap-2.5 rounded-full px-2.5 text-[15px] font-bold no-underline transition-colors duration-200 md:px-4',
                activa ? 'bg-tarjeta-2 text-white' : 'text-gris hover:text-white',
              )}
            >
              <span className={activa ? 'text-fluor' : ''}>{ICONOS[p.id]}</span>
              <span className="hidden md:inline">{p.nombre}</span>
            </a>
          )
        })}
      </nav>
      <BotonRestauraciones />
    </header>
  )
}
