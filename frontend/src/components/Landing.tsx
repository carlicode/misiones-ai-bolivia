import { ArrowRight, Camera, Clock, Layers } from 'lucide-react'
import Premio from './Premio'
import ComoSeHizo from './ComoSeHizo'
import { MISSIONS, PREMIOS, ANUNCIO } from '../lib/missions'

interface Props {
  onParticipar: () => void
  /** Ref para que el menú pueda saltar a "Cómo se hizo". */
  refComoSeHizo: React.RefObject<HTMLDivElement>
}

/** Lo que hay que saber ANTES de empezar, para no llenar el formulario en vano. */
const CONSEJOS = [
  {
    icono: Camera,
    titulo: 'Ten las fotos listas antes',
    texto:
      'Cada misión se envía con su foto. Junta primero las evidencias en tu galería y así no te quedas a medias con el formulario abierto.',
  },
  {
    icono: Layers,
    titulo: 'Primero las 3 obligatorias',
    texto:
      'Las obligatorias son las que te meten al sorteo. Recién cuando envías las 3 se te abren las misiones bonus.',
  },
  {
    icono: Clock,
    titulo: 'Sube cada una apenas la tengas',
    texto:
      'No esperes al final. Cada misión se manda por separado y puedes volver cuando quieras: el bonus lo puedes subir mucho después.',
  },
]

export default function Landing({ onParticipar, refComoSeHizo }: Props) {
  const obligatorias = MISSIONS.filter((m) => m.required)
  const bonus = MISSIONS.filter((m) => !m.required)

  return (
    <>
      <header className="hero">
        <Premio />
        <p className="eyebrow">Community Day 2026 · Santa Cruz</p>
        <h1 className="hero-title">
          Gana una <span className="accent">impresión 3D</span>
        </h1>
        <p className="hero-lede">
          Cumple 3 misiones durante el evento y entra al sorteo de {PREMIOS} impresiones
          3D de la salteñita del UG.
        </p>

      </header>

      <section className="bloque">
        <h2 className="bloque-titulo">Antes de empezar</h2>
        <ul className="consejos">
          {CONSEJOS.map((c) => {
            const Icono = c.icono
            return (
              <li key={c.titulo}>
                <span className="consejo-ico"><Icono size={19} strokeWidth={1.9} /></span>
                <span>
                  <b>{c.titulo}</b>
                  {c.texto}
                </span>
              </li>
            )
          })}
        </ul>

        <button className="btn btn-primary btn-participar" onClick={onParticipar}>
          Participar
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>
      </section>

      <section className="bloque">
        <h2 className="bloque-titulo">Cuáles son las misiones</h2>

        <p className="grupo-nota">
          <b>Obligatorias.</b> Las 3 te dan tu entrada al sorteo.
        </p>
        <ul className="lista-simple">
          {obligatorias.map((m) => {
            const Icono = m.icon
            return (
              <li key={m.id}>
                <span className="ls-ico"><Icono size={17} strokeWidth={1.9} /></span>
                <span>
                  <b>{m.title}</b>
                  {m.desc}
                </span>
              </li>
            )
          })}
        </ul>

        <p className="grupo-nota grupo-nota-bonus">
          <b>Bonus.</b> Cada una suma una entrada más, hasta 4 en total.
          Se abren cuando envías las 3 obligatorias.
        </p>
        <ul className="lista-simple atenuada">
          {bonus.map((m) => {
            const Icono = m.icon
            return (
              <li key={m.id}>
                <span className="ls-ico"><Icono size={17} strokeWidth={1.9} /></span>
                <span>
                  <b>{m.title}</b>
                  {m.desc}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="bloque">
        <h2 className="bloque-titulo">Cómo funciona el sorteo</h2>
        <ul className="reglas">
          <li>Con las 3 obligatorias aprobadas entras con <b>1 entrada</b>.</li>
          <li>Cada bonus aprobado suma <b>1 entrada más</b>, hasta 4.</li>
          <li>Más entradas suben tu probabilidad, pero <b>nadie gana dos premios</b>.</li>
          <li>
            Todos los ganadores se anuncian a las <b>{ANUNCIO}</b> en el grupo de
            WhatsApp, pero podemos darte sorpresas antes 😉
          </li>
          <li>Tienes que <b>estar presente en el evento</b> para recibir tu impresión 3D.</li>
        </ul>
      </section>

      <button className="btn btn-primary btn-participar" onClick={onParticipar}>
        Participar
        <ArrowRight size={18} strokeWidth={2.2} />
      </button>

      <div ref={refComoSeHizo}>
        <ComoSeHizo />
      </div>
    </>
  )
}
