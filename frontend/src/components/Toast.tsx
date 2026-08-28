import { useEffect } from 'react'

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
      <span aria-hidden="true">{tipo === 'ok' ? '✓' : '!'}</span>
      <span>{mensaje}</span>
    </div>
  )
}
