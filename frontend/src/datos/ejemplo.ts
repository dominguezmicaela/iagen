/**
 * DATOS DE EJEMPLO
 * ----------------
 * Todo lo que el mockup muestra sale de este archivo. Nada de esto lo generó
 * un modelo real: las "salidas" son la foto original escalada y los puntajes
 * de CLIP / DETR / BLIP son ilustrativos.
 *
 * Lo único calculado de verdad son los mapas (diferencias y variación) y sus
 * porcentajes por umbral, obtenidos con numpy sobre estas mismas imágenes.
 *
 * Cuando conectes el backend, reemplazá estas constantes por respuestas de tu
 * API (fetch) respetando los mismos tipos y la interfaz no cambia.
 */

import difA from '../assets/ejemplo/dif_A.jpg'
import difB from '../assets/ejemplo/dif_B.jpg'
import difC from '../assets/ejemplo/dif_C.jpg'
import entradaA from '../assets/ejemplo/entrada_A.jpg'
import entradaB from '../assets/ejemplo/entrada_B.jpg'
import entradaC from '../assets/ejemplo/entrada_C.jpg'
import paso05 from '../assets/ejemplo/paso_05.jpg'
import paso15 from '../assets/ejemplo/paso_15.jpg'
import paso25 from '../assets/ejemplo/paso_25.jpg'
import paso35 from '../assets/ejemplo/paso_35.jpg'
import paso45 from '../assets/ejemplo/paso_45.jpg'
import s19 from '../assets/ejemplo/salida_s19.jpg'
import s33 from '../assets/ejemplo/salida_s33.jpg'
import s42 from '../assets/ejemplo/salida_s42.jpg'
import s7 from '../assets/ejemplo/salida_s7.jpg'
import variacion from '../assets/ejemplo/variacion.jpg'

/** Con `?demo=1` en la URL la app usa estos datos y no necesita el backend. */
export const ES_EJEMPLO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')

export type SubTareaId = 'A' | 'B' | 'C'

export interface Parametro {
  clave: string
  etiqueta: string
  valor: number
  min: number
  max: number
  paso: number
}

export interface SubTarea {
  id: SubTareaId
  /** Nombre para la persona usuaria. */
  titulo: string
  /** Nombre técnico de la sub-tarea. */
  tecnico: string
  bajada: string
  inventa: string
  modelo: string
  archivo: string
  medidas: string
  entrada: string
  diferencias: string
  aviso: string
  parametros: Parametro[]
  prompt: string
  real: string[]
  inventado: string[]
}

