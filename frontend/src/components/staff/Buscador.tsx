import { useEffect, useState } from 'react'
import { staffApi, type ResultadoBusqueda } from '../../lib/staffApi'
import { MISSIONS, REQUIRED_IDS } from '../../lib/missions'

interface Props {
  clave: string
}

export default function Buscador({ clave }: Props) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return }

    // Espera a que dejen de escribir para no consultar en cada tecla.
    const id = setTimeout(() => {
      setBuscando(true)
      staffApi.buscar(clave, q)
        .then((r) => setResultados(r.resultados))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false))
    }, 350)

    return () => clearTimeout(id)
  }, [q, clave])

  return (
    <>
      <div className="field">
        <input
          type="search"
          placeholder="Nombre o celular…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar participante"
        />
      </div>

      {buscando && <p className="vacio-msg">Buscando…</p>}

      {!buscando && q.trim().length >= 2 && resultados.length === 0 && (
        <p className="vacio-msg">Nadie coincide con «{q}».</p>
      )}

      <ul className="resultados">
        {resultados.map((r) => (
          <li key={r.id}>
            <div className="res-head">
              <span className="el-nombre">
                {r.nombre}
                <span className="el-cel">{r.celular}</span>
              </span>
              <span className={`badge-elegible ${r.elegible ? 'si' : 'no'}`} style={{ marginTop: 0 }}>
                <span className="dot" aria-hidden="true" />
                {r.elegible ? `${r.entradas} entradas` : `${r.obligatoriasAprobadas}/${REQUIRED_IDS.length}`}
              </span>
            </div>
            <div className="res-misiones">
              {MISSIONS.map((m) => {
                const envio = r.misiones.find((e) => e.missionId === m.id)
                const estado = envio?.estado ?? 'sin-enviar'
                return (
                  <span key={m.id} className={`mini mini-${estado}`} title={`${m.title}: ${estado}`}>
                    {m.emoji}
                  </span>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
