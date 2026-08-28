import type { LucideIcon } from 'lucide-react'
import { ImagePlus, MessageCircle, Users, Mic, GraduationCap, Wrench } from 'lucide-react'

export type MissionId =
  | 'instagram' | 'whatsapp' | 'lider'
  | 'speaker' | 'charla' | 'taller'

export type ExtraField =
  | { key: string; type: 'text'; label: string; placeholder: string }
  | { key: string; type: 'textarea'; label: string; placeholder: string; maxLength: number }
  | { key: string; type: 'select'; label: string; options: string[] }

export interface Mission {
  id: MissionId
  icon: LucideIcon
  title: string
  desc: string
  photoLabel: string
  required: boolean
  fields?: ExtraField[]
}

/** Charlas de AI de la agenda del AWS Community Day Bolivia 2026. */
export const CHARLAS_AI = [
  'Building Autonomous AI on AWS: From Bedrock to Real-World Agent Systems — Carlos Olivera',
  '¿Y si LinkedIn pudiera hablar contigo? Career Agent con AWS Strands y Amazon Bedrock — Adriana Diaz',
  'De Prototipo a Producción: Evaluando Agentes de IA a Escala con LLM as a Judge — Adrian Acarapi',
  'Encuéntrame.bo: economía informal boliviana con AWS e IA generativa — Carlos Miranda, Luan Huanca',
  'Neptune o OpenSearch: cuándo tu Knowledge Base necesita un grafo — Sara Salazar Paredes',
  'De wildcards a least privilege: pipeline inteligente de revisión de políticas IAM — Gerardo Castro Arica',
  'Cuando los agentes de IA olvidan: Knowledge-Driven Development — Julián Darío Luna Patiño',
  'Visionary Apps: OCR de Clase Mundial en Flutter y AWS sin Librerías Externas — Cristhian Recalde',
  'Construyendo apps de IA en AWS con el poder agéntico de Kiro — Marlene Choque Perez',
  'RAG barato y aburrido: cuándo NO necesitas una base vectorial cara — Diego Angulo Ramirez',
  'Construye un sistema de auto-remediación de seguridad con Amazon Bedrock — Julian Castaño',
  'Kiro: El nuevo aliado de FinOps — Barbara Gaspar',
  'Otra charla de AI de la agenda',
]

export const TALLERES = [
  'Clone Yourself: Build Your AI Crew with Kiro, MCP & Amazon Bedrock',
  'Creando Agentes de IA con LangGraph y Amazon Bedrock',
]

export const MISSIONS: Mission[] = [
  {
    id: 'instagram',
    icon: ImagePlus,
    title: 'Publica en Instagram',
    desc: 'Sube una foto del Community Day a tu feed o historia etiquetando a @aws_ai_ug_bolivia.',
    photoLabel: 'Screenshot de tu publicación',
    required: true,
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    title: 'Únete al grupo y preséntate',
    desc: 'Entra al grupo de WhatsApp de la comunidad y manda un mensaje presentándote.',
    photoLabel: 'Screenshot de tu mensaje en el grupo',
    required: true,
  },
  {
    id: 'lider',
    icon: Users,
    title: 'Selfie con un líder del UG',
    desc: 'Búscanos en el evento y tómate una selfie con cualquier líder del AWS UG AI Bolivia.',
    photoLabel: 'Tu selfie con el líder',
    required: true,
  },
  {
    id: 'speaker',
    icon: Mic,
    title: 'Foto con un speaker de AI',
    desc: 'Tómate una foto con cualquier speaker de una charla de inteligencia artificial.',
    photoLabel: 'Tu foto con el speaker',
    required: false,
    fields: [
      { key: 'speaker', type: 'text', label: 'Nombre del speaker', placeholder: 'Ej. Carlos Olivera' },
    ],
  },
  {
    id: 'charla',
    icon: GraduationCap,
    title: 'Asiste a una charla de AI',
    desc: 'Entra a una charla de AI y cuéntanos en una frase qué te llevas de ella.',
    photoLabel: 'Foto dentro de la sala',
    required: false,
    fields: [
      { key: 'charla', type: 'select', label: '¿A cuál charla entraste?', options: CHARLAS_AI },
      { key: 'aprendizaje', type: 'textarea', label: 'Tu aprendizaje en una frase', placeholder: 'Lo que más me sorprendió fue…', maxLength: 180 },
    ],
  },
  {
    id: 'taller',
    icon: Wrench,
    title: 'Completa un taller',
    desc: 'Participa en uno de los talleres de AI y muéstranos el resultado en tu pantalla.',
    photoLabel: 'Foto de tu pantalla con el resultado',
    required: false,
    fields: [
      { key: 'taller', type: 'select', label: '¿Cuál taller?', options: TALLERES },
    ],
  },
]

export const REQUIRED_IDS = MISSIONS.filter(m => m.required).map(m => m.id)
export const BONUS_IDS = MISSIONS.filter(m => !m.required).map(m => m.id)

export const WHATSAPP_URL = 'https://chat.whatsapp.com/L2Dsv5BV1Xv3PmodNyrPvf?mode=gi_t'
export const INSTAGRAM_URL = 'https://www.instagram.com/aws_ai_ug_bolivia/'
export const INSTAGRAM_HANDLE = '@aws_ai_ug_bolivia'

/**
 * La fecha de cierre y la hora del anuncio vienen del backend (`/api/config`),
 * para poder cambiarlas sin recompilar la app y para que el cierre se aplique
 * de verdad y no solo en pantalla.
 *
 * Estos valores son solo el respaldo mientras carga la configuración.
 */
export const ANUNCIO = '16:00'
export const PREMIOS = 10
