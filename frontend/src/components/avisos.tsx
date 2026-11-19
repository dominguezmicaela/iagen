import { Check, TriangleAlert } from 'lucide-react'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { CtxAvisos, type Tono } from './usarAvisos'

/** Avisos breves (toasts) que confirman una acción o cuentan qué falló. */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; tono: Tono; id: number } | null>(null)
  const timer = useRef(0)
  const avisar = useCallback((texto: string, tono: Tono = 'ok') => {
    window.clearTimeout(timer.current)
    setAviso({ texto, tono, id: Date.now() })
    timer.current = window.setTimeout(() => setAviso(null), tono === 'error' ? 6000 : 3200)
  }, [])

  return (
    <CtxAvisos.Provider value={avisar}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {aviso && (
          <p key={aviso.id} className="vidrio-oscuro flex animate-entrar items-center gap-3 rounded-full py-2.5 pr-5 pl-2.5 text-[14px] font-medium">
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-black ${aviso.tono === 'error' ? 'fondo-ia' : 'bg-real'}`}>
              {aviso.tono === 'error' ? <TriangleAlert size={15} strokeWidth={2.5} /> : <Check size={15} strokeWidth={3} />}
            </span>
            {aviso.texto}
          </p>
        )}
      </div>
    </CtxAvisos.Provider>
  )
}
