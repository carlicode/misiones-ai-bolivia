/**
 * La sección "cómo se hizo esta app".
 *
 * Estamos en un evento de AWS: la app misma es material didáctico. Para cada
 * servicio se explica qué problema concreto resolvió aquí, no qué es en
 * general — eso ya está en la documentación de AWS.
 */

export interface PiezaDelStack {
  id: string
  nombre: string
  icono: string
  /** Para qué se usó exactamente en esta app. */
  para: string
  /** El detalle que no es obvio y vale la pena contar. */
  detalle: string
}

export const STACK: PiezaDelStack[] = [
  {
    id: 'cloudfront',
    nombre: 'Amazon CloudFront',
    icono: '/aws/cloudfront.svg',
    para: 'Sirve esta app a tu celular.',
    detalle:
      'El bucket con los archivos es privado: solo CloudFront puede leerlo. Además guarda copias cerca de Bolivia, así la app abre rápido aunque el servidor esté en Virginia.',
  },
  {
    id: 's3',
    nombre: 'Amazon S3',
    icono: '/aws/s3.svg',
    para: 'Guarda las fotos de las evidencias y los archivos de la app.',
    detalle:
      'Tu foto no pasa por el servidor: el celular pide un permiso temporal y la sube directo a S3. Por eso una foto pesada no tumba nada. Las evidencias se borran solas a los 90 días.',
  },
  {
    id: 'api-gateway',
    nombre: 'Amazon API Gateway',
    icono: '/aws/api-gateway.svg',
    para: 'Es la puerta de entrada de todo lo que la app pide.',
    detalle:
      'Recibe cada petición y se la pasa a Lambda. No hay ningún servidor encendido esperando: si nadie usa la app, no corre nada.',
  },
  {
    id: 'lambda',
    nombre: 'AWS Lambda',
    icono: '/aws/lambda.svg',
    para: 'Toda la lógica: registro, misiones, moderación y el sorteo.',
    detalle:
      'Se ejecuta solo cuando alguien la llama y se apaga sola. Aquí viven las reglas del juego: quién es elegible y cómo se cuentan las entradas de la tómbola.',
  },
  {
    id: 'dynamodb',
    nombre: 'Amazon DynamoDB',
    icono: '/aws/dynamodb.svg',
    para: 'Guarda participantes, misiones y el resultado del sorteo.',
    detalle:
      'Base de datos sin servidor que cobra por uso. Un índice por número de celular es lo que te deja recuperar tu progreso si borras los datos del navegador.',
  },
  {
    id: 'cloudformation',
    nombre: 'AWS CloudFormation',
    icono: '/aws/cloudformation.svg',
    para: 'Toda esta infraestructura está escrita como código.',
    detalle:
      'Las tablas, el bucket y la distribución no se crearon a mano en la consola. Están en un archivo del repositorio, así que se pueden borrar y volver a crear iguales.',
  },
  {
    id: 'cloudwatch',
    nombre: 'Amazon CloudWatch',
    icono: '/aws/cloudwatch.svg',
    para: 'Registra qué pasa por dentro.',
    detalle:
      'Gracias a sus métricas descubrimos, probando con 200 personas simuladas, que la cuenta tenía un límite bajo y algunas peticiones se rechazaban. Por eso la app reintenta sola.',
  },
]

export const REPO = 'https://github.com/carlicode/misiones-ai-bolivia'
