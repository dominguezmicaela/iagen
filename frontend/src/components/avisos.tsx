import { Check } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const Ctx = createContext<(texto: string) => void>(() => {})

/** Avisos breves (toasts) que confirman una acción. */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; id: number } | null>(null)
  const timer = useRef(0)
  const avisar = useCallback((texto: string) => {
    window.clearTimeout(timer.current)
    setAviso({ texto, id: Date.now() })
    timer.current = window.setTimeout(() => setAviso(null), 3200)
  }, [])

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {aviso && (
          <p key={aviso.id} className="vidrio-oscuro flex animate-entrar items-center gap-3 rounded-full py-2.5 pr-5 pl-2.5 text-[14px] font-medium">
            <span className="grid size-7 place-items-center rounded-full bg-real text-black">
              <Check size={15} strokeWidth={3} />
            </span>
            {aviso.texto}
          </p>
        )}
      </div>
    </Ctx.Provider>
  )
}

export const useAvisar = () => useContext(Ctx)
