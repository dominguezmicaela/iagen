import { createContext, useContext } from 'react'

// Contexto de los avisos breves; el proveedor que los muestra está en avisos.tsx.

export type Tono = 'ok' | 'error'

export const CtxAvisos = createContext<(texto: string, tono?: Tono) => void>(() => {})

export const useAvisar = () => useContext(CtxAvisos)
