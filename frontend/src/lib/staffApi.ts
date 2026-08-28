import type { MissionId } from './missions'

const BASE = import.meta.env.VITE_API_URL ?? ''

export interface EvidenciaPendiente {
  participanteId: string
  missionId: MissionId
  nombre: string
  celular: string
  data: Record<string, string>
  enviadoEn: string
  fotoUrl: string
}

export interface Totales {
  participantes: number
  pendientes: number
  elegibles: number
  entradas: number
}

export interface Elegible {
  id: string
  nombre: string
  celular: string
  entradas: number
  bonusAprobados: number
}

export interface ResultadoBusqueda {
  id: string
  nombre: string
  celular: string
  elegible: boolean
  entradas: number
  obligatoriasAprobadas: number
  misiones: { missionId: MissionId; estado: string; enviadoEn: string }[]
}

async function pedir<T>(ruta: string, clave: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/staff${ruta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Staff-Key': clave,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}))
    throw new Error((cuerpo as { error?: string }).error ?? 'No se pudo conectar')
  }
  return res.json() as Promise<T>
}

export interface Ganador {
  id: string
  nombre: string
  celular: string
  entradas: number
}

export interface Sorteo {
  ganadores: Ganador[]
  semilla: string
  sorteadoEn: string
  totalElegibles: number
  totalEntradas: number
}

export const staffApi = {
  verificar: (clave: string) => pedir<{ ok: true }>('/verificar', clave),

  cola: (clave: string) =>
    pedir<{ pendientes: EvidenciaPendiente[]; totales: Totales }>('/cola', clave),

  revisar: (
    clave: string,
    participanteId: string,
    missionId: MissionId,
    estado: 'aprobada' | 'rechazada',
    motivo?: string
  ) =>
    pedir<{ ok: true; totales: Totales }>('/revisar', clave, {
      method: 'POST',
      body: JSON.stringify({ participanteId, missionId, estado, motivo }),
    }),

  elegibles: (clave: string) => pedir<{ elegibles: Elegible[] }>('/elegibles', clave),

  buscar: (clave: string, q: string) =>
    pedir<{ resultados: ResultadoBusqueda[] }>(`/buscar?q=${encodeURIComponent(q)}`, clave),

  ultimoSorteo: (clave: string) => pedir<Sorteo | null>('/sorteo', clave),

  sortear: (clave: string, cantidad = 10) =>
    pedir<Sorteo>('/sorteo', clave, {
      method: 'POST',
      body: JSON.stringify({ cantidad }),
    }),
}

/* La clave vive solo en esta pestaña: cerrarla obliga a volver a escribirla. */
const CLAVE_SESION = 'ugai_staff_key'

export function guardarClave(clave: string) {
  try { sessionStorage.setItem(CLAVE_SESION, clave) } catch { /* modo privado */ }
}

export function leerClave(): string | null {
  try { return sessionStorage.getItem(CLAVE_SESION) } catch { return null }
}

export function borrarClave() {
  try { sessionStorage.removeItem(CLAVE_SESION) } catch { /* modo privado */ }
}
