import { useState } from 'react'
import { ChevronDown, Code2 } from 'lucide-react'
import { STACK, REPO } from '../lib/stack'

/**
 * Sección didáctica: qué servicios de AWS mueven esta app y para qué sirvió
 * cada uno. Va colapsada por defecto para no estorbar a quien solo vino a
 * participar, pero al alcance de quien tenga curiosidad.
 */
export default function ComoSeHizo() {
  const [abierta, setAbierta] = useState<string | null>(null)

  return (
    <section className="como">
      <div className="como-head">
        <h2>Cómo se hizo esta app</h2>
        <p>
          Corre entera sobre AWS, sin un solo servidor encendido. Toca cada
          servicio para ver qué resolvió aquí.
        </p>
      </div>

      <ul className="stack">
        {STACK.map((p) => {
          const activa = abierta === p.id
          return (
            <li key={p.id} className={activa ? 'on' : ''}>
              <button
                type="button"
                onClick={() => setAbierta(activa ? null : p.id)}
                aria-expanded={activa}
              >
                <img src={p.icono} alt="" width="34" height="34" loading="lazy" />
                <span className="stack-txt">
                  <span className="stack-nombre">{p.nombre}</span>
                  <span className="stack-para">{p.para}</span>
                </span>
                <ChevronDown className="stack-chev" size={16} aria-hidden="true" />
              </button>
              {activa && <p className="stack-detalle">{p.detalle}</p>}
            </li>
          )
        })}
      </ul>

      <a className="como-repo" href={REPO} target="_blank" rel="noreferrer">
        <Code2 size={15} strokeWidth={2} />
        Todo el código es abierto — míralo en GitHub
      </a>
    </section>
  )
}
