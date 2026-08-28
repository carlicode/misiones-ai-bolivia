import { Camera, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Red {
  nombre: string
  detalle: string
  url: string
  icono: LucideIcon
}

/**
 * Las redes de la comunidad, para el menú.
 * Si el UG tiene LinkedIn, X o Meetup, se agregan aquí y aparecen solas.
 */
export const REDES: Red[] = [
  {
    nombre: 'Grupo de WhatsApp',
    detalle: 'Donde pasa todo. Únete.',
    url: 'https://chat.whatsapp.com/L2Dsv5BV1Xv3PmodNyrPvf?mode=gi_t',
    icono: MessageCircle,
  },
  {
    nombre: 'Instagram',
    detalle: '@aws_ai_ug_bolivia',
    url: 'https://www.instagram.com/aws_ai_ug_bolivia/',
    icono: Camera,
  },
]
