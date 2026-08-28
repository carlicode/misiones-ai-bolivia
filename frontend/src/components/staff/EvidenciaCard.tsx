import { useState } from 'react'
import type { EvidenciaPendiente } from '../../lib/staffApi'
import { MISSIONS } from '../../lib/missions'

interface Props {
  evidencia: EvidenciaPendiente
  onRevisar: (estado: 'aprobada' | 'rechazada', motivo?: string) => void
  ocupado: boolean
}

/** Motivos frecuentes: un toque en vez de escribir, para no frenar la cola. */
const MOTIVOS = [
  'No se ve la etiqueta a @aws_ai_ug_bolivia',
  'La foto no corresponde a la misión',
  'No se ve tu mensaje en el grupo',
  'La foto está borrosa o incompleta',
]

export default function EvidenciaCard({ evidencia, onRevisar, ocupado }: Props) {
  const [rechazando, setRechazando] = useState(false)
  const [motivoLibre, setMotivoLibre] = useState('')

  const mision = MISSIONS.find((m) => m.id === evidencia.missionId)
  const hora = new Date(evidencia.enviadoEn).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <article className="evidencia">
      <header className="ev-head">
        <div className="ev-quien">
          <p className="ev-nombre">{evidencia.nombre}</p>
          <p className="ev-meta">
            {mision?.emoji} {mision?.title} · {hora}
          </p>
        </div>
        <span className={`pill ${mision?.required ? 'pill-obligatoria' : 'pill-bonus'}`}>
          {mision?.required ? 'Obligatoria' : 'Bonus'}
        </span>
      </header>

      <img className="ev-foto" src={evidencia.fotoUrl} alt={`Evidencia de ${evidencia.nombre}`} loading="lazy" />

      {Object.keys(evidencia.data).length > 0 && (
        <dl className="ev-datos">
          {Object.entries(evidencia.data).map(([clave, valor]) => (
            <div key={clave}>
              <dt>{clave}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {!rechazando ? (
        <div className="ev-acciones">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setRechazando(true)}
            disabled={ocupado}
          >
            Rechazar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onRevisar('aprobada')}
            disabled={ocupado}
          >
            Aprobar
          </button>
        </div>
      ) : (
        <div className="ev-rechazo">
          <p className="ev-rechazo-titulo">¿Por qué la rechazas?</p>
          <div className="ev-motivos">
            {MOTIVOS.map((m) => (
              <button key={m} className="motivo-chip" onClick={() => onRevisar('rechazada', m)} disabled={ocupado}>
                {m}
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Otro motivo…"
              value={motivoLibre}
              onChange={(e) => setMotivoLibre(e.target.value)}
            />
          </div>
          <div className="ev-acciones">
            <button className="btn btn-ghost btn-sm" onClick={() => setRechazando(false)} disabled={ocupado}>
              Volver
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onRevisar('rechazada', motivoLibre)}
              disabled={ocupado || !motivoLibre.trim()}
            >
              Rechazar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
