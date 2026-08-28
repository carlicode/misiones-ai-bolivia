import type { MissionId } from './missions'

const BASE = import.meta.env.VITE_API_URL ?? ''

export type EstadoMision = 'pendiente' | 'aprobada' | 'rechazada'

export interface MisionEnviada {
  missionId: MissionId
  estado: EstadoMision
  fotoKey: string
  data: Record<string, string>
  enviadoEn: string
  motivoRechazo?: string | null
}

export interface Participante {
  id: string
  nombre: string
  celular: string
  misiones: MisionEnviada[]
  elegible: boolean
  entradas: number
  bonusAprobados: number
  obligatoriasAprobadas: number
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}))
    throw new Error((cuerpo as { error?: string }).error ?? 'No se pudo conectar')
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => pedir<{ ok: boolean; stage: string }>('/health'),

  registrar: (nombre: string, celular: string) =>
    pedir<Participante>('/api/participantes', {
      method: 'POST',
      body: JSON.stringify({ nombre, celular }),
    }),

  obtener: (id: string) => pedir<Participante>(`/api/participantes/${id}`),

  stats: () => pedir<{ participantes: number; elegibles: number }>('/api/stats'),

  /** Pide la URL prefirmada y sube la foto directo a S3. */
  async subirFoto(participanteId: string, missionId: MissionId, archivo: File) {
    const { uploadUrl, key } = await pedir<{ uploadUrl: string; key: string }>(
      '/api/uploads/presign',
      {
        method: 'POST',
        body: JSON.stringify({ participanteId, missionId, contentType: archivo.type }),
      }
    )
    const subida = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': archivo.type },
      body: archivo,
    })
    if (!subida.ok) throw new Error('No se pudo subir la foto. Revisa tu conexión.')
    return key
  },

  enviarMision: (
    participanteId: string,
    missionId: MissionId,
    fotoKey: string,
    data: Record<string, string>
  ) =>
    pedir<Participante>('/api/misiones', {
      method: 'POST',
      body: JSON.stringify({ participanteId, missionId, fotoKey, data }),
    }),
}
