import type { Mission } from '../lib/missions'
import type { MisionEnviada } from '../lib/api'

interface Props {
  mision: Mission
  envio?: MisionEnviada
  onClick: () => void
}

const ETIQUETAS: Record<string, string> = {
  pendiente: 'En revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazar de nuevo',
}

export default function MisionCard({ mision, envio, onClick }: Props) {
  return (
    <button
      type="button"
      className={`mision${envio ? ` ${envio.estado}` : ''}`}
      onClick={onClick}
    >
      <span className="emoji" aria-hidden="true">{mision.emoji}</span>
      <span className="cuerpo">
        <span className="titulo">
          {mision.title}
          {!envio && (
            <span className={`pill ${mision.required ? 'pill-obligatoria' : 'pill-bonus'}`}>
              {mision.required ? 'Obligatoria' : 'Bonus'}
            </span>
          )}
          {envio && (
            <span className={`pill pill-${envio.estado}`}>{ETIQUETAS[envio.estado]}</span>
          )}
        </span>
        {envio?.estado === 'rechazada' ? (
          <span className="desc" style={{ color: 'var(--danger)' }}>
            {envio.motivoRechazo || 'Vuelve a intentarlo con otra evidencia.'}
          </span>
        ) : (
          <span className="desc">{mision.desc}</span>
        )}
      </span>
      <span className="chev" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}
