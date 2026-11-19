import { BarraSuperior, ColumnaRestauraciones } from './components/BarraSuperior'
import { ProveedorAvisos } from './components/avisos'
import { useEstado } from './contexto'
import { ProveedorEstado } from './estado'
import { Analizar } from './pantallas/Analizar'
import { Cargar } from './pantallas/Cargar'
import { Comparar } from './pantallas/Comparar'
import { Revelando } from './pantallas/Revelando'

function Pantalla() {
  const { pantalla } = useEstado()
  switch (pantalla) {
    case 'restaurar':
      return <Revelando />
    case 'revisar':
      return <Comparar />
    case 'lampara':
      return <Analizar />
    default:
      return <Cargar />
  }
}

function Marco() {
  const { pantalla } = useEstado()
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] gap-2 bg-negro p-2 lg:h-dvh lg:min-h-[740px] lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto]">
      <BarraSuperior />
      <ColumnaRestauraciones />
      <Pantalla key={pantalla} />
    </div>
  )
}

export default function App() {
  return (
    <ProveedorEstado>
      <ProveedorAvisos>
        <Marco />
      </ProveedorAvisos>
    </ProveedorEstado>
  )
}
