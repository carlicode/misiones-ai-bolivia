import { useEffect, useRef, useState } from 'react'
import { api, type Participante, type ConfigEvento } from './lib/api'
import { guardarId, leerId, borrarId } from './lib/storage'
import { MISSIONS, type MissionId } from './lib/missions'
import Menu from './components/Menu'
import Landing from './components/Landing'
import Acceso from './components/Acceso'
import Panel from './components/Panel'
import MisionSheet from './components/MisionSheet'
import Contador from './components/Contador'
import Confeti from './components/Confeti'
import Toast from './components/Toast'

type Vista = 'landing' | 'acceso' | 'panel'
type ToastState = { tipo: 'ok' | 'error'; mensaje: string } | null

export default function App() {
  const [vista, setVista] = useState<Vista>('landing')
  const [participante, setParticipante] = useState<Participante | null>(null)
  const [cargando, setCargando] = useState(true)
  const [misionAbierta, setMisionAbierta] = useState<MissionId | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [stats, setStats] = useState<{ participantes: number } | null>(null)
  const [config, setConfig] = useState<ConfigEvento | null>(null)
  const [confeti, setConfeti] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const refComoSeHizo = useRef<HTMLDivElement>(null)

  // Quien ya participó entra directo a su panel, sin pasar por la landing.
  useEffect(() => {
    const id = leerId()
    if (!id) { setCargando(false); return }

    api.obtener(id)
      .then((p) => { setParticipante(p); setVista('panel') })
      .catch(() => borrarId())
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    let activo = true
    function cargar() {
      api.stats().then((s) => { if (activo) setStats(s) }).catch(() => {})
      api.config().then((c) => { if (activo) setConfig(c) }).catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 30_000)
    return () => { activo = false; clearInterval(id) }
  }, [])

  function alEntrar(p: Participante) {
    guardarId(p.id)
    setParticipante(p)
    setVista('panel')
    window.scrollTo(0, 0)
  }

  function alEnviarMision(p: Participante) {
    const yaEraElegible = participante?.elegible
    const yaTeniaBonus = participante?.bonusHabilitado
    setParticipante(p)

    if (!yaEraElegible && p.elegible) setConfeti(true)

    setToast({
      tipo: 'ok',
      mensaje: !yaEraElegible && p.elegible
        ? '¡Listo! Ya estás participando en el sorteo.'
        : !yaTeniaBonus && p.bonusHabilitado
          ? 'Enviaste las 3 obligatorias. Ya se abrieron los bonus.'
          : 'Misión enviada. La revisamos y te avisamos aquí mismo.',
    })
  }

  function irAComoSeHizo() {
    setVista('landing')
    // Espera a que la landing esté montada antes de saltar.
    setTimeout(() => refComoSeHizo.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }

  const cerrado = config?.cerrado ?? false
  const misionActiva = MISSIONS.find((m) => m.id === misionAbierta)
  const envioActivo = participante?.misiones.find((m) => m.missionId === misionAbierta)

  if (cargando) return null

  return (
    <>
      <div className="topbar">
        <Menu
          abierto={menuAbierto}
          onAbrir={() => setMenuAbierto(true)}
          onCerrar={() => setMenuAbierto(false)}
          onComoSeHizo={irAComoSeHizo}
        />
        <span className="word"><b>AWS AI UG</b> Bolivia</span>
        <Contador cierre={config?.cierre ?? null} />
      </div>

      <div className="shell">
        {cerrado && (
          <p className="aviso-cerrado">
            La participación cerró. Los ganadores se anuncian a las {config?.anuncio} en
            el grupo de WhatsApp.
          </p>
        )}

        {vista === 'landing' && (
          <Landing
            onParticipar={() => { setVista('acceso'); window.scrollTo(0, 0) }}
            refComoSeHizo={refComoSeHizo}
          />
        )}

        {vista === 'acceso' && (
          <Acceso onEntro={alEntrar} onVolver={() => setVista('landing')} />
        )}

        {vista === 'panel' && participante && (
          <Panel
            participante={participante}
            cerrado={cerrado}
            stats={stats}
            onAbrirMision={setMisionAbierta}
          />
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
