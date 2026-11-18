import { Flashlight } from 'lucide-react'
import { useId, useState, type CSSProperties } from 'react'
import { MARCAS } from '../datos/ejemplo'
import { RAMPAS, tonoActual } from './tonoIA'
import { Capsula, cx } from './ui'

/**
 * La lámpara UV: a la izquierda del haz, la foto con luz normal; a la derecha,
 * bajo luz UV, todo lo que inventó el modelo brilla (rosa → amarillo).
 * El brillo sale de un filtro SVG sobre el mapa en grises (sin canvas, sin CORS).
 */
export function LamparaUV({
  base,
  mapa,
  umbral,
  intensidad,
  completa,
  marcas = true,
  marcaActiva,
  onMarca,
  descripcion,
  decorativa = false,
}: {
  base: string
  mapa: string
  umbral: number
  intensidad: number
  /** true = toda la imagen bajo luz UV */
  completa: boolean
  marcas?: boolean
  marcaActiva?: number | null
  onMarca?: (i: number | null) => void
  descripcion: string
  /** Demo sin controles: llena el contenedor y el haz barre una vez. */
  decorativa?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const rampa = RAMPAS[tonoActual()]
  const [haz, setHaz] = useState<number | null>(null)
  const N = 20
  const alfa = Array.from({ length: N }, (_, k) => (k / N >= umbral / 100 ? intensidad : 0)).join(' ')

  const estilo = (completa ? { '--haz': '0%' } : haz !== null ? { '--haz': `${haz}%` } : {}) as CSSProperties

  return (
    <div
      className={cx(
        decorativa
          ? 'absolute inset-0 overflow-hidden'
          : 'relative aspect-[3/2] w-full max-h-full max-w-full overflow-hidden rounded-lg bg-black select-none lg:h-full lg:w-auto',
        !completa && haz === null && 'animate-barrido',
      )}
      style={estilo}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id={`fluor-${id}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 0 0 0 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={rampa.r} />
            <feFuncG type="table" tableValues={rampa.g} />
            <feFuncB type="table" tableValues={rampa.b} />
            <feFuncA type="discrete" tableValues={alfa} />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Luz normal */}
      <img src={base} alt={decorativa ? '' : 'Imagen restaurada con luz normal'} className="absolute inset-0 size-full object-cover" />

      {/* Luz UV, del haz hacia la derecha */}
      <div className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 var(--haz))' }}>
        <img src={base} alt="" className="absolute inset-0 size-full object-cover brightness-[.42] grayscale" />
        <div className="absolute inset-0 bg-[#4a36c9] mix-blend-multiply" />
        <img
          src={mapa}
          alt={descripcion}
          className="absolute inset-0 size-full object-cover"
          style={{ filter: `url(#fluor-${id}) drop-shadow(0 0 6px var(--color-fluor))` }}
        />
      </div>

      {/* El haz */}
      {!completa && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-28"
            style={{ left: 'var(--haz)', background: 'linear-gradient(90deg, rgb(200 185 255 / 0.4), transparent)' }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_22px_6px_rgb(190_170_255/0.85)]" style={{ left: 'var(--haz)' }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow-[0_0_34px_8px_rgb(190_170_255/0.55)] ring-1 ring-white backdrop-blur-xl"
            style={{ left: 'var(--haz)' }}
          >
            <Flashlight size={20} className="rotate-90" />
          </div>
          {!decorativa && (
            <div className="pointer-events-none absolute top-4 left-4">
              <Capsula tono="oscura">Luz normal</Capsula>
            </div>
          )}
          {!decorativa && <input
            type="range"
            min={0}
            max={100}
            value={haz ?? 32}
            onChange={(e) => setHaz(Number(e.target.value))}
            aria-label="Mover la lámpara UV sobre la imagen"
            className="absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
          />}
        </>
      )}
      {!decorativa && (
        <div className="pointer-events-none absolute top-4 right-4">
          <Capsula tono="ia">Luz UV</Capsula>
        </div>
      )}

      {marcas && !decorativa &&
        MARCAS.map((m, i) => {
          const activa = marcaActiva === i
          return (
            <button
              key={m.titulo}
              type="button"
              onMouseEnter={() => onMarca?.(i)}
              onMouseLeave={() => onMarca?.(null)}
              onFocus={() => onMarca?.(i)}
              onBlur={() => onMarca?.(null)}
              aria-label={`Zona ${i + 1}: ${m.titulo}`}
              className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <span
                className={cx(
                  'grid size-8 place-items-center rounded-full text-sm font-bold ring-2 transition-transform',
                  activa ? 'fondo-ia scale-125 text-black ring-white' : 'bg-black/45 text-white ring-white/80 backdrop-blur-xl',
                )}
              >
                {i + 1}
              </span>
            </button>
          )
        })}
    </div>
  )
}
