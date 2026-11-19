import { Columns2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EJECUCION, ES_EJEMPLO, REVELADO, SEMILLAS, SUB_TAREAS } from '../datos/ejemplo'
import { pasosFotograma } from '../datos/vista'
import { useEstado } from '../contexto'
import { FasesModelo, TiraFotogramas } from '../components/ProgresoDifusion'
import { useAvisar } from '../components/usarAvisos'
import { Actual, BotonIcono, Diseno, Enlace, Seccion } from '../components/ui'

const fmt = (n: number | string) => String(n).replace('.', ',')

const FASES = [
  { hasta: 0.3, titulo: 'Parte del ruido', detalle: 'Arranca de ruido, guiada por tu foto.' },
  { hasta: 0.65, titulo: 'Define las formas', detalle: 'Aparecen la composición y los contornos.' },
  { hasta: 1, titulo: 'Inventa el detalle fino', detalle: 'Textura, bordes y reflejos que tu foto no tenía.' },
]

export function Revelando() {
  const { subTarea, semilla, ajustes, trabajo, historial, iniciar, enviando } = useEstado()
  const avisar = useAvisar()
  const t = SUB_TAREAS[subTarea]
  const valor = (clave: string) => ajustes[subTarea]?.[clave] ?? t.parametros.find((p) => p.clave === clave)?.valor ?? 0
  const [pasoDemo, setPaso] = useState(0)
  const [vuelta, setVuelta] = useState(0)
  const real = !ES_EJEMPLO
  const fallo = real && trabajo?.estado === 'error'

  useEffect(() => {
    if (fallo) avisar(trabajo?.error ?? 'No se pudo restaurar la imagen.', 'error')
  }, [fallo, trabajo?.error, avisar])

  // En el modo real todo sale del trabajo; la simulación queda solo para la demo.
  const totalDemo = valor('steps') || 50
  const enCurso = real && trabajo !== null && trabajo.estado !== 'listo'
  const total = real ? trabajo?.total || totalDemo : totalDemo
  const enPrincipal = real ? (trabajo?.semilla_indice ?? 0) === 0 && ['en_cola', 'restaurando'].includes(trabajo?.estado ?? 'en_cola') : true
  const paso = real ? (enPrincipal ? (trabajo?.paso ?? 0) : total) : pasoDemo
  const salidaReal = trabajo?.resultado?.semillas[0]?.imagen
  const fotogramasReales = trabajo?.fotogramas ?? []
  const salida = real
    ? (salidaReal ?? fotogramasReales.at(-1)?.imagen ?? historial.find((h) => h.id === trabajo?.id)?.miniatura ?? '')
    : (SEMILLAS.find((s) => s.valor === semilla)?.imagen ?? SEMILLAS[0].imagen)

  useEffect(() => {
    if (real) return
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
  }, [total, vuelta, real])

  const avance = paso / total
  const listo = real ? trabajo?.estado === 'listo' : paso >= total
  const faseActual = listo ? FASES.length : FASES.findIndex((f) => avance <= f.hasta)
  const pasosRestantes = real ? ((trabajo?.semillas_total ?? 1) - (trabajo?.semilla_indice ?? 0)) * total - (trabajo?.paso ?? 0) : total - paso
  const restante = Math.max(0, pasosRestantes * (real ? (trabajo?.segundos_por_paso ?? 0) : EJECUCION.segundosPorPaso))
  const avanceBarra = real && !enPrincipal ? (trabajo?.estado === 'restaurando' ? (trabajo.paso ?? 0) / total : 1) : avance
  const fotogramas = real
    ? [...pasosFotograma(total).map((p) => ({ paso: p, imagen: fotogramasReales.find((f) => f.paso === p)?.imagen ?? '' })), { paso: total, imagen: salidaReal ?? '' }]
    : [...REVELADO.fotogramas.map((f) => ({ ...f, paso: Math.round((f.paso / 50) * total) })), { paso: total, imagen: salida }]
  const textoBarra = fallo ? 'Error' : listo ? 'Restaurada' : real && !enPrincipal ? trabajo?.etapa : FASES[faseActual]?.titulo
  const repetir = () =>
    real
      ? iniciar().catch((e: Error) => avisar(e.message, 'error'))
      : (setPaso(0), setVuelta((v) => v + 1))

  const principal = (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <header>
        <h1 className="titular text-[clamp(30px,3vw,44px)]">{fallo ? 'No se pudo restaurar' : listo ? 'Restaurada' : 'Restaurando tu foto'}</h1>
        <p className="mt-2 text-[15px] text-gris">{fallo ? trabajo?.error : `${t.titulo}, con ${t.modelo}`}</p>
      </header>

      <div className="flex min-h-[240px] flex-1 items-center justify-center">
        <div className="relative aspect-[3/2] w-full max-h-full max-w-full overflow-hidden rounded-lg bg-black lg:h-full lg:w-auto">
          {salida && (
            <img
              src={salida}
              alt={listo ? 'Imagen restaurada' : `Imagen a mitad de la difusión, paso ${paso} de ${total}`}
              className="absolute inset-0 size-full scale-[1.06] object-cover"
              style={real && (salidaReal || fotogramasReales.length) ? undefined : { filter: `blur(${(1 - avance) * 22}px) saturate(${0.3 + avance * 0.7}) brightness(${0.75 + 0.25 * avance})` }}
            />
          )}
          <svg aria-hidden="true" className="absolute inset-0 size-full mix-blend-overlay" style={{ opacity: Math.pow(1 - avance, 0.8) * 0.9 }}>
            <filter id="grano">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" seed={paso} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grano)" />
          </svg>
        </div>
      </div>

      <TiraFotogramas fotogramas={fotogramas.map((f) => ({ ...f, visto: real ? Boolean(f.imagen) : paso >= f.paso }))} total={total} />
    </div>
  )

  const panel = (
    <div className="flex flex-col gap-7 p-5">
      <Seccion titulo="Qué está haciendo el modelo">
        <FasesModelo fases={FASES} actual={faseActual} />
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
        Con otra semilla el detalle inventado cambia. En la próxima pantalla vas a poder comparar las que se generaron.
      </p>
    </div>
  )

  const barra = (
    <>
      <Actual
        imagen={real ? historial.find((h) => h.id === trabajo?.id)?.miniatura : t.entrada}
        titulo={real ? (historial.find((h) => h.id === trabajo?.id)?.archivo ?? 'Sin restauración en curso') : t.archivo}
        subtitulo={textoBarra}
      />
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1.5 justify-self-center">
        <div className="flex items-center gap-2">
          <BotonIcono etiqueta="Repetir" onClick={repetir} disabled={enviando || enCurso}>
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
          <span className="w-14 text-right">Paso {real && !enPrincipal ? (trabajo?.paso ?? 0) : paso}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={paso} aria-label="Pasos de difusión">
            <div className="fondo-ia h-full rounded-full transition-[width] duration-100" style={{ width: `${avanceBarra * 100}%` }} />
          </div>
          <span className="w-14">{total}</span>
        </div>
      </div>
      <p className="hidden text-right text-[13px] text-gris sm:block">
        {fallo ? 'Error' : listo ? 'Listo' : trabajo?.estado === 'verificando' ? 'Verificando…' : trabajo?.estado === 'en_cola' ? 'En cola' : `Faltan ${fmt(restante.toFixed(1))} s`}
      </p>
    </>
  )

  return <Diseno principal={principal} panel={panel} barra={barra} etiquetaPanel="Qué está haciendo el modelo" />
}
