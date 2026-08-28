const CLAVE = 'ugai_participante_id'

export function guardarId(id: string) {
  try { localStorage.setItem(CLAVE, id) } catch { /* modo privado */ }
}

export function leerId(): string | null {
  try { return localStorage.getItem(CLAVE) } catch { return null }
}

export function borrarId() {
  try { localStorage.removeItem(CLAVE) } catch { /* modo privado */ }
}
