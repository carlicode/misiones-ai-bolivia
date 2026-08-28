import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { staffApi, type Elegible, type Ganador, type Sorteo } from '../../lib/staffApi'
import { PREMIOS } from '../../lib/missions'

interface Props {
  clave: string
}

type Fase = 'listo' | 'girando' | 'revelado'

/** Cuánto dura el giro antes de fijar cada ganador. */
const GIRO_MS = 2600
const PAUSA_ENTRE_MS = 700
const TICK_MS = 65

export default function Tombola({ clave }: Props) {
  const [elegibles, setElegibles] = useState<Elegible[]>([])
  const [sorteo, setSorteo] = useState<Sorteo | null>(null)
  const [fase, setFase] = useState<Fase>('listo')
  const [revelados, setRevelados] = useState<Ganador[]>([])
  const [girando, setGirando] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const cancelado = useRef(false)

  useEffect(() => {
    Promise.all([staffApi.elegibles(clave), staffApi.ultimoSorteo(clave)])
      .then(([e, s]) => {
        setElegibles(e.elegibles)
        if (s) { setSorteo(s); setRevelados(s.ganadores); setFase('revelado') }
      })
      .catch(() => setError('No se pudo cargar la información.'))
  }, [clave])

  useEffect(() => () => { cancelado.current = true }, [])

  async function correrSorteo() {
    setError(null)
    setConfirmando(false)
    setRevelados([])
    setFase('girando')
    cancelado.current = false

    let resultado: Sorteo
    try {
      resultado = await staffApi.sortear(clave, PREMIOS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo correr el sorteo.')
      setFase('listo')
      return
    }

    setSorteo(resultado)
    const nombres = enTombola.map((e) => e.nombre)

    // Revela uno por uno: el suspenso es el punto de la animación.
    for (const ganador of resultado.ganadores) {
      const hasta = Date.now() + GIRO_MS
      while (Date.now() < hasta) {
        if (cancelado.current) return
        setGirando(nombres[Math.floor(Math.random() * nombres.length)] ?? '')
        await new Promise((r) => setTimeout(r, TICK_MS))
      }
      if (cancelado.current) return
      setGirando('')
      setRevelados((lista) => [...lista, ganador])
      await new Promise((r) => setTimeout(r, PAUSA_ENTRE_MS))
    }

    if (!cancelado.current) setFase('revelado')
  }

  async function copiarGanadores() {
    if (revelados.length === 0) return
    const texto = [
      'Ganadores del sorteo · AWS Community Day Bolivia 2026',
      '',
      ...revelados.map((g, i) => `${i + 1}. ${g.nombre}`),
      '',
      'Recuerden que deben estar presentes en el evento para recibir su impresión 3D.',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setError('Tu navegador bloqueó el portapapeles. Copia la lista a mano.')
    }
  }

  const sorpresas = elegibles.filter((e) => e.ganadorSorpresa)
  const enTombola = elegibles.filter((e) => !e.ganadorSorpresa)
  const totalEntradas = enTombola.reduce((s, e) => s + e.entradas, 0)
  const porSortear = Math.max(0, PREMIOS - sorpresas.length)

  return (
    <div className="tombola">
      {error && <p className="field err" style={{ marginBottom: 14 }}>{error}</p>}

      {fase === 'listo' && (
        <>
          <div className="tb-resumen">
            <p><b>{enTombola.length}</b> {enTombola.length === 1 ? 'persona en la tómbola' : 'personas en la tómbola'}</p>
            <p><b>{totalEntradas}</b> entradas</p>
            {sorpresas.length > 0 && (
              <p className="tb-sorpresas">
                <b>{sorpresas.length}</b> {sorpresas.length === 1 ? 'premio entregado' : 'premios entregados'} como
                sorpresa. Quedan <b>{porSortear}</b> por sortear.
              </p>
            )}
            <p className="tb-nota">
              Quien tiene bonus aparece varias veces, pero al salir sorteado se
              retira: nadie gana dos premios. Los ganadores sorpresa no entran.
            </p>
          </div>

          {!confirmando ? (
            <button
              className="btn btn-primary"
              onClick={() => setConfirmando(true)}
              disabled={enTombola.length === 0 || porSortear === 0}
            >
              {enTombola.length === 0
                ? 'Todavía no hay elegibles'
                : porSortear === 0
                  ? 'Ya se entregaron los 10 premios'
                  : `Sortear ${porSortear} ${porSortear === 1 ? 'premio' : 'premios'}`}
            </button>
          ) : (
            <div className="tb-confirmar">
              <p>Esto reemplaza cualquier sorteo anterior. ¿Seguimos?</p>
              <div className="ev-acciones" style={{ padding: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmando(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary btn-sm" onClick={correrSorteo}>
                  Sí, sortear
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(fase === 'girando' || fase === 'revelado') && (
        <>
          {fase === 'girando' && (
            <div className="tb-ruleta" aria-live="polite">
              <span className="tb-ruleta-nombre">{girando || '…'}</span>
              <span className="tb-ruleta-lbl">
                sorteando el premio {revelados.length + 1} de {sorteo?.ganadores.length ?? PREMIOS}
              </span>
            </div>
          )}

          <ol className="tb-ganadores">
            {revelados.map((g, i) => (
              <li key={g.id} style={{ animationDelay: `${i * 40}ms` }}>
                <span className="tb-pos">{i + 1}</span>
                <span className="tb-nombre">
                  {g.nombre}
                  <span className="el-cel">{g.celular}</span>
                </span>
                <span className="tb-entradas">{g.entradas}×</span>
              </li>
            ))}
          </ol>

          {fase === 'revelado' && sorteo && (
            <>
              <div className="tb-acciones">
                <button className="btn btn-primary" onClick={copiarGanadores}>
                  {copiado ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} strokeWidth={2} />}
                  {copiado ? 'Copiado' : 'Copiar para WhatsApp'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFase('listo'); setConfirmando(false) }}>
                  Volver a sortear
                </button>
              </div>

              <details className="acordeon" style={{ marginTop: 22 }}>
                <summary>
                  Comprobante del sorteo
                  <span className="plus" aria-hidden="true">+</span>
                </summary>
                <div className="contenido">
                  <ul>
                    <li><span className="n">Fecha</span><span>{new Date(sorteo.sorteadoEn).toLocaleString('es-BO')}</span></li>
                    <li><span className="n">Elegibles</span><span>{sorteo.totalElegibles} personas · {sorteo.totalEntradas} entradas</span></li>
                    <li><span className="n">Semilla</span><span className="mono" style={{ wordBreak: 'break-all' }}>{sorteo.semilla}</span></li>
                  </ul>
                  <p className="tb-nota" style={{ marginTop: 12 }}>
                    Con esta semilla el resultado se puede recalcular igual, por si
                    alguien pregunta cómo salieron los ganadores.
                  </p>
                </div>
              </details>
            </>
          )}
        </>
      )}
    </div>
  )
}