export const SUB_TAREAS: Record<SubTareaId, SubTarea> = {
  A: {
    id: 'A',
    titulo: 'Poca resolución',
    tecnico: 'Super-resolución ×4',
    bajada: 'Agranda una imagen chica sin que se pixele.',
    inventa: 'textura fina, bordes y reflejos',
    modelo: 'stabilityai/stable-diffusion-x4-upscaler',
    archivo: 'gato_baja_res.png',
    medidas: '225 × 150 px',
    entrada: entradaA,
    diferencias: difA,
    aviso: 'El pelaje, los bigotes y los bordes nítidos no estaban en la entrada de 225 × 150 px. Los sintetizó el modelo al escalar ×4.',
    parametros: [
      { clave: 'noise_level', etiqueta: 'Nivel de ruido', valor: 20, min: 0, max: 350, paso: 5 },
      { clave: 'steps', etiqueta: 'Pasos', valor: 50, min: 10, max: 100, paso: 5 },
      { clave: 'guidance', etiqueta: 'Guidance', valor: 7.5, min: 0, max: 15, paso: 0.5 },
    ],
    prompt: 'a high quality photo',
    real: ['Composición y encuadre', 'Formas y contornos grandes', 'Colores dominantes'],
    inventado: ['Textura fina', 'Bordes nítidos y detalles chicos', 'Letras, números y patrones pequeños'],
  },
  B: {
    id: 'B',
    titulo: 'Ruido o movida',
    tecnico: 'Denoising y deblurring',
    bajada: 'Limpia el grano y el desenfoque.',
    inventa: 'bordes que el desenfoque borró',
    modelo: 'stable-diffusion-v1-5 (img2img)',
    archivo: 'gato_movida_ruido.jpg',
    medidas: '900 × 600 px',
    entrada: entradaB,
    diferencias: difB,
    aviso: 'El detalle que el desenfoque había borrado no se recuperó: lo estimó el modelo. Las zonas nítidas son una reconstrucción.',
    parametros: [
      { clave: 'strength', etiqueta: 'Fuerza', valor: 0.3, min: 0.05, max: 1, paso: 0.05 },
      { clave: 'steps', etiqueta: 'Pasos', valor: 30, min: 10, max: 100, paso: 5 },
      { clave: 'guidance', etiqueta: 'Guidance', valor: 5, min: 0, max: 15, paso: 0.5 },
    ],
    prompt: 'a sharp, detailed photo',
    real: ['Composición y encuadre', 'Pose y forma del gato', 'Luz general'],
    inventado: ['Bordes nítidos', 'Pelaje y bigotes', 'Detalle del fondo'],
  },
  C: {
    id: 'C',
    titulo: 'Foto antigua',
    tecnico: 'Restauración y colorización',
    bajada: 'Repara rayas y manchas, y le pone color.',
    inventa: 'todo el color y lo que tapaban las rayas',
    modelo: 'stable-diffusion-v1-5 + ControlNet tile',
    archivo: 'foto_antigua_gato.jpg',
    medidas: '900 × 600 px, sepia',
    entrada: entradaC,
    diferencias: difC,
    aviso: 'Todo el color es inferido: la entrada era monocromática. El color de ojos y pelaje es una suposición, y las rayas se rellenaron con contenido generado.',
    parametros: [
      { clave: 'strength', etiqueta: 'Fuerza', valor: 0.45, min: 0.05, max: 1, paso: 0.05 },
      { clave: 'steps', etiqueta: 'Pasos', valor: 40, min: 10, max: 100, paso: 5 },
      { clave: 'guidance', etiqueta: 'Guidance', valor: 6, min: 0, max: 15, paso: 0.5 },
    ],
    prompt: 'a restored color photograph',
    real: ['Composición y encuadre', 'Pose y forma del gato', 'Luces y sombras'],
    inventado: ['Todos los colores', 'Zonas bajo las rayas', 'Textura del pelaje'],
  },
}

export interface Semilla {
  valor: number
  imagen: string
}

export const SEMILLAS: Semilla[] = [
  { valor: 42, imagen: s42 },
  { valor: 7, imagen: s7 },
  { valor: 19, imagen: s19 },
  { valor: 33, imagen: s33 },
]

export const REVELADO = {
  fotogramas: [
    { paso: 5, imagen: paso05 },
    { paso: 15, imagen: paso15 },
    { paso: 25, imagen: paso25 },
    { paso: 35, imagen: paso35 },
    { paso: 45, imagen: paso45 },
  ],
}

export type Estado = 'ok' | 'alerta'

export interface Verificacion {
  clip: { etiqueta: string; entrada: number; salida: number }[]
  clipResumen: string
  detr: { objeto: string; entrada: number; salida: number }[]
  detrResumen: string
  descripcionEntrada: string
  /** Fragmentos de la descripción de salida; `nuevo` = no aparece en la de entrada. */
  descripcionSalida: { texto: string; nuevo?: boolean }[]
  descripcionResumen: string
}

const salidaComun = [
  { texto: 'a close up of a ' },
  { texto: 'tabby', nuevo: true },
  { texto: ' cat with ' },
  { texto: 'green eyes', nuevo: true },
]

