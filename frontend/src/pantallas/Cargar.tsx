import { LoaderCircle, Play, ShieldCheck } from 'lucide-react'
import { useEstado } from '../contexto'
import { ES_EJEMPLO, SUB_TAREAS } from '../datos/ejemplo'
import { TareaElegida } from '../components/TareaElegida'
import { useAvisar } from '../components/usarAvisos'
import { ZonaCarga } from '../components/ZonaCarga'
import { Actual, Boton, Diseno, Enlace, Rango, Seccion } from '../components/ui'
import { cx } from '../utilidades'

const MAX_BYTES = 10 * 1024 * 1024

const NIVELES = [
  { hasta: 0.34, texto: 'Poca' },
  { hasta: 0.6, texto: 'Media' },
  { hasta: 9, texto: 'Mucha' },
]

export function Cargar() {
  const { subTarea, entradaElegida, setEntradaElegida, archivoPropio, setArchivoPropio, ajustes, setAjuste, enviando, iniciar } = useEstado()
  const avisar = useAvisar()
  const t = SUB_TAREAS[subTarea]
  const valor = (clave: string) => ajustes[subTarea]?.[clave] ?? t.parametros.find((p) => p.clave === clave)!.valor
  const p0 = t.parametros[0]
  const libertad = Math.min(1, ((valor(p0.clave) - p0.min) / (p0.max - p0.min)) * 0.7 + 0.1)
  const nivel = NIVELES.find((n) => libertad < n.hasta)!

  const usarArchivo = (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return avisar('El archivo tiene que ser una imagen (JPG, PNG o WEBP).', 'error')
    if (f.size > MAX_BYTES) return avisar('La imagen pesa más de 10 MB.', 'error')
    if (archivoPropio) URL.revokeObjectURL(archivoPropio.url)
    setArchivoPropio({ url: URL.createObjectURL(f), nombre: f.name, archivo: f })
    setEntradaElegida('propia')
  }

  const vista =
    entradaElegida === 'propia' && archivoPropio
      ? { src: archivoPropio.url, nombre: archivoPropio.nombre }
      : entradaElegida && entradaElegida !== 'propia'
        ? { src: SUB_TAREAS[entradaElegida].entrada, nombre: SUB_TAREAS[entradaElegida].archivo }
        : null

  const principal = (
    <div className="relative flex min-h-full flex-col gap-6 p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 rounded-t-lg bg-[linear-gradient(180deg,rgb(180_156_255/0.28),transparent)]" />
      <header className="relative">
        <h1 className="titular text-[clamp(34px,3.8vw,54px)]">Restaurá una foto y mirá qué inventó la IA</h1>
        <p className="mt-3 max-w-[44rem] text-[16px] text-gris">
          Un modelo de difusión la mejora. Después la ponés bajo una lámpara UV y todo lo que agregó el modelo se ilumina.
        </p>
      </header>

      <ZonaCarga vista={vista} onArchivo={usarArchivo} onQuitar={() => setEntradaElegida(null)} />

      <Seccion titulo="Probá con un ejemplo">
        <button
          type="button"
          onClick={() => setEntradaElegida(subTarea)}
          aria-pressed={entradaElegida === subTarea}
          className={cx(
            'flex items-center gap-4 rounded-lg p-2.5 text-left transition-colors duration-200',
            entradaElegida === subTarea ? 'bg-tarjeta-2 ring-1 ring-fluor/60' : 'bg-tarjeta hover:bg-tarjeta-2',
          )}
        >
          <img src={t.entrada} alt="" className="aspect-[16/9] w-40 shrink-0 rounded-md object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold">{t.archivo}</span>
            <span className="block text-[13px] text-gris">
              {t.medidas}: una foto chica, ideal para ver qué inventa el modelo al agrandarla.
            </span>
            <span className={cx('mt-1 block text-[13px] font-bold', entradaElegida === subTarea ? 'text-fluor' : 'text-white')}>
              {entradaElegida === subTarea ? 'Elegida' : 'Usar este ejemplo'}
            </span>
          </span>
        </button>
      </Seccion>
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-7 p-5">
      <Seccion titulo="Qué va a hacer">
        <TareaElegida id={subTarea} />
      </Seccion>

      <Seccion titulo="Ajustes">
        <div className="flex flex-col gap-2">
          {t.parametros.slice(0, 2).map((p) => (
            <Rango key={subTarea + p.clave} id={`aj-${p.clave}`} etiqueta={p.etiqueta} valor={valor(p.clave)} min={p.min} max={p.max} paso={p.paso} onChange={(v) => setAjuste(subTarea, p.clave, v)} />
          ))}
        </div>
      </Seccion>

      <p className="flex gap-3 rounded-md bg-tarjeta-2 p-3.5 text-[13px] leading-snug text-gris">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-white" />
        <span>
          <strong className="block text-white">Es una reconstrucción, no una prueba.</strong>
          No la uses como evidencia, documento oficial ni para diagnósticos.
        </span>
      </p>
    </div>
  )

  const barra = (
    <>
      <Actual imagen={vista?.src} titulo={vista ? vista.nombre : 'Ninguna imagen elegida'} subtitulo={t.titulo} />
      <div className="flex justify-center">
        {vista && ES_EJEMPLO ? (
          <Enlace href="#/restaurar" variante="marca" className="min-h-12 px-8">
            <Play size={18} fill="currentColor" /> Restaurar imagen
          </Enlace>
        ) : vista ? (
          <Boton variante="marca" disabled={enviando} className="min-h-12 px-8" onClick={() => iniciar().catch((e: Error) => avisar(e.message, 'error'))}>
            {enviando ? <LoaderCircle size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            {enviando ? 'Enviando…' : 'Restaurar imagen'}
          </Boton>
        ) : (
          <Boton variante="marca" disabled className="min-h-12 px-8">
            <Play size={18} fill="currentColor" /> Elegí una imagen
          </Boton>
        )}
      </div>
      <div className="hidden items-center justify-end gap-3 sm:flex" aria-live="polite">
        <span className="text-[13px] text-gris">Libertad para inventar</span>
        <span className="h-1 w-28 overflow-hidden rounded-full bg-white/25">
          <span className="fondo-ia block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(8, libertad * 100)}%` }} />
        </span>
        <span className="w-12 text-[13px] font-bold">{nivel.texto}</span>
      </div>
    </>
  )

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Qué va a hacer" />
}
