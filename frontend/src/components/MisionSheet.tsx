import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import type { Mission } from '../lib/missions'
import type { MisionEnviada, Participante } from '../lib/api'
import { api } from '../lib/api'
import { comprimirImagen } from '../lib/comprimir'

interface Props {
  mision: Mission
  participanteId: string
  envio?: MisionEnviada
  onClose: () => void
  onEnviado: (p: Participante) => void
}

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const TAMANO_MAX = 12 * 1024 * 1024

export default function MisionSheet({ mision, participanteId, envio, onClose, onEnviado }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [campos, setCampos] = useState<Record<string, string>>(envio?.data ?? {})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    return () => { if (previa) URL.revokeObjectURL(previa) }
  }, [previa])

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)

    if (!TIPOS_PERMITIDOS.includes(f.type)) {
      setError('Sube una foto en formato JPG, PNG, WEBP o HEIC.')
      return
    }
    if (f.size > TAMANO_MAX) {
      setError('La foto pesa demasiado. Prueba con una de menor calidad.')
      return
    }

    if (previa) URL.revokeObjectURL(previa)
    setArchivo(f)
    setPrevia(URL.createObjectURL(f))
  }

  const Icono = mision.icon
  const camposFaltantes = (mision.fields ?? []).filter((f) => !campos[f.key]?.trim())
  const puedeEnviar = Boolean(archivo) && camposFaltantes.length === 0 && !enviando

  async function onSubmit() {
    if (!archivo) { setError('Sube una foto para continuar.'); return }
    if (camposFaltantes.length > 0) { setError('Completa los campos antes de enviar.'); return }

    setError(null)
    setEnviando(true)
    try {
      // Baja el peso antes de salir a la red: en el evento los datos van lentos.
      const liviana = await comprimirImagen(archivo)
      const key = await api.subirFoto(participanteId, mision.id, liviana)
      const participante = await api.enviarMision(participanteId, mision.id, key, campos)
      onEnviado(participante)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={mision.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        <div className="sheet-head">
          <span className="ico" aria-hidden="true"><Icono size={21} strokeWidth={1.9} /></span>
          <h3>{mision.title}</h3>
        </div>
        <p className="sheet-desc">{mision.desc}</p>

        <div className="field">
          <label>{mision.photoLabel}</label>
          <div className="foto-picker">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={elegirArchivo}
              aria-label={mision.photoLabel}
            />
            {previa ? (
              <>
                <img src={previa} alt="" />
                <span className="cambiar">Cambiar</span>
              </>
            ) : (
              <span className="vacio">
                <Camera size={28} strokeWidth={1.5} />
                <span>Toca para tomar o elegir una foto</span>
              </span>
            )}
          </div>
        </div>

        {mision.fields?.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            {f.type === 'select' ? (
              <select
                id={f.key}
                value={campos[f.key] ?? ''}
                onChange={(e) => setCampos((c) => ({ ...c, [f.key]: e.target.value }))}
              >
                <option value="" disabled>Elige una opción…</option>
                {f.options.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <>
                <textarea
                  id={f.key}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  value={campos[f.key] ?? ''}
                  onChange={(e) => setCampos((c) => ({ ...c, [f.key]: e.target.value }))}
                />
                <p className="count">{(campos[f.key] ?? '').length}/{f.maxLength}</p>
              </>
            ) : (
              <input
                id={f.key}
                type="text"
                placeholder={f.placeholder}
                value={campos[f.key] ?? ''}
                onChange={(e) => setCampos((c) => ({ ...c, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        {error && <p className="field err" style={{ marginTop: -6, marginBottom: 16 }}>{error}</p>}

        <button className="btn btn-primary" onClick={onSubmit} disabled={!puedeEnviar}>
          {enviando ? 'Enviando…' : envio ? 'Reenviar misión' : 'Enviar misión'}
        </button>
        <button className="btn btn-text" onClick={onClose} style={{ margin: '10px auto 0', display: 'flex' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