export const VERIFICACION: Record<SubTareaId, Verificacion> = {
  A: {
    clip: [
      { etiqueta: 'a photo of a cat', entrada: 0.71, salida: 0.86 },
      { etiqueta: 'a low resolution photo', entrada: 0.19, salida: 0.04 },
      { etiqueta: 'a drawing', entrada: 0.05, salida: 0.07 },
    ],
    clipResumen: 'El contenido se mantiene: sigue siendo un gato.',
    detr: [{ objeto: 'cat', entrada: 0.91, salida: 0.98 }],
    detrResumen: 'Mismos objetos, más confianza.',
    descripcionEntrada: 'a blurry picture of a cat',
    descripcionSalida: salidaComun,
    descripcionResumen: '2 atributos nuevos. Verificá si se ven en la entrada.',
  },
  B: {
    clip: [
      { etiqueta: 'a photo of a cat', entrada: 0.64, salida: 0.87 },
      { etiqueta: 'a blurry, noisy photo', entrada: 0.24, salida: 0.03 },
      { etiqueta: 'a drawing', entrada: 0.06, salida: 0.07 },
    ],
    clipResumen: 'El contenido se mantiene: sigue siendo un gato.',
    detr: [{ objeto: 'cat', entrada: 0.84, salida: 0.98 }],
    detrResumen: 'Mismos objetos, más confianza.',
    descripcionEntrada: 'a blurry photo of a cat',
    descripcionSalida: salidaComun,
    descripcionResumen: '2 atributos nuevos. Verificá si se ven en la entrada.',
  },
  C: {
    clip: [
      { etiqueta: 'a photo of a cat', entrada: 0.58, salida: 0.88 },
      { etiqueta: 'an old black and white photo', entrada: 0.31, salida: 0.03 },
      { etiqueta: 'a drawing', entrada: 0.06, salida: 0.06 },
    ],
    clipResumen: 'El contenido se mantiene: sigue siendo un gato.',
    detr: [{ objeto: 'cat', entrada: 0.79, salida: 0.97 }],
    detrResumen: 'Mismos objetos, más confianza.',
    descripcionEntrada: 'an old photo of a cat',
    descripcionSalida: salidaComun,
    descripcionResumen: '«green eyes» es inventado: la entrada no tenía color.',
  },
}

/** Mapas en escala de grises (0 = sin cambio, blanco = cambio alto). */
export const MAPAS = {
  variacion,
}

/**
 * % de píxeles por encima de cada umbral (5 %, 10 %, … 95 %).
 * Calculado con numpy sobre los mapas de arriba.
 */
export const PORCENTAJES: Record<SubTareaId | 'variacion', number[]> = {
  A: [83.3, 58.2, 47.5, 40.1, 32.9, 26.2, 20.6, 16.2, 12.4, 9.4, 7.2, 5.5, 4.2, 3.1, 2.3, 1.7, 1.3, 0.9, 0.7],
  B: [100, 100, 98.6, 81.9, 56.7, 41.4, 30.9, 23.7, 17.8, 13.3, 9.8, 7.3, 5.3, 3.8, 2.7, 2, 1.4, 1, 0.7],
  C: [99.8, 96.7, 81.4, 66, 52.3, 40.1, 30.2, 23.6, 19.1, 15.8, 13.2, 10.9, 9, 7.3, 5.4, 3.8, 2.7, 1.9, 1.1],
  variacion: [75.7, 58.4, 47.8, 40.1, 33.2, 26.9, 21.6, 17.2, 13.8, 11, 8.7, 6.8, 5.2, 3.9, 2.9, 2.1, 1.5, 1.1, 0.7],
}

/** Cambio medio por píxel (%), sin normalizar. */
export const CAMBIO_MEDIO: Record<SubTareaId, number> = { A: 1.2, B: 2.3, C: 12.1 }

/** Zonas marcadas sobre la imagen (x, y en % del ancho / alto). */
export const MARCAS = [
  { x: 46.1, y: 11.3, titulo: 'Rayas de la frente', detalle: 'Textura del pelaje generada: cambia con cada semilla.' },
  { x: 37.7, y: 39.0, titulo: 'Ojo izquierdo', detalle: 'Reflejo y borde del iris reconstruidos.' },
  { x: 39.2, y: 61.5, titulo: 'Mejilla', detalle: 'Pelo fino que no existía en la entrada.' },
  { x: 30.0, y: 84.7, titulo: 'Bigotes', detalle: 'Trazos individuales inventados.' },
]

export const EJECUCION = {
  dispositivo: 'GPU con CUDA',
  segundosPorPaso: 0.13,
}
