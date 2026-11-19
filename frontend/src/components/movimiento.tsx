import { useEffect, useRef, useState } from 'react'
import { cx } from '../utilidades'

const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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

  const quieto = sinMovimiento()

  useEffect(() => {
    if (quieto) {
      // sin animación se muestra el valor directo (ver el return); solo se guarda como punto de partida
      actual.current = valor
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
  }, [valor, quieto])

  return <>{(quieto ? valor : mostrado).toFixed(decimales).replace('.', ',')}</>
}
