import { Lock } from 'lucide-react'
import { MISSIONS, REQUIRED_IDS, WHATSAPP_URL } from '../lib/missions'
import type { MissionId } from '../lib/missions'
import type { Participante } from '../lib/api'
import Progreso from './Progreso'
import MisionCard from './MisionCard'
import Lineamientos from './Lineamientos'

interface Props {
  participante: Participante
  cerrado: boolean
  stats: { participantes: number } | null
  onAbrirMision: (id: MissionId) => void
}

export default function Panel({ participante, cerrado, stats, onAbrirMision }: Props) {
  const obligatorias = MISSIONS.filter((m) => m.required)
  const bonus = MISSIONS.filter((m) => !m.required)
  const faltan = REQUIRED_IDS.length - participante.obligatoriasEnviadas

  return (
    <>
      <section className="resumen">
        <p className="saludo">
          Hola, {participante.nombre.split(' ')[0]}
          <span>Tu progreso en el sorteo</span>
        </p>
      </section>

      <div className="progreso">
        <Progreso hechas={participante.obligatoriasAprobadas} total={REQUIRED_IDS.length} />
        <p className="txt">
          <b>{participante.obligatoriasAprobadas} de {REQUIRED_IDS.length}</b> misiones
          obligatorias aprobadas
        </p>
      </div>

      <span className={`badge-elegible ${participante.elegible ? 'si' : 'no'}`}>
        <span className="dot" aria-hidden="true" />
        {participante.elegible
          ? `Participando · ${participante.entradas} entrada${participante.entradas === 1 ? '' : 's'}`
          : 'Aún no participas'}
      </span>

      <a className="btn btn-wa" href={WHATSAPP_URL} target="_blank" rel="noreferrer" style={{ marginTop: 20 }}>
        Únete al grupo de la comunidad
      </a>

      <div className="grupo-titulo">
        <h2>Obligatorias</h2>
        <span className="sub">para entrar al sorteo</span>
      </div>
      <div className="mislist">
        {obligatorias.map((m) => (
          <MisionCard
            key={m.id}
            mision={m}
            envio={participante.misiones.find((e) => e.missionId === m.id)}
            onClick={() => { if (!cerrado) onAbrirMision(m.id) }}
          />
        ))}
      </div>

      <div className="grupo-titulo">
        <h2>Bonus</h2>
        <span className="sub">+1 entrada cada una</span>
      </div>

      {!participante.bonusHabilitado && (
        <p className="bloqueo">
          <Lock size={15} strokeWidth={2} />
          <span>
            Te {faltan === 1 ? 'falta' : 'faltan'} <b>{faltan}</b> obligatoria
            {faltan === 1 ? '' : 's'} por enviar. Cuando estén las 3 se abren los bonus.
          </span>
        </p>
      )}

      <div className={`mislist${participante.bonusHabilitado ? '' : ' bloqueada'}`}>
        {bonus.map((m) => (
          <MisionCard
            key={m.id}
            mision={m}
            envio={participante.misiones.find((e) => e.missionId === m.id)}
            onClick={() => {
              if (!cerrado && participante.bonusHabilitado) onAbrirMision(m.id)
            }}
          />
        ))}
      </div>

      <Lineamientos />

      <footer className="pie">
        <span>Debes estar presente para recibir tu premio.</span>
        {stats && <span className="contador"><b>{stats.participantes}</b> participando</span>}
      </footer>
    </>
  )
}
