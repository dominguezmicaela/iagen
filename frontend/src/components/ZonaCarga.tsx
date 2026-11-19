import { ImagePlus, X } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { SEMILLAS, SUB_TAREAS } from '../datos/ejemplo'
import { cx } from '../utilidades'
import { LamparaUV } from './LamparaUV'
import { Capsula } from './ui'

/**
 * Recuadro para soltar o elegir la foto. Sin foto, muestra la lámpara UV de muestra;
 * con foto, la muestra con su nombre y un botón para quitarla.
 */
export function ZonaCarga({
  vista,
  onArchivo,
  onQuitar,
}: {
  vista: { src: string; nombre: string } | null
  onArchivo: (f?: File) => void
  onQuitar: () => void
}) {
  const [encima, setEncima] = useState(false)
  const alSoltar = (e: DragEvent) => {
    e.preventDefault()
    setEncima(false)
    onArchivo(e.dataTransfer.files[0])
  }

  return (
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
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => onArchivo(e.target.files?.[0])} />
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
            onClick={onQuitar}
            className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            aria-label="Quitar imagen"
          >
            <X size={18} />
          </button>
        </>
      )}
    </div>
  )
}
