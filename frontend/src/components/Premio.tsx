import { useState } from 'react'

/**
 * El premio flotando en el hero.
 *
 * La foto viene con fondo negro de estudio, no recortada. Se enmarca como
 * foto de producto para que ese fondo se lea intencional, y el marco entero
 * flota sobre su sombra.
 */
export default function Premio() {
  const [falla, setFalla] = useState(false)

  if (falla) return null

  return (
    <div className="premio">
      <div className="premio-pieza">
        <img
          src="/premio-3d.jpg"
          alt="Impresión 3D de la salteñita del AWS AI UG Bolivia sosteniendo un cubo"
          onError={() => setFalla(true)}
        />
        <span className="premio-tag">El premio</span>
      </div>
      <span className="premio-sombra" aria-hidden="true" />
    </div>
  )
}
