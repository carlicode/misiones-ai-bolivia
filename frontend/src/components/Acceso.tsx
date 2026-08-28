import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api, type Participante } from '../lib/api'

interface Props {
  onEntro: (p: Participante) => void
  onVolver: () => void
}

type Modo = 'entrar' | 'registrarse'

/**
 * El celular es el código: alcanza para volver a entrar.
 * El nombre solo se pide la primera vez.
 */
export default function Acceso({ onEntro, onVolver }: Props) {
  const [modo, setModo] = useState<Modo>('entrar')
  const [celular, setCelular] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (celular.replace(/\D/g, '').length < 8) {
      setError('Escribe tu celular completo, con al menos 8 dígitos.')
      return
    }

    setEnviando(true)
    try {
      if (modo === 'entrar') {
        try {
          onEntro(await api.entrar(celular))
        } catch {
          // No está registrado: se pasa a pedirle el nombre, sin hacerle
          // escribir el número otra vez.
          setModo('registrarse')
          setError(null)
        }
        return
      }

      if (nombre.trim().split(/\s+/).length < 2) {
        setError('Escribe tu nombre y apellido completos.')
        return
      }
      onEntro(await api.registrar(nombre, celular))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo continuar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <button className="btn btn-text volver" onClick={onVolver}>
        <ArrowLeft size={15} strokeWidth={2} />
        Volver
      </button>

      <h1 className="acceso-titulo">
        {modo === 'entrar' ? 'Tu celular es tu código' : 'Solo esta vez'}
      </h1>
      <p className="acceso-lede">
        {modo === 'entrar'
          ? 'Con tu número entras y sigues donde lo dejaste. No hay contraseña.'
          : 'No encontramos ese número, así que es tu primera vez. Dinos cómo te llamas y listo.'}
      </p>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="celular">Celular</label>
          <input
            id="celular"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Ej. 70123456"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            disabled={modo === 'registrarse'}
          />
          {modo === 'registrarse' && (
            <button
              type="button"
              className="btn btn-text cambiar-num"
              onClick={() => { setModo('entrar'); setNombre(''); setError(null) }}
            >
              Cambiar número
            </button>
          )}
        </div>

        {modo === 'registrarse' && (
          <div className="field">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              placeholder="Ej. María Fernández Rojas"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
            <p className="hint">Así te anunciamos si ganas, escríbelo bien.</p>
          </div>
        )}

        {error && <p className="field err" style={{ marginBottom: 14 }}>{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'entrar' ? 'Continuar' : 'Empezar'}
        </button>
      </form>
    </div>
  )
}
