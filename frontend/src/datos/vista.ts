import type { Fotograma, Resultado, Zona } from '../api'
import { MAPAS, MARCAS, PORCENTAJES, REVELADO, SEMILLAS, SUB_TAREAS, VERIFICACION, type Semilla, type SubTareaId, type Verificacion } from './ejemplo'

// Lo que muestran las pantallas, armado igual desde los datos de ejemplo o desde un resultado real.

export interface Datos {
  entrada: string
  archivo: string
  aviso: string
  semillas: Semilla[]
  fotogramas: Fotograma[]
  diferencias: string
  variacion: string | null
  porcentajes: { diferencia: number[]; variacion: number[] | null }
  zonas: Zona[]
  verificacion: Verificacion & { clipOk: boolean; descripcionOk: boolean; detrOk: boolean | null }
  descarga: { trabajo: string } | null
}

export function pasosFotograma(total: number): number[] {
  return [...new Set([0.1, 0.3, 0.5, 0.7, 0.9].map((f) => Math.max(1, Math.round(total * f))))]
}

export function datosDemo(subTarea: SubTareaId): Datos {
  const t = SUB_TAREAS[subTarea]
  return {
    entrada: t.entrada,
    archivo: t.archivo,
    aviso: t.aviso,
    semillas: SEMILLAS,
    fotogramas: REVELADO.fotogramas,
    diferencias: t.diferencias,
    variacion: MAPAS.variacion,
    porcentajes: { diferencia: PORCENTAJES[subTarea], variacion: PORCENTAJES.variacion },
    zonas: MARCAS,
    verificacion: { ...VERIFICACION[subTarea], clipOk: true, descripcionOk: false, detrOk: true },
    descarga: null,
  }
}

export function datosReales(id: string, r: Resultado, archivo: string): Datos {
  return {
    entrada: r.imagenes.entrada,
    archivo,
    aviso: `La textura fina, los bordes nítidos y los detalles chicos no estaban en la entrada de ${r.medidas_entrada}. Los sintetizó el modelo al escalar ×4 a ${r.medidas_salida}.`,
    semillas: r.semillas,
    fotogramas: r.fotogramas,
    diferencias: r.imagenes.diferencias,
    variacion: r.imagenes.variacion,
    porcentajes: r.porcentajes,
    zonas: r.zonas,
    verificacion: r.verificacion,
    descarga: { trabajo: id },
  }
}
