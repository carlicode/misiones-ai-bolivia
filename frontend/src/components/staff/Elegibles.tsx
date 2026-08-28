import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { staffApi, type Elegible } from '../../lib/staffApi'

interface Props {
  clave: string
}

export default function Elegibles({ clave }: Props) {
  const [lista, setLista] = useState<Elegible[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    staffApi.elegibles(clave)
      .then((r) => setLista(r.elegibles))
      .catch(() => setError('No se pudo cargar la lista.'))
  }, [clave])

  async function copiar() {
    if (!lista) return
    const texto = lista
      .map((e) => `${e.nombre} — ${e.celular} — ${e.entradas} entrada${e.entradas === 1 ? '' : 's'}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setError('Tu navegador bloqueó el portapapeles. Copia la lista a mano.')
    }
  }

  if (error) return <p className="vacio-msg">{error}</p>
  if (!lista) return <p className="vacio-msg">Cargando…</p>
  if (lista.length === 0) {
    return <p className="vacio-msg">Todavía nadie completó las 3 misiones obligatorias.</p>
  }

  const totalEntradas = lista.reduce((suma, e) => suma + e.entradas, 0)

  return (
    <>
      <div className="lista-head">
        <p>
          <b>{lista.length}</b> {lista.length === 1 ? 'persona' : 'personas'} · <b>{totalEntradas}</b> entradas en la tómbola
        </p>
        <button className="btn btn-text btn-icono" onClick={copiar}>
          {copiado ? <Check size={14} strokeWidth={2.4} /> : <Copy size={14} strokeWidth={2} />}
          {copiado ? 'Copiado' : 'Copiar lista'}
        </button>
      </div>

      <ul className="elegibles">
        {lista.map((e) => (
          <li key={e.id}>
            <span className="el-nombre">
              {e.nombre}
              <span className="el-cel">{e.celular}</span>
            </span>
            <span className="el-entradas" title={`${e.bonusAprobados} bonus aprobados`}>
              {e.entradas}×
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
