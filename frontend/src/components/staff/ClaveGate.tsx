import { useState, type FormEvent } from 'react'
import { staffApi, guardarClave } from '../../lib/staffApi'

interface Props {
  onEntrar: (clave: string) => void
}

export default function ClaveGate({ onEntrar }: Props) {
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setVerificando(true)
    try {
      await staffApi.verificar(clave)
      guardarClave(clave)
      onEntrar(clave)
    } catch {
      setError('Clave incorrecta.')
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="shell">
      <header className="hero">
        <p className="eyebrow">Panel interno</p>
        <h1 className="hero-title">Staff</h1>
        <p className="hero-lede">Escribe la clave del equipo para revisar evidencias.</p>
      </header>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="clave">Clave del staff</label>
          <input
            id="clave"
            type="password"
            autoComplete="off"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
          {error && <p className="err">{error}</p>}
        </div>
        <button className="btn btn-primary" type="submit" disabled={verificando || !clave}>
          {verificando ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
