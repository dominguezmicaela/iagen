import { ImagePlus, Wand } from 'lucide-react'
import { useEstado } from '../estado'
import { Actual, Diseno, Enlace } from './ui'

// Lo que ven Revisar y Lámpara UV cuando todavía no hay una restauración terminada.

export function SinResultado() {
  const { trabajo } = useEstado()
  const enCurso = trabajo !== null && trabajo.estado !== 'listo' && trabajo.estado !== 'error'

  const principal = (
    <div className="flex min-h-full flex-col items-start justify-center gap-4 p-6">
      <h1 className="titular text-[clamp(30px,3vw,44px)]">{enCurso ? 'Todavía se está restaurando' : 'Todavía no hay nada para revisar'}</h1>
      <p className="max-w-[40rem] text-[15px] text-gris">
        {enCurso ? 'Cuando termine la difusión y el chequeo, el resultado aparece acá.' : 'Subí una imagen y restaurala para ver qué inventó el modelo.'}
      </p>
      <Enlace href={enCurso ? '#/restaurar' : '#/subir'} variante="marca" className="min-h-12 px-8">
        {enCurso ? <Wand size={18} /> : <ImagePlus size={18} />}
        {enCurso ? 'Ver el progreso' : 'Elegir una imagen'}
      </Enlace>
    </div>
  )

  return <Diseno principal={principal} panel={null} barra={<Actual titulo="Sin resultado" subtitulo={enCurso ? trabajo?.etapa : 'Elegí una imagen para empezar'} />} etiquetaPanel="Sin resultado" />
}
