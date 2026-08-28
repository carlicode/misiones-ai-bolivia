const config = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'us-east-1',
  tablaParticipantes: process.env.TABLA_PARTICIPANTES || 'ugai-participantes-dev',
  tablaMisiones: process.env.TABLA_MISIONES || 'ugai-misiones-dev',
  bucketFotos: process.env.BUCKET_FOTOS || '',
  staffKey: process.env.STAFF_KEY || 'cambiar-esta-clave',
};

module.exports = config;
