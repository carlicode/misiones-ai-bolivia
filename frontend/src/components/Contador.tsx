import { useEffect, useState } from 'react'

interface Props {
  /** ISO del cierre, o null si todavía no se configuró la fecha del evento. */
  cierre: string | null
}

function partes(msRestantes: number) {
  const total = Math.max(0, Math.floor(msRestantes / 1000))
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

/**
 * Cuenta regresiva al cierre de participación.
 *
 * Si no hay fecha configurada no muestra nada: es mejor un header vacío que
 * un contador inventado que le miente a la gente sobre cuánto tiempo le queda.
 */
export default function Contador({ cierre }: Props) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (!cierre) return
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cierre])

  if (!cierre) return null

  const restante = new Date(cierre).getTime() - ahora
  if (restante <= 0) return <span className="clock cerrado">Cerrado</span>

  const { h, m, s } = partes(restante)
  const texto = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  // Menos de una hora: el color empuja a apurarse.
  return <span className={`clock${h === 0 ? ' urgente' : ''}`}>{texto}</span>
}
