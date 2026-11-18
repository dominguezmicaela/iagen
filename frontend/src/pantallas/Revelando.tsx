import { Check, Columns2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EJECUCION, REVELADO, SEMILLAS, SUB_TAREAS } from '../datos/ejemplo'
import { useEstado } from '../estado'
import { Actual, BotonIcono, Diseno, Enlace, Seccion, cx } from '../components/ui'

const fmt = (n: number | string) => String(n).replace('.', ',')

const FASES = [
  { hasta: 0.3, titulo: 'Parte del ruido', detalle: 'Arranca de ruido, guiada por tu foto.' },
  { hasta: 0.65, titulo: 'Define las formas', detalle: 'Aparecen la composición y los contornos.' },
  { hasta: 1, titulo: 'Inventa el detalle fino', detalle: 'Textura, bordes y reflejos que tu foto no tenía.' },
]

export function Revelando() {
  const { subTarea, semilla, ajustes } = useEstado()
  const t = SUB_TAREAS[subTarea]
  const valor = (clave: string) => ajustes[subTarea]?.[clave] ?? t.parametros.find((p) => p.clave === clave)?.valor ?? 0
  const total = valor('steps') || 50
  const salida = SEMILLAS.find((s) => s.valor === semilla)?.imagen ?? SEMILLAS[0].imagen
  const [paso, setPaso] = useState(0)
  const [vuelta, setVuelta] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setPaso((p) => {
        if (p >= total) {
          window.clearInterval(id)
          return p
        }
        return p + 1
      })
    }, 5200 / total)
    return () => window.clearInterval(id)
  }, [total, vuelta])

  const avance = paso / total
  const listo = paso >= total
  const faseActual = listo ? FASES.length : FASES.findIndex((f) => avance <= f.hasta)
  const restante = Math.max(0, (total - paso) * EJECUCION.segundosPorPaso)
  const fotogramas = [...REVELADO.fotogramas.map((f) => ({ ...f, paso: Math.round((f.paso / 50) * total) })), { paso: total, imagen: salida }]

  const principal = (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <header>
        <h1 className="titular text-[clamp(30px,3vw,44px)]">{listo ? 'Restaurada' : 'Restaurando tu foto'}</h1>
        <p className="mt-2 text-[15px] text-gris">{t.titulo}, con {t.modelo}</p>
      </header>

      <div className="flex min-h-[240px] flex-1 items-center justify-center">
        <div className="relative aspect-[3/2] w-full max-h-full max-w-full overflow-hidden rounded-lg bg-black lg:h-full lg:w-auto">
          <img
            src={salida}
            alt={listo ? 'Imagen restaurada' : `Imagen a mitad de la difusión, paso ${paso} de ${total}`}
            className="absolute inset-0 size-full scale-[1.06] object-cover"
            style={{ filter: `blur(${(1 - avance) * 22}px) saturate(${0.3 + avance * 0.7}) brightness(${0.75 + 0.25 * avance})` }}
          />
          <svg aria-hidden="true" className="absolute inset-0 size-full mix-blend-overlay" style={{ opacity: Math.pow(1 - avance, 0.8) * 0.9 }}>
            <filter id="grano">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" seed={paso} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grano)" />
          </svg>
        </div>
      </div>

      <Seccion titulo="Cómo fue apareciendo">
        <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {fotogramas.map((f) => {
            const visto = paso >= f.paso
            return (
              <li key={f.paso} className="rounded-lg bg-tarjeta p-2">
                <span className="block aspect-[16/9] overflow-hidden rounded-md bg-tarjeta-2">
                  {visto && <img src={f.imagen} alt="" className="size-full animate-entrar object-cover" />}
                </span>
                <span className={cx('mt-1.5 block text-[13px] font-bold', !visto && 'text-gris-2')}>{f.paso === total ? 'Final' : `Paso ${f.paso}`}</span>
              </li>
            )
          })}
        </ol>
      </Seccion>
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-7 p-5">
      <Seccion titulo="Qué está haciendo el modelo">
        <ol className="-mx-2 flex flex-col">
          {FASES.map((f, i) => {
            const hecho = i < faseActual
            const ahora = i === faseActual
            return (
              <li key={f.titulo} className={cx('flex items-start gap-3 rounded-md p-2 transition-colors duration-300', ahora && 'bg-tarjeta-2')}>
                <span
                  className={cx(
                    'grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold',
                    hecho && 'bg-white text-black',
                    ahora && 'fondo-ia text-black',
                    !hecho && !ahora && 'bg-elevado text-gris',
                  )}
                >
                  {hecho ? <Check size={16} strokeWidth={3} /> : i + 1}
                </span>
                <span>
                  <span className={cx('block text-[15px] font-bold', ahora && 'text-fluor', !hecho && !ahora && 'text-gris')}>{f.titulo}</span>
                  <span className="block text-[13px] text-gris">{f.detalle}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </Seccion>

      <Seccion titulo="Configuración">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14px]">
          {t.parametros.map((p) => (
            <div key={p.clave} className="contents">
              <dt className="text-gris">{p.etiqueta}</dt>
              <dd className="text-right font-bold">{fmt(valor(p.clave))}</dd>
            </div>
          ))}
          <dt className="text-gris">Semilla</dt>
          <dd className="text-right font-bold">{semilla}</dd>
        </dl>
      </Seccion>

      <p className="rounded-md bg-tarjeta-2 p-3.5 text-[13px] leading-snug text-gris">
        <strong className="block text-white">Probá otra semilla después.</strong>
        Con otra semilla el detalle inventado cambia. En la próxima pantalla vas a poder comparar cuatro.
      </p>
    </div>
  )

  const barra = (
    <>
      <Actual imagen={t.entrada} titulo={t.archivo} subtitulo={listo ? 'Restaurada' : FASES[faseActual]?.titulo} />
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1.5 justify-self-center">
        <div className="flex items-center gap-2">
          <BotonIcono
            etiqueta="Repetir"
            onClick={() => {
              setPaso(0)
              setVuelta((v) => v + 1)
            }}
          >
            <RotateCcw size={18} />
          </BotonIcono>
          {listo ? (
            <Enlace href="#/revisar" variante="marca" className="min-h-11 px-6">
              <Columns2 size={18} /> Revisar resultado
            </Enlace>
          ) : (
            <Enlace href="#/subir" variante="contorno" className="min-h-11 px-6">
              Cancelar
            </Enlace>
          )}
        </div>
        <div className="flex w-full items-center gap-3 text-[12px] text-gris" aria-live="polite">
          <span className="w-14 text-right">Paso {paso}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={paso} aria-label="Pasos de difusión">
            <div className="fondo-ia h-full rounded-full transition-[width] duration-100" style={{ width: `${avance * 100}%` }} />
          </div>
          <span className="w-14">{total}</span>
        </div>
      </div>
      <p className="hidden text-right text-[13px] text-gris sm:block">{listo ? 'Listo' : `Faltan ${fmt(restante.toFixed(1))} s`}</p>
    </>
  )

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Qué está haciendo el modelo" />
}
