import { useEffect, useState } from 'react'
import { DEADLINE } from '../lib/missions'

function partes(msRestantes: number) {
  const total = Math.max(0, Math.floor(msRestantes / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { h, m, s }
}

/** Cuenta regresiva compacta hacia el cierre de participación, fija en el header. */
export default function Contador() {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const restante = DEADLINE.getTime() - ahora
  const cerrado = restante <= 0

  if (cerrado) {
    return <span className="clock cerrado">Cerrado</span>
  }

  const { h, m, s } = partes(restante)
  const texto = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return <span className="clock">{texto}</span>
}
