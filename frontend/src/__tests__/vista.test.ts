import { describe, expect, it } from 'vitest'
import type { Resultado } from '../api'
import { datosDemo, datosReales, pasosFotograma } from '../datos/vista'

const resultado = {
  medidas_entrada: '128 × 96 px',
  medidas_salida: '512 × 384 px',
  semillas: [{ valor: 42, imagen: '/api/trabajos/abc/imagen/salida-42.png' }],
  imagenes: { entrada: '/e.png', diferencias: '/d.png', variacion: null },
  fotogramas: [],
  porcentajes: { diferencia: Array(19).fill(1), variacion: null },
  zonas: [{ x: 10, y: 20, titulo: 'Zona 1', detalle: 'Arriba, a la izquierda' }],
  verificacion: { clipOk: true, descripcionOk: false, detrOk: null },
} as unknown as Resultado

describe('pasosFotograma', () => {
  it('captura los mismos pasos que el backend', () => {
    expect(pasosFotograma(50)).toEqual([5, 15, 25, 35, 45])
    expect(pasosFotograma(10)).toEqual([1, 3, 5, 7, 9])
  })
})

describe('datosReales', () => {
  it('arma el aviso con las medidas reales y la descarga del trabajo', () => {
    const d = datosReales('abc', resultado, 'cartel.png')
    expect(d.aviso).toContain('128 × 96 px')
    expect(d.aviso).toContain('512 × 384 px')
    expect(d.descarga).toEqual({ trabajo: 'abc' })
    expect(d.variacion).toBeNull()
    expect(d.archivo).toBe('cartel.png')
  })
})

describe('datosDemo', () => {
  it('trae los mapas y porcentajes de ejemplo sin descarga real', () => {
    const d = datosDemo('A')
    expect(d.porcentajes.diferencia).toHaveLength(19)
    expect(d.semillas).toHaveLength(4)
    expect(d.descarga).toBeNull()
  })
})
