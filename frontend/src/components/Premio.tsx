import { useState } from 'react'

/**
 * El premio flotando en el hero.
 *
 * La foto viene recortada sobre transparencia. Como la base de la pieza es
 * negra y el fondo de la app también, lleva un halo suave detrás: sin eso la
 * placa se pierde contra la página.
 */
export default function Premio() {
  const [falla, setFalla] = useState(false)

  if (falla) return null

  return (
    <div className="premio">
      <span className="premio-halo" aria-hidden="true" />
      <img
        src="/premio-3d.png"
        alt="Impresión 3D de la salteñita del AWS AI UG Bolivia sosteniendo un cubo"
        onError={() => setFalla(true)}
      />
      <span className="premio-sombra" aria-hidden="true" />
    </div>
  )
}
