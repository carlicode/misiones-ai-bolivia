const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('./config');

const s3 = new S3Client({ region: config.region });

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/** URL para que el celular suba la foto directo a S3, sin pasar por la Lambda. */
async function urlDeSubida(key, contentType) {
  if (!TIPOS_PERMITIDOS.includes(contentType)) {
    throw Object.assign(new Error('Formato de imagen no permitido'), { status: 400 });
  }
  const comando = new PutObjectCommand({
    Bucket: config.bucketFotos,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, comando, { expiresIn: 300 });
}

/** URL temporal para que el staff vea la evidencia. El bucket es privado. */
async function urlDeLectura(key) {
  const comando = new GetObjectCommand({ Bucket: config.bucketFotos, Key: key });
  return getSignedUrl(s3, comando, { expiresIn: 3600 });
}

module.exports = { urlDeSubida, urlDeLectura, TIPOS_PERMITIDOS };
