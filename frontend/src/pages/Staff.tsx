import { useCallback, useEffect, useState } from 'react'
import { staffApi, leerClave, borrarClave, type EvidenciaPendiente, type Totales } from '../lib/staffApi'
import type { MissionId } from '../lib/missions'
import ClaveGate from '../components/staff/ClaveGate'
import EvidenciaCard from '../components/staff/EvidenciaCard'
import Elegibles from '../components/staff/Elegibles'
import Buscador from '../components/staff/Buscador'
import Toast from '../components/Toast'

type Pestana = 'cola' | 'elegibles' | 'buscar'
type ToastState = { tipo: 'ok' | 'error'; mensaje: string } | null

export default function Staff() {
  const [clave, setClave] = useState<string | null>(() => leerClave())
  const [pestana, setPestana] = useState<Pestana>('cola')
  const [pendientes, setPendientes] = useState<EvidenciaPendiente[]>([])
  const [totales, setTotales] = useState<Totales | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const cargarCola = useCallback(async (silencioso = false) => {
    if (!clave) return
    if (!silencioso) setCargando(true)
    try {
      const r = await staffApi.cola(clave)
      setPendientes(r.pendientes)
      setTotales(r.totales)
    } catch {
      setToast({ tipo: 'error', mensaje: 'No se pudo cargar la cola. Revisa tu conexión.' })
    } finally {
      setCargando(false)
    }
  }, [clave])

  useEffect(() => {
    if (!clave) return
    cargarCola()
    // Refresca solo mientras se modera, para ver lo que llega de otros celulares.
    const id = setInterval(() => cargarCola(true), 20_000)
    return () => clearInterval(id)
  }, [clave, cargarCola])

  async function revisar(
    ev: EvidenciaPendiente,
    estado: 'aprobada' | 'rechazada',
    motivo?: string
  ) {
    if (!clave) return
    setOcupado(true)

    // Sale de la lista al instante: dos personas moderando no deben chocar.
    setPendientes((lista) =>
      lista.filter((e) => !(e.participanteId === ev.participanteId && e.missionId === ev.missionId))
    )

    try {
      const r = await staffApi.revisar(clave, ev.participanteId, ev.missionId as MissionId, estado, motivo)
      setTotales(r.totales)
      setToast({
        tipo: 'ok',
        mensaje: estado === 'aprobada' ? `Aprobada · ${ev.nombre}` : `Rechazada · ${ev.nombre}`,
      })
    } catch {
      setToast({ tipo: 'error', mensaje: 'No se pudo guardar. La evidencia vuelve a la cola.' })
      cargarCola(true)
    } finally {
      setOcupado(false)
    }
  }

  function salir() {
    borrarClave()
    setClave(null)
  }

  if (!clave) return <ClaveGate onEntrar={setClave} />

  return (
    <>
      <div className="topbar">
        <span className="word"><b>Panel</b> Staff</span>
        <button className="btn btn-text" onClick={salir} style={{ padding: 0 }}>Salir</button>
      </div>

      <div className="shell">
        {totales && (
          <div className="totales">
            <div><span className="t-num">{totales.pendientes}</span><span className="t-lbl">por revisar</span></div>
            <div><span className="t-num">{totales.elegibles}</span><span className="t-lbl">elegibles</span></div>
            <div><span className="t-num">{totales.entradas}</span><span className="t-lbl">entradas</span></div>
            <div><span className="t-num">{totales.participantes}</span><span className="t-lbl">registrados</span></div>
          </div>
        )}

        <nav className="tabs">
          <button className={pestana === 'cola' ? 'on' : ''} onClick={() => setPestana('cola')}>
            Cola{totales && totales.pendientes > 0 ? ` (${totales.pendientes})` : ''}
          </button>
          <button className={pestana === 'elegibles' ? 'on' : ''} onClick={() => setPestana('elegibles')}>
            Elegibles
          </button>
          <button className={pestana === 'buscar' ? 'on' : ''} onClick={() => setPestana('buscar')}>
            Buscar
          </button>
        </nav>

        {pestana === 'cola' && (
          cargando ? (
            <p className="vacio-msg">Cargando la cola…</p>
          ) : pendientes.length === 0 ? (
            <p className="vacio-msg">Cola al día. No hay evidencias por revisar.</p>
          ) : (
            <div className="cola">
              {pendientes.map((ev) => (
                <EvidenciaCard
                  key={`${ev.participanteId}-${ev.missionId}`}
                  evidencia={ev}
                  ocupado={ocupado}
                  onRevisar={(estado, motivo) => revisar(ev, estado, motivo)}
                />
              ))}
            </div>
          )
        )}

        {pestana === 'elegibles' && <Elegibles clave={clave} />}
        {pestana === 'buscar' && <Buscador clave={clave} />}
      </div>

      {toast && <Toast tipo={toast.tipo} mensaje={toast.mensaje} onCerrar={() => setToast(null)} />}
    </>
  )
}
