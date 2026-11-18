import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type Variante = 'marca' | 'blanco' | 'contorno' | 'fantasma'

const BOTON: Record<Variante, string> = {
  marca: 'fondo-ia text-black hover:scale-[1.04] hover:brightness-110',
  blanco: 'bg-white text-black hover:scale-[1.04]',
  contorno: 'text-white ring-1 ring-gris-2 hover:scale-[1.04] hover:ring-white',
  fantasma: 'text-gris hover:text-white',
}

const BASE =
  'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-6 text-center text-[15px] leading-tight font-bold transition-all duration-200 ease-[var(--ease-suave)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40'

export function Boton({ variante = 'contorno', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button type="button" className={cx(BASE, BOTON[variante], className)} {...rest}>
      {children}
    </button>
  )
}

export function Enlace({ href, variante = 'contorno', className, children, onClick }: { href: string; variante?: Variante; className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <a href={href} onClick={onClick} className={cx(BASE, BOTON[variante], 'no-underline', className)}>
      {children}
    </a>
  )
}

/** Botón redondo de icono (como los controles de un reproductor). */
export function BotonIcono({
  etiqueta,
  activo,
  grande,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { etiqueta: string; activo?: boolean; grande?: boolean }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className={cx(
        'relative grid shrink-0 place-items-center rounded-full transition-all duration-200 ease-[var(--ease-suave)] active:scale-95',
        grande ? 'size-14 fondo-ia text-black hover:scale-105' : 'size-11 hover:scale-105',
        !grande && (activo ? 'text-fluor' : 'text-gris hover:text-white'),
        className,
      )}
      {...rest}
    >
      {children}
      {activo && !grande && <span aria-hidden="true" className="absolute bottom-0.5 size-1 rounded-full bg-fluor" />}
    </button>
  )
}

/** Etiqueta en píldora sobre la imagen. */
export function Capsula({ children, tono = 'oscura', className }: { children: ReactNode; tono?: 'oscura' | 'ia'; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold',
        tono === 'oscura' && 'bg-black/60 text-white backdrop-blur-md',
        tono === 'ia' && 'fondo-ia text-black',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Título de sección con acción opcional a la derecha. */
export function Seccion({ titulo, accion, children, className }: { titulo: ReactNode; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[20px] font-extrabold tracking-tight">{titulo}</h2>
        {accion && <span className="text-[13px] font-bold text-gris">{accion}</span>}
      </div>
      {children}
    </section>
  )
}

/** Tarjeta tipo álbum: imagen, título y subtítulo. */
export function Tarjeta({
  imagen,
  titulo,
  subtitulo,
  activa,
  onClick,
  insignia,
  etiqueta,
}: {
  imagen?: string
  titulo: ReactNode
  subtitulo?: ReactNode
  activa?: boolean
  onClick?: () => void
  insignia?: ReactNode
  etiqueta?: string
}) {
  const contenido = (
    <>
      <span className="relative block aspect-[16/9] overflow-hidden rounded-md bg-tarjeta-2 shadow-[0_8px_24px_rgb(0_0_0/0.5)]">
        {imagen && <img src={imagen} alt="" className="size-full object-cover" />}
        {insignia && <span className="absolute top-2 left-2">{insignia}</span>}
      </span>
      <span className="mt-2.5 block truncate text-[15px] font-bold">{titulo}</span>
      {subtitulo && <span className="block truncate text-[13px] text-gris">{subtitulo}</span>}
    </>
  )
  const clase = cx(
    'group block min-w-0 rounded-lg p-2.5 text-left transition-colors duration-200',
    activa ? 'bg-tarjeta-2 ring-1 ring-fluor/60' : 'bg-tarjeta hover:bg-tarjeta-2',
  )
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={activa} aria-label={etiqueta} className={clase}>
      {contenido}
    </button>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}

export function Rango({
  id,
  etiqueta,
  valor,
  min,
  max,
  paso,
  onChange,
  formato = (v) => String(v).replace('.', ','),
  className,
}: {
  id: string
  etiqueta: ReactNode
  valor: number
  min: number
  max: number
  paso: number
  onChange: (v: number) => void
  formato?: (v: number) => string
  className?: string
}) {
  const pct = ((valor - min) / (max - min)) * 100
  return (
    <div className={cx('flex min-w-0 flex-col', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] text-gris">
          {etiqueta}
        </label>
        <output htmlFor={id} className="text-[14px] font-bold">
          {formato(valor)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="rango"
        min={min}
        max={max}
        step={paso}
        value={valor}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function Interruptor({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-gris hover:text-white">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-[22px] w-[38px] shrink-0 rounded-full bg-elevado transition-colors duration-300 peer-checked:bg-fluor peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:transition-transform after:duration-300 after:ease-[var(--ease-suave)] peer-checked:after:translate-x-4"
      />
      {children}
    </label>
  )
}

export function Tecla({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded bg-elevado px-1.5 font-sans text-[11px] font-bold text-gris">{children}</kbd>
  )
}

/** Pista flotante que explica un gesto; desaparece con la primera interacción. */
export function Pista({ visible, children, style }: { visible: boolean; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none absolute z-10 -translate-x-1/2 transition-all duration-500 ease-[var(--ease-suave)]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
      )}
      style={style}
    >
      <span className="block rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-black shadow-[0_8px_24px_rgb(0_0_0/0.5)]">{children}</span>
    </div>
  )
}

/** Indica si el foco está en un campo de texto (para no robarle teclas). */
export function escribiendo(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'TEXTAREA' || (tag === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((t as HTMLInputElement).type)) || t.isContentEditable
}

/** Pantalla: zona principal + panel derecho + barra inferior (como un reproductor). */
export function Diseno({ principal, panel, barra, etiquetaPanel }: { principal: ReactNode; panel: ReactNode; barra: ReactNode; etiquetaPanel: string }) {
  return (
    <>
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-2 lg:col-start-2 lg:row-start-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex min-h-0 animate-entrar flex-col overflow-y-auto rounded-lg bg-fondo">{principal}</main>
        <aside aria-label={etiquetaPanel} className="flex min-h-0 animate-entrar flex-col overflow-y-auto rounded-lg bg-fondo">
          {panel}
        </aside>
      </div>
      <footer className="sticky bottom-0 z-20 grid min-h-[84px] grid-cols-[minmax(0,1fr)] items-center gap-3 bg-negro px-2 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] lg:col-span-2 lg:row-start-2 lg:px-3">
        {barra}
      </footer>
    </>
  )
}

/** Miniatura + texto para el lado izquierdo de la barra inferior. */
export function Actual({ imagen, titulo, subtitulo }: { imagen?: string; titulo: ReactNode; subtitulo: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="size-14 shrink-0 overflow-hidden rounded-md bg-tarjeta-2">{imagen && <img src={imagen} alt="" className="size-full object-cover" />}</span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-bold">{titulo}</span>
        <span className="block truncate text-[13px] text-gris">{subtitulo}</span>
      </span>
    </div>
  )
}
