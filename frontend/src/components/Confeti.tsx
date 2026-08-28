import { useEffect, useRef } from 'react'

interface Props {
  onFin: () => void
}

/** Los colores de la marca: crema y morado del premio, verde del acento. */
const COLORES = ['#F5EDD6', '#8B5CF6', '#3DF5A0', '#FFFFFF']
const CANTIDAD = 90
const DURACION_MS = 2800

interface Papel {
  x: number
  y: number
  vx: number
  vy: number
  giro: number
  vGiro: number
  ancho: number
  alto: number
  color: string
}

/**
 * Confeti en canvas, sin librería: son ~40 líneas y evita sumar 30 KB
 * al bundle de una app que la gente abre con datos móviles.
 */
export default function Confeti({ onFin }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Quien pidió menos movimiento no debería recibir una explosión de papelitos.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { onFin(); return }

    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) { onFin(); return }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ancho = window.innerWidth
    const alto = window.innerHeight
    canvas.width = ancho * dpr
    canvas.height = alto * dpr
    ctx.scale(dpr, dpr)

    const papeles: Papel[] = Array.from({ length: CANTIDAD }, () => ({
      x: ancho / 2 + (Math.random() - 0.5) * 120,
      y: alto * 0.34 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -11 - 3,
      giro: Math.random() * Math.PI,
      vGiro: (Math.random() - 0.5) * 0.3,
      ancho: 6 + Math.random() * 6,
      alto: 9 + Math.random() * 7,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
    }))

    const inicio = performance.now()
    let animId = 0

    function cuadro(ahora: number) {
      const transcurrido = ahora - inicio
      if (transcurrido > DURACION_MS) { onFin(); return }

      ctx!.clearRect(0, 0, ancho, alto)
      const desvanece = Math.max(0, 1 - transcurrido / DURACION_MS)

      for (const p of papeles) {
        p.vy += 0.34            // gravedad
        p.vx *= 0.992           // roce del aire
        p.x += p.vx
        p.y += p.vy
        p.giro += p.vGiro

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.giro)
        ctx!.globalAlpha = desvanece
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto)
        ctx!.restore()
      }

      animId = requestAnimationFrame(cuadro)
    }

    animId = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(animId)
  }, [onFin])

  return <canvas ref={ref} className="confeti" aria-hidden="true" />
}
