import { useEffect } from 'react'
import { Menu as IconoMenu, X, Code2, ExternalLink } from 'lucide-react'
import { REDES } from '../lib/comunidad'
import { REPO } from '../lib/stack'

interface Props {
  abierto: boolean
  onAbrir: () => void
  onCerrar: () => void
  /** Lleva a la sección "Cómo se hizo", que vive en la landing. */
  onComoSeHizo: () => void
}

export default function Menu({ abierto, onAbrir, onCerrar, onComoSeHizo }: Props) {
  useEffect(() => {
    if (!abierto) return
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onEsc)
    // Con el menú abierto la página de atrás no debería moverse.
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  return (
    <>
      <button
        className="menu-btn"
        onClick={abierto ? onCerrar : onAbrir}
        aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={abierto}
      >
        {abierto ? <X size={20} /> : <IconoMenu size={20} />}
      </button>

      {abierto && (
        <div className="menu-fondo" onClick={onCerrar}>
          <nav className="menu" onClick={(e) => e.stopPropagation()} aria-label="Menú">
            <p className="menu-titulo">La comunidad</p>
            <ul>
              {REDES.map((r) => {
                const Icono = r.icono
                return (
                  <li key={r.nombre}>
                    <a href={r.url} target="_blank" rel="noreferrer" onClick={onCerrar}>
                      <span className="menu-ico"><Icono size={18} strokeWidth={1.9} /></span>
                      <span className="menu-txt">
                        <span className="menu-nombre">{r.nombre}</span>
                        <span className="menu-detalle">{r.detalle}</span>
                      </span>
                      <ExternalLink size={14} className="menu-flecha" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>

            <p className="menu-titulo">Esta app</p>
            <ul>
              <li>
                <button onClick={() => { onCerrar(); onComoSeHizo() }}>
                  <span className="menu-ico"><Code2 size={18} strokeWidth={1.9} /></span>
                  <span className="menu-txt">
                    <span className="menu-nombre">Cómo se hizo</span>
                    <span className="menu-detalle">Los servicios de AWS que la mueven</span>
                  </span>
                </button>
              </li>
              <li>
                <a href={REPO} target="_blank" rel="noreferrer" onClick={onCerrar}>
                  <span className="menu-ico"><Code2 size={18} strokeWidth={1.9} /></span>
                  <span className="menu-txt">
                    <span className="menu-nombre">Ver el código</span>
                    <span className="menu-detalle">Es abierto, en GitHub</span>
                  </span>
                  <ExternalLink size={14} className="menu-flecha" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
