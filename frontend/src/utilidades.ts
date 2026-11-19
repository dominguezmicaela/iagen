// Funciones chicas que usan varios componentes.

/** Une clases de CSS, salteando las vacías o condicionales en falso. */
export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** Indica si el foco está en un campo de texto (para no robarle teclas). */
export function escribiendo(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'TEXTAREA' || (tag === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes((t as HTMLInputElement).type)) || t.isContentEditable
}
