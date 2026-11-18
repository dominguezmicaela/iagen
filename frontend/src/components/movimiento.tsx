import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cx } from './ui'

const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Mide la posición de la opción activa para que la pastilla se deslice hasta ella. */
export function useIndicador(activo: number, deps: unknown[] = []) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [caja, setCaja] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const medir = () => {
      const el = refs.current[activo]
      if (el) setCaja({ left: el.offsetLeft, width: el.offsetWidth })
    }
    medir()
    document.fonts?.ready.then(medir)
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, ...deps])

  return { refs, caja }
}

/** Selector de opciones en chips (activo en blanco). */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: { id: T; nombre: string }[]
  valor: T
  onChange: (v: T) => void
  etiqueta: string
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === valor}
          onClick={() => onChange(o.id)}
          className={cx(
            'min-h-9 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap transition-colors duration-200',
            o.id === valor ? 'bg-white text-black' : 'bg-elevado text-white hover:bg-[#3a3a3a]',
          )}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  )
}

/** Número que se anima hasta su nuevo valor. */
export function NumeroAnimado({ valor, decimales = 1 }: { valor: number; decimales?: number }) {
  const [mostrado, setMostrado] = useState(valor)
  const actual = useRef(valor)

  useEffect(() => {
    if (sinMovimiento()) {
      actual.current = valor
      setMostrado(valor)
      return
    }
    const desde = actual.current
    const t0 = performance.now()
    let raf = 0
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 500)
      const v = desde + (valor - desde) * (1 - Math.pow(1 - k, 3))
      actual.current = v
      setMostrado(v)
      if (k < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor])

  return <>{mostrado.toFixed(decimales).replace('.', ',')}</>
}
