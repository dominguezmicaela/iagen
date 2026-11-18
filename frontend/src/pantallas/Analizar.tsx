import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MAPAS, MARCAS, PORCENTAJES, SEMILLAS, SUB_TAREAS } from '../datos/ejemplo'
import { useEstado, type ModoMapa } from '../estado'
import { useAvisar } from '../components/avisos'
import { LamparaUV } from '../components/LamparaUV'
import { NumeroAnimado, Segmentado } from '../components/movimiento'
import { Actual, Boton, Diseno, Interruptor, Rango, Seccion, Tecla, cx, escribiendo } from '../components/ui'

const enFrase = (xs: string[]) => xs.map((x, i) => (i ? x[0].toLowerCase() + x.slice(1) : x)).join(', ') + '.'

const MODOS: { id: ModoMapa; nombre: string; ayuda: string }[] = [
  { id: 'diferencia', nombre: 'Contra tu foto', ayuda: 'Se ilumina lo que cambió respecto de tu foto agrandada de forma clásica.' },
  { id: 'variacion', nombre: 'Entre semillas', ayuda: 'Se ilumina lo que cambia entre 4 semillas: no sale de tu foto, lo eligió el modelo.' },
]

export function Analizar() {
  const { subTarea, semilla, modoMapa, setModoMapa } = useEstado()
  const avisar = useAvisar()
  const t = SUB_TAREAS[subTarea]
  const [umbral, setUmbral] = useState(40)
  const [intensidad, setIntensidad] = useState(95)
  const [completa, setCompleta] = useState(false)
  const [verMarcas, setVerMarcas] = useState(true)
  const [marcaActiva, setMarcaActiva] = useState<number | null>(null)

  const salida = SEMILLAS.find((s) => s.valor === semilla)?.imagen ?? SEMILLAS[0].imagen
  const mapa = modoMapa === 'diferencia' ? t.diferencias : MAPAS.variacion
  const serie = PORCENTAJES[modoMapa === 'diferencia' ? subTarea : 'variacion']
  const pct = serie[Math.round(umbral / 5) - 1] ?? 0
  const modo = MODOS.find((m) => m.id === modoMapa)!

  // Atajos: U = todo bajo UV · Z = zonas
  useEffect(() => {
    const abajo = (e: KeyboardEvent) => {
      if (escribiendo(e) || e.repeat) return
      const k = e.key.toLowerCase()
      if (k === 'u') setCompleta((x) => !x)
      if (k === 'z') setVerMarcas((x) => !x)
    }
    window.addEventListener('keydown', abajo)
    return () => window.removeEventListener('keydown', abajo)
  }, [])

  const principal = (
    <div className="flex min-h-full flex-col gap-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="titular text-[clamp(30px,3vw,44px)]">Lámpara UV</h1>
        <Segmentado etiqueta="Comparar" opciones={MODOS.map((m) => ({ id: m.id, nombre: m.nombre }))} valor={modoMapa} onChange={setModoMapa} />
      </header>

      <div className="flex min-h-[240px] flex-1 items-center justify-center">
        <LamparaUV
          base={salida}
          mapa={mapa}
          umbral={umbral}
          intensidad={intensidad / 100}
          completa={completa}
          marcas={verMarcas}
          marcaActiva={marcaActiva}
          onMarca={setMarcaActiva}
          descripcion={`Bajo luz UV se iluminan las zonas que cambiaron más del ${umbral} %`}
        />
      </div>

      <Seccion titulo="Zonas que se iluminan">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MARCAS.map((m, i) => (
            <li
              key={m.titulo}
              onMouseEnter={() => setMarcaActiva(i)}
              onMouseLeave={() => setMarcaActiva(null)}
              className={cx('rounded-lg p-2.5 transition-colors duration-200', marcaActiva === i ? 'bg-tarjeta-2' : 'bg-tarjeta')}
            >
              <span
                aria-hidden="true"
                className="relative block aspect-[16/9] overflow-hidden rounded-md bg-no-repeat"
                style={{ backgroundImage: `url(${salida})`, backgroundSize: '320%', backgroundPosition: `${m.x}% ${m.y}%` }}
              >
                <span className={cx('absolute top-2 left-2 grid size-7 place-items-center rounded-full text-[13px] font-bold', marcaActiva === i ? 'bg-white text-black' : 'fondo-ia text-black')}>{i + 1}</span>
              </span>
              <span className="mt-2 block truncate text-[15px] font-bold">{m.titulo}</span>
              <span className="line-clamp-2 block text-[13px] leading-snug text-gris">{m.detalle}</span>
            </li>
          ))}
        </ol>
      </Seccion>
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-7 p-5">
      <section className="flex flex-col gap-3" aria-live="polite">
        <p className="titular text-[30px]">
          Se ilumina el <NumeroAnimado valor={pct} /> % de la imagen
        </p>
        <div className="flex h-2 gap-1" aria-hidden="true">
          <span className="fondo-ia rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
          <span className="flex-1 rounded-full bg-white/80" />
        </div>
        <div className="flex justify-between text-[13px] text-gris">
          <span className="flex items-center gap-2">
            <span className="fondo-ia size-2.5 rounded-full" /> Inventado o cambiado
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-white/80" /> De tu foto
          </span>
        </div>
        <p className="text-[13px] leading-snug text-gris-2">{modo.ayuda}</p>
      </section>

      <Seccion titulo="Ajustes de la lámpara">
        <div className="flex flex-col gap-2">
          <Rango id="umbral" etiqueta="Umbral de cambio" valor={umbral} min={5} max={95} paso={5} onChange={setUmbral} formato={(v) => `${v} %`} />
          <Rango id="intensidad" etiqueta="Intensidad del brillo" valor={intensidad} min={0} max={100} paso={5} onChange={setIntensidad} formato={(v) => `${v} %`} />
        </div>
      </Seccion>

      <Seccion titulo="Real e inventado">
        <div className="flex flex-col gap-3 text-[14px] leading-snug">
          <p>
            <span className="block font-bold">De tu foto</span>
            <span className="text-gris">{enFrase(t.real)}</span>
          </p>
          <p>
            <span className="block font-bold text-fluor">Lo inventó la IA</span>
            <span className="text-gris">{enFrase(t.inventado)}</span>
          </p>
        </div>
      </Seccion>
    </div>
  )

  const barra = (
    <>
      <Actual imagen={salida} titulo="Bajo luz UV" subtitulo={`${modo.nombre}, semilla ${semilla}`} />
      <div className="flex flex-wrap items-center justify-center gap-x-6">
        <Interruptor checked={completa} onChange={setCompleta}>
          Toda la imagen <Tecla>U</Tecla>
        </Interruptor>
        <Interruptor checked={verMarcas} onChange={setVerMarcas}>
          Zonas <Tecla>Z</Tecla>
        </Interruptor>
      </div>
      <div className="hidden justify-end sm:flex">
        <Boton variante="blanco" className="min-h-10 px-5 text-[14px]" onClick={() => avisar('Informe exportado con el mapa de lo inventado')}>
          <Download size={17} /> Exportar informe
        </Boton>
      </div>
    </>
  )

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Qué inventó" />
}
