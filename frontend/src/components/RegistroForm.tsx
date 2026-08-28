import { useState, type FormEvent } from 'react'
import { api, type Participante } from '../lib/api'

interface Props {
  onRegistrado: (p: Participante) => void
}

export default function RegistroForm({ onRegistrado }: Props) {
  const [nombre, setNombre] = useState('')
  const [celular, setCelular] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (nombre.trim().split(/\s+/).length < 2) {
      setError('Escribe tu nombre y apellido completos.')
      return
    }
    if (celular.replace(/\D/g, '').length < 8) {
      setError('Escribe un celular válido, con al menos 8 dígitos.')
      return
    }

    setEnviando(true)
    try {
      const participante = await api.registrar(nombre, celular)
      onRegistrado(participante)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="nombre">Nombre completo</label>
        <input
          id="nombre"
          type="text"
          autoComplete="name"
          placeholder="Ej. María Fernández Rojas"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="celular">Celular</label>
        <input
          id="celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ej. 70123456"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
        />
        <p className="hint">Lo usamos solo para avisarte si ganas.</p>
      </div>

      {error && <p className="field err" style={{ marginBottom: 14 }}>{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={enviando}>
        {enviando ? 'Registrando…' : 'Empezar'}
      </button>
    </form>
  )
}
