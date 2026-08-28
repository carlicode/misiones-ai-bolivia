import { ANUNCIO, INSTAGRAM_HANDLE, PREMIOS } from '../lib/missions'

const PUNTOS = [
  { n: '01', texto: <>Completa las <b>3 misiones obligatorias</b> para entrar al sorteo.</> },
  { n: '02', texto: <>Cada <b>misión bonus</b> aprobada te da una entrada extra — hasta 4 en total.</> },
  { n: '03', texto: <>Más entradas suben tu probabilidad, pero <b>nadie gana más de un premio</b>.</> },
  { n: '04', texto: <>Los <b>{PREMIOS} ganadores</b> se anuncian a las <b>{ANUNCIO}</b> en el grupo de WhatsApp.</> },
  { n: '05', texto: <>Debes <b>estar presente en el evento</b> para recibir tu impresión 3D.</> },
  { n: '06', texto: <>La foto de Instagram debe etiquetar a <b>{INSTAGRAM_HANDLE}</b>.</> },
]

export default function Lineamientos() {
  return (
    <details className="acordeon">
      <summary>
        Lineamientos del sorteo
        <span className="plus" aria-hidden="true">+</span>
      </summary>
      <div className="contenido">
        <ul>
          {PUNTOS.map((p) => (
            <li key={p.n}>
              <span className="n">{p.n}</span>
              <span>{p.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
