import { useEffect, useState } from 'react'
import { api, type Participante, type ConfigEvento } from './lib/api'
import { guardarId, leerId, borrarId } from './lib/storage'
import { MISSIONS, PREMIOS, WHATSAPP_URL, REQUIRED_IDS, type MissionId } from './lib/missions'
import RegistroForm from './components/RegistroForm'
import Progreso from './components/Progreso'
import MisionCard from './components/MisionCard'
import MisionSheet from './components/MisionSheet'
import Lineamientos from './components/Lineamientos'
import ComoSeHizo from './components/ComoSeHizo'
import Contador from './components/Contador'
import Premio from './components/Premio'
import Confeti from './components/Confeti'
import Toast from './components/Toast'

type ToastState = { tipo: 'ok' | 'error'; mensaje: string } | null

export default function App() {
  const [participante, setParticipante] = useState<Participante | null>(null)
  const [cargando, setCargando] = useState(true)
  const [misionAbierta, setMisionAbierta] = useState<MissionId | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [stats, setStats] = useState<{ participantes: number } | null>(null)
  const [confeti, setConfeti] = useState(false)
  const [config, setConfig] = useState<ConfigEvento | null>(null)

  useEffect(() => {
    const id = leerId()
    if (!id) { setCargando(false); return }

    api.obtener(id)
      .then(setParticipante)
      .catch(() => borrarId())
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    let activo = true
    function cargar() {
      api.stats().then((s) => { if (activo) setStats(s) }).catch(() => {})
      // Se relee junto con las stats para que el cierre entre en efecto
      // sin que nadie tenga que recargar la página.
      api.config().then((c) => { if (activo) setConfig(c) }).catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 30_000)
    return () => { activo = false; clearInterval(id) }
  }, [])

  function alRegistrarse(p: Participante) {
    guardarId(p.id)
    setParticipante(p)
  }

  function alEnviarMision(p: Participante) {
    const yaEraElegible = participante?.elegible
    setParticipante(p)
    // El momento que vale la pena celebrar: acaba de entrar al sorteo.
    if (!yaEraElegible && p.elegible) setConfeti(true)
    setToast({
      tipo: 'ok',
      mensaje: !yaEraElegible && p.elegible
        ? '¡Listo! Ya estás participando en el sorteo.'
        : 'Misión enviada. La revisamos y te avisamos aquí mismo.',
    })
  }

  const cerrado = config?.cerrado ?? false
  const misionActiva = MISSIONS.find((m) => m.id === misionAbierta)
  const envioActivo = participante?.misiones.find((m) => m.missionId === misionAbierta)

  if (cargando) return null

  return (
    <>
      <div className="topbar">
        <span className="word"><b>AWS UG AI</b> Bolivia</span>
        <Contador cierre={config?.cierre ?? null} />
      </div>

      <div className="shell">
        {config?.cerrado && (
          <p className="aviso-cerrado">
            La participación cerró. Los ganadores se anuncian a las {config.anuncio} en
            el grupo de WhatsApp.
          </p>
        )}

        {!participante ? (
          <>
            <header className="hero">
              <Premio />
              <p className="eyebrow">Community Day 2026 · Sorteo</p>
              <h1 className="hero-title">
                Gana una <span className="accent">impresión 3D</span>
              </h1>
              <p className="hero-lede">
                Cumple 3 misiones sencillas durante el evento y entra al sorteo de {PREMIOS} impresiones 3D.
              </p>
            </header>
            {!cerrado && <RegistroForm onRegistrado={alRegistrarse} />}
            <ComoSeHizo />
          </>
        ) : (
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
                <b>{participante.obligatoriasAprobadas} de {REQUIRED_IDS.length}</b> misiones obligatorias aprobadas
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
              {MISSIONS.filter((m) => m.required).map((m) => (
                <MisionCard
                  key={m.id}
                  mision={m}
                  envio={participante.misiones.find((e) => e.missionId === m.id)}
                  onClick={() => { if (!cerrado) setMisionAbierta(m.id) }}
                />
              ))}
            </div>

            <div className="grupo-titulo">
              <h2>Bonus</h2>
              <span className="sub">+1 entrada cada una</span>
            </div>
            <div className="mislist">
              {MISSIONS.filter((m) => !m.required).map((m) => (
                <MisionCard
                  key={m.id}
                  mision={m}
                  envio={participante.misiones.find((e) => e.missionId === m.id)}
                  onClick={() => { if (!cerrado) setMisionAbierta(m.id) }}
                />
              ))}
            </div>

            <Lineamientos />
            <ComoSeHizo />

            <footer className="pie">
              <span>Debes estar presente para recibir tu premio.</span>
              {stats && (
                <span className="contador"><b>{stats.participantes}</b> participando</span>
              )}
            </footer>
          </>
        )}
      </div>

      {misionActiva && participante && (
        <MisionSheet
          mision={misionActiva}
          participanteId={participante.id}
          envio={envioActivo}
          onClose={() => setMisionAbierta(null)}
          onEnviado={alEnviarMision}
        />
      )}

      {confeti && <Confeti onFin={() => setConfeti(false)} />}
      {toast && <Toast tipo={toast.tipo} mensaje={toast.mensaje} onCerrar={() => setToast(null)} />}
    </>
  )
}
