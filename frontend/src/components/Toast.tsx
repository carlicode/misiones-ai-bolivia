import { useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

interface Props {
  tipo: 'ok' | 'error'
  mensaje: string
  onCerrar: () => void
}

export default function Toast({ tipo, mensaje, onCerrar }: Props) {
  useEffect(() => {
    const id = setTimeout(onCerrar, 4200)
    return () => clearTimeout(id)
  }, [onCerrar])

  return (
    <div className={`toast ${tipo}`} role="status">
      <span className="toast-ico" aria-hidden="true">
        {tipo === 'ok' ? <Check size={16} strokeWidth={2.4} /> : <AlertCircle size={16} strokeWidth={2.2} />}
      </span>
      <span>{mensaje}</span>
    </div>
  )
}
