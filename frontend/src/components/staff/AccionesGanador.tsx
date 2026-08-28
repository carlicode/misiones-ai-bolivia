import { useState } from 'react'
import { Gift, MessageCircle, Undo2 } from 'lucide-react'
import { staffApi } from '../../lib/staffApi'
import { enlaceWhatsApp, mensajeGanador } from '../../lib/whatsapp'
import { ANUNCIO } from '../../lib/missions'

interface Props {
  clave: string
  participanteId: string
  nombre: string
  celular: string
  ganadorSorpresa: boolean
  onCambio: () => void
}

const MOTIVOS = [
  'Primero en completar las 3 misiones',
  'Primera foto con un speaker',
  'Primero en completar un taller',
]

/**
 * Premio sorpresa: declarar ganador a alguien en el momento y avisarle
 * por WhatsApp. El aviso abre el chat con el mensaje escrito; enviarlo
 * queda en manos del staff.
 */
export default function AccionesGanador({
  clave, participanteId, nombre, celular, ganadorSorpresa, onCambio,
}: Props) {
  const [eligiendo, setEligiendo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function marcar(motivo: string | null, marcarlo: boolean) {
    setOcupado(true)
    setError(null)
    try {
      await staffApi.sorpresa(clave, participanteId, motivo, marcarlo)
      setEligiendo(false)
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setOcupado(false)
    }
  }

  if (ganadorSorpresa) {
    return (
      <div className="ganador-acciones">
        <span className="tag-sorpresa">
          <Gift size={13} strokeWidth={2} />
          Premio sorpresa entregado
        </span>
        <a
          className="btn btn-wa btn-sm"
          href={enlaceWhatsApp(celular, mensajeGanador(nombre, ANUNCIO))}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={15} strokeWidth={2} />
          Avisarle por WhatsApp
        </a>
        <button
          className="btn btn-text quitar-sorpresa"
          onClick={() => marcar(null, false)}
          disabled={ocupado}
        >
          <Undo2 size={13} strokeWidth={2} />
          Deshacer
        </button>
        {error && <p className="err">{error}</p>}
      </div>
    )
  }

  if (!eligiendo) {
    return (
      <button
        className="btn btn-ghost btn-sm ganador-abrir"
        onClick={() => setEligiendo(true)}
      >
        <Gift size={15} strokeWidth={2} />
        Darle premio sorpresa
      </button>
    )
  }

  return (
    <div className="ganador-acciones">
      <p className="ganador-nota">
        Le entregas uno de los 10 premios ahora. Sale de la tómbola y queda un
        premio menos por sortear.
      </p>
      <div className="ev-motivos">
        {MOTIVOS.map((m) => (
          <button key={m} className="motivo-chip" onClick={() => marcar(m, true)} disabled={ocupado}>
            {m}
          </button>
        ))}
      </div>
      <button className="btn btn-text" onClick={() => setEligiendo(false)} disabled={ocupado}>
        Cancelar
      </button>
      {error && <p className="err">{error}</p>}
    </div>
  )
}
