import { ChevronRight } from 'lucide-react'
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
  const Icono = mision.icon

  return (
    <button
      type="button"
      className={`mision${envio ? ` ${envio.estado}` : ''}`}
      onClick={onClick}
    >
      <span className="ico" aria-hidden="true"><Icono size={19} strokeWidth={1.9} /></span>
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
      <ChevronRight className="chev" size={16} aria-hidden="true" />
    </button>
  )
}
