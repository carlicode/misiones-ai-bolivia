import { useState } from 'react'

/**
 * El premio flotando en el hero. Si la imagen todavía no está en
 * public/premio-3d.png, el hero se muestra igual sin dejar un hueco roto.
 */
export default function Premio() {
  const [falla, setFalla] = useState(false)

  if (falla) return null

  return (
    <div className="premio">
      <img
        src="/premio-3d.png"
        alt="Impresión 3D de la salteñita del AWS AI UG Bolivia sosteniendo un cubo"
        onError={() => setFalla(true)}
      />
      <span className="premio-sombra" aria-hidden="true" />
    </div>
  )
}
