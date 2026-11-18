import '@fontsource-variable/figtree'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { tonoActual } from './components/tonoIA'
import './index.css'

document.documentElement.dataset.ia = tonoActual()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
