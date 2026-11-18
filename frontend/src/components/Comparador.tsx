import { ChevronsLeftRight } from 'lucide-react'
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Capsula } from './ui'

const ZOOM = 2
const LENTE = 176

/**
 * Antes / después con divisor arrastrable (también con teclado).
 * - `lupa`: muestra una lupa ×3 que sigue al cursor, del lado del divisor donde esté.
 * - `original`: fuerza a ver la imagen de entrada completa (botón "mantener").
 */
export function Comparador({ entrada, salida, semilla, lupa = false, original = false }: { entrada: string; salida: string; semilla: number; lupa?: boolean; original?: boolean }) {
  const [pos, setPos] = useState(50)
  const [puntero, setPuntero] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const caja = useRef<HTMLDivElement>(null)
  const divisor = original ? 100 : pos

  const mover = (e: PointerEvent) => {
    if (!lupa || e.pointerType === 'touch' || !caja.current) return
    const r = caja.current.getBoundingClientRect()
    setPuntero({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height })
  }

  const ladoAntes = puntero ? (puntero.x / puntero.w) * 100 < divisor : false

  return (
    <div
      ref={caja}
      onPointerMove={mover}
      onPointerLeave={() => setPuntero(null)}
      className="relative aspect-[3/2] w-full max-h-full max-w-full overflow-hidden rounded-lg bg-black select-none lg:h-full lg:w-auto"
      style={{ '--pos': `${divisor}%` } as CSSProperties}
    >
      <img key={salida} src={salida} alt={`Después: salida generada con la semilla ${semilla}`} className="absolute inset-0 size-full animate-entrar object-cover" />
      <img
        src={entrada}
        alt="Antes: tu imagen"
        className="absolute inset-0 size-full object-cover transition-[clip-path] duration-500 ease-[var(--ease-suave)]"
        style={{ clipPath: 'inset(0 calc(100% - var(--pos)) 0 0)' }}
      />

      {!original && (
        <>
          <div className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white/90 shadow-[0_0_24px_rgb(255_255_255/0.5)]" style={{ left: 'var(--pos)' }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow-[0_10px_30px_rgb(0_0_0/0.4)] ring-1 ring-white backdrop-blur-xl"
            style={{ left: 'var(--pos)' }}
          >
            <ChevronsLeftRight size={20} strokeWidth={2.25} />
          </div>
        </>
      )}

      <div className="pointer-events-none absolute top-4 left-4">
        <Capsula tono="oscura">{original ? 'Original, sin IA' : 'Antes'}</Capsula>
      </div>
      {!original && (
        <div className="pointer-events-none absolute top-4 right-4">
          <Capsula tono="ia">Después, con IA</Capsula>
        </div>
      )}

      {lupa && puntero && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 flex flex-col items-center gap-2"
          style={{ left: puntero.x - LENTE / 2, top: puntero.y - LENTE / 2 }}
        >
          <div
            className="rounded-full ring-2 ring-white shadow-[0_20px_50px_-10px_rgb(0_0_0/0.7)]"
            style={{
              width: LENTE,
              height: LENTE,
              backgroundImage: `url(${ladoAntes ? entrada : salida})`,
              backgroundSize: `${puntero.w * ZOOM}px ${puntero.h * ZOOM}px`,
              backgroundPosition: `${-(puntero.x * ZOOM - LENTE / 2)}px ${-(puntero.y * ZOOM - LENTE / 2)}px`,
              backgroundRepeat: 'no-repeat',
            }}
          />
          <Capsula tono={ladoAntes ? 'oscura' : 'ia'}>
            {ladoAntes ? 'Antes' : 'Después'} ×{ZOOM}
          </Capsula>
        </div>
      )}

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Mover el divisor entre antes y después"
        className={`absolute inset-0 size-full appearance-none bg-transparent opacity-0 ${lupa ? 'cursor-none' : 'cursor-ew-resize'}`}
      />
    </div>
  )
}
