import { afterEach, describe, expect, it, vi } from 'vitest'
import { obtenerTrabajo, restaurar } from '../api'

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('devuelve el id del trabajo creado', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'abc' })))
    vi.stubGlobal('fetch', fetch)
    await expect(restaurar(new Blob(['x']), 'x.png', { steps: 30 })).resolves.toBe('abc')
    const cuerpo = fetch.mock.calls[0][1].body as FormData
    expect(cuerpo.get('parametros')).toBe('{"steps":30}')
  })

  it('muestra el mensaje en español que manda el backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'La imagen pesa más de 10 MB.' }), { status: 413 })))
    await expect(restaurar(new Blob(['x']), 'x.png', {})).rejects.toThrow('La imagen pesa más de 10 MB.')
  })

  it('avisa si el servidor no está corriendo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(obtenerTrabajo('abc')).rejects.toThrow('No hay conexión con el servidor')
  })
})
