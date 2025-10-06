// user-service/src/utils/cloudinary.utils.js

/**
 * PROPÓSITO:
 * - Manejar upload de imágenes a Cloudinary
 * - No guardar imágenes en el servidor (microservicios son stateless)
 * - Cloudinary maneja: resize, optimización, CDN, etc.
 * 
 * POR QUÉ CLOUDINARY:
 * - Gratuito hasta 25GB
 * - Transformaciones automáticas (resize, crop, etc.)
 * - CDN global (imágenes se cargan rápido en todo el mundo)
 * - No ocupamos espacio en nuestro servidor
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

/**
 * CONFIGURACIÓN DE CLOUDINARY
 * Credenciales obtenidas en: https://cloudinary.com/console
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * CONFIGURACIÓN DE MULTER
 * Multer maneja el upload de archivos desde el formulario
 * 
 * storage: memory
 * - NO guardamos el archivo en disco
 * - Lo mantenemos en RAM (req.file.buffer)
 * - Lo subimos directamente a Cloudinary
 * - Después se elimina de RAM automáticamente
 */
const storage = multer.memoryStorage();

/**
 * FILTRO DE ARCHIVOS
 * Solo permitir imágenes
 */
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WebP)'), false);
  }
};

/**
 * MIDDLEWARE DE MULTER
 * Configuración para recibir UN archivo con el nombre 'avatar'
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

/**
 * FUNCIÓN: Subir imagen a Cloudinary
 * 
 * @param {Buffer} buffer - Contenido del archivo en memoria
 * @param {String} folder - Carpeta en Cloudinary donde guardar
 * @returns {Promise<Object>} - Información de la imagen subida
 * 
 * EXPLICACIÓN DEL FLUJO:
 * 1. Usuario sube imagen desde frontend
 * 2. Multer la recibe y la pone en req.file.buffer (RAM)
 * 3. Esta función toma ese buffer y lo sube a Cloudinary
 * 4. Cloudinary devuelve una URL pública
 * 5. Guardamos esa URL en nuestra BD
 * 6. El buffer se elimina de RAM automáticamente
 */
const uploadToCloudinary = (buffer, folder = 'book-club/avatars') => {
  return new Promise((resolve, reject) => {
    // upload_stream: subir desde un buffer (no desde archivo en disco)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        // Transformaciones automáticas:
        transformation: [
          { width: 500, height: 500, crop: 'fill' }, // Cuadrado de 500x500
          { quality: 'auto' }, // Cloudinary elige la mejor calidad
          { fetch_format: 'auto' } // Cloudinary elige el mejor formato (WebP si el navegador lo soporta)
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url, // URL HTTPS de la imagen
            publicId: result.public_id // ID para eliminarla después si es necesario
          });
        }
      }
    );

    // Escribir el buffer al stream de Cloudinary
    uploadStream.end(buffer);
  });
};

/**
 * FUNCIÓN: Eliminar imagen de Cloudinary
 * 
 * @param {String} publicId - ID público de la imagen en Cloudinary
 * 
 * USO:
 * Cuando un usuario cambia su avatar, eliminamos el anterior
 * para no acumular archivos basura en Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // No lanzar error, solo loguearlo
    // Si falla la eliminación, no es crítico
  }
};

/**
 * AVATARES PREDETERMINADOS
 * Lista de avatares que el usuario puede elegir sin subir imagen
 * 
 * IMPLEMENTACIÓN:
 * 1. Guardar estas imágenes en /public/avatars/
 * 2. O subirlas a Cloudinary manualmente
 * 3. El usuario elige uno y guardamos el nombre en defaultAvatar
 */
const defaultAvatars = [
  'avatar_01.png',
  'avatar_02.png',
  'avatar_03.png',
  'avatar_04.png',
  'avatar_05.png',
  'avatar_06.png',
  'avatar_07.png',
  'avatar_08.png'
];

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  defaultAvatars
};