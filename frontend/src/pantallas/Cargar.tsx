import { Focus, ImagePlus, LoaderCircle, Palette, Play, ShieldCheck, X, ZoomIn } from 'lucide-react'
import { useState, type DragEvent, type ReactNode } from 'react'
import { ES_EJEMPLO, SEMILLAS, SUB_TAREAS, type SubTareaId } from '../datos/ejemplo'
import { useEstado } from '../estado'
import { useAvisar } from '../components/avisos'
import { LamparaUV } from '../components/LamparaUV'
import { Actual, Boton, Capsula, Diseno, Enlace, Rango, Seccion, Tarjeta, cx } from '../components/ui'

const IDS: SubTareaId[] = ['A', 'B', 'C']
const MAX_BYTES = 10 * 1024 * 1024
/** Sin backend para B y C: solo se pueden recorrer en el modo demo. */
const disponible = (id: SubTareaId) => ES_EJEMPLO || id === 'A'
const ICONO: Record<SubTareaId, ReactNode> = { A: <ZoomIn size={22} />, B: <Focus size={22} />, C: <Palette size={22} /> }

const NIVELES = [
  { hasta: 0.34, texto: 'Poca' },
  { hasta: 0.6, texto: 'Media' },
  { hasta: 9, texto: 'Mucha' },
]

export function Cargar() {
  const { subTarea, setSubTarea, entradaElegida, setEntradaElegida, archivoPropio, setArchivoPropio, ajustes, setAjuste, enviando, iniciar } = useEstado()
  const avisar = useAvisar()
  const [encima, setEncima] = useState(false)
  const t = SUB_TAREAS[subTarea]
  const valor = (clave: string) => ajustes[subTarea]?.[clave] ?? t.parametros.find((p) => p.clave === clave)!.valor
  const p0 = t.parametros[0]
  const libertad = Math.min(1, ((valor(p0.clave) - p0.min) / (p0.max - p0.min)) * 0.7 + (subTarea === 'C' ? 0.35 : 0.1))
  const nivel = NIVELES.find((n) => libertad < n.hasta)!

  const usarArchivo = (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return avisar('El archivo tiene que ser una imagen (JPG, PNG o WEBP).', 'error')
    if (f.size > MAX_BYTES) return avisar('La imagen pesa más de 10 MB.', 'error')
    if (archivoPropio) URL.revokeObjectURL(archivoPropio.url)
    setArchivoPropio({ url: URL.createObjectURL(f), nombre: f.name, archivo: f })
    setEntradaElegida('propia')
  }
  const alSoltar = (e: DragEvent) => {
    e.preventDefault()
    setEncima(false)
    usarArchivo(e.dataTransfer.files[0])
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

      <div className="relative flex min-h-[260px] flex-1">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setEncima(true)
          }}
          onDragLeave={() => setEncima(false)}
          onDrop={alSoltar}
          className={cx(
            'group relative flex flex-1 cursor-pointer overflow-hidden rounded-lg bg-black transition-all duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white',
            encima && 'ring-2 ring-fluor',
          )}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => usarArchivo(e.target.files?.[0])} />
          {vista ? (
            <img key={vista.src} src={vista.src} alt={`Imagen elegida: ${vista.nombre}`} className="absolute inset-0 size-full animate-entrar object-contain" />
          ) : (
            <>
              <LamparaUV decorativa base={SEMILLAS[0].imagen} mapa={SUB_TAREAS.A.diferencias} umbral={40} intensidad={0.95} completa={false} marcas={false} descripcion="" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="pointer-events-none absolute top-3 right-3">
                <Capsula tono="ia">Lo que se ilumina lo inventó la IA</Capsula>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 p-5">
                <span className="fondo-ia grid size-14 shrink-0 place-items-center rounded-full text-black shadow-[0_8px_24px_rgb(0_0_0/0.5)] transition-transform duration-200 group-hover:scale-105">
                  <ImagePlus size={24} />
                </span>
                <span>
                  <span className="block text-[20px] font-extrabold">{encima ? 'Soltala para usarla' : 'Arrastrá tu foto o elegila'}</span>
                  <span className="block text-[14px] text-gris">JPG o PNG, hasta 10 MB. Se procesa en tu computadora.</span>
                </span>
              </div>
            </>
          )}
        </label>
        {vista && (
          <>
            <div className="pointer-events-none absolute top-3 left-3">
              <Capsula>{vista.nombre}</Capsula>
            </div>
            <button
              type="button"
              onClick={() => setEntradaElegida(null)}
              className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              aria-label="Quitar imagen"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>

      <Seccion titulo="Probá con un ejemplo">
        <div className="grid grid-cols-3 gap-3">
          {IDS.map((id) => (
            <Tarjeta
              key={id}
              imagen={SUB_TAREAS[id].entrada}
              titulo={SUB_TAREAS[id].titulo}
              subtitulo={SUB_TAREAS[id].archivo}
              activa={entradaElegida === id}
              etiqueta={`Usar el ejemplo ${SUB_TAREAS[id].titulo}`}
              insignia={!disponible(id) && <Capsula>Próximamente</Capsula>}
              onClick={
                disponible(id)
                  ? () => {
                      setEntradaElegida(id)
                      setSubTarea(id)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </Seccion>
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-7 p-5">
      <Seccion titulo="Qué querés arreglar">
        <fieldset className="-mx-2 flex flex-col">
          <legend className="sr-only">Tipo de restauración</legend>
          {IDS.map((id) => {
            const m = SUB_TAREAS[id]
            const activo = subTarea === id
            const habilitado = disponible(id)
            return (
              <label
                key={id}
                className={cx(
                  'flex items-start gap-3 rounded-md p-2 transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white',
                  activo ? 'bg-tarjeta-2' : habilitado ? 'cursor-pointer hover:bg-tarjeta' : 'cursor-not-allowed opacity-50',
                )}
              >
                <input type="radio" name="modo" value={id} checked={activo} disabled={!habilitado} onChange={() => setSubTarea(id)} className="sr-only" />
                <span className={cx('grid size-12 shrink-0 place-items-center rounded-md', activo ? 'fondo-ia text-black' : 'bg-elevado text-white')}>{ICONO[id]}</span>
                <span className="min-w-0">
                  <span className={cx('block text-[15px] font-bold', activo && 'text-fluor')}>{m.titulo}</span>
                  <span className="block text-[13px] text-gris">{m.bajada}</span>
                  <span className="mt-0.5 block text-[13px] text-fluor">{habilitado ? `Inventa ${m.inventa}.` : 'Próximamente.'}</span>
                </span>
              </label>
            )
          })}
        </fieldset>
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

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Qué querés arreglar" />
}
