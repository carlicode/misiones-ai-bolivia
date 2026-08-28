interface Props {
  hechas: number
  total: number
}

const RADIO = 19
const CIRC = 2 * Math.PI * RADIO

export default function Progreso({ hechas, total }: Props) {
  const fraccion = total > 0 ? hechas / total : 0
  const offset = CIRC * (1 - fraccion)

  return (
    <div className="aro" role="img" aria-label={`${hechas} de ${total} misiones obligatorias completas`}>
      <svg width="46" height="46" viewBox="0 0 46 46">
        <circle className="fondo" cx="23" cy="23" r={RADIO} />
        <circle
          className="valor"
          cx="23" cy="23" r={RADIO}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="num">{hechas}/{total}</span>
    </div>
  )
}
