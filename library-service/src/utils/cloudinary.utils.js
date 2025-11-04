// library-service/src/utils/cloudinary.utils.js

// library-service/src/utils/cloudinary.utils.js

const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Subir portada de libro
 * @param {String} base64Image - Imagen en base64
 * @param {String} bookId - ID del libro
 * @returns {Promise<String>} - URL de la portada
 */
async function uploadBookCover(base64Image, bookId) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'book-club/covers',
      public_id: `cover_${bookId}`,
      transformation: [
        { width: 600, height: 900, crop: 'fill' }, // Aspect ratio de libro
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    console.log('✅ Book cover uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading book cover:', error);
    throw new Error('Error al subir portada del libro');
  }
}

/**
 * Subir archivo PDF/EPUB
 * @param {String} base64File - Archivo en base64
 * @param {String} bookId - ID del libro
 * @param {String} fileType - 'pdf' o 'epub'
 * @returns {Promise<String>} - URL del archivo
 */
async function uploadBookFile(base64File, bookId, fileType) {
  try {
    const result = await cloudinary.uploader.upload(base64File, {
      folder: `book-club/books`,
      public_id: `book_${bookId}`,
      resource_type: 'raw', // Para archivos no-imagen
      format: fileType.toLowerCase(),
    });

    console.log(`✅ ${fileType.toUpperCase()} file uploaded to Cloudinary:`, result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading book file:', error);
    throw new Error(`Error al subir archivo ${fileType.toUpperCase()}`);
  }
}

/**
 * Eliminar imagen de Cloudinary
 * @param {String} publicId - ID público de la imagen
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw new Error('Error al eliminar imagen');
  }
}

module.exports = {
  cloudinary,
  uploadBookCover,
  uploadBookFile,
  deleteImage,
};

/*
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de Multer (almacenamiento en memoria)
const storage = multer.memoryStorage();

// Filtro para PDFs
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

// Filtro para imágenes (portadas)
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'), false);
  }
};

// Multer para PDFs (máximo 50MB)
const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
});

// Multer para portadas (máximo 5MB)
const uploadCover = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

/**
 * Subir PDF a Cloudinary
 * @param {Buffer} buffer - Contenido del archivo
 * @param {string} fileName - Nombre original del archivo
 * @returns {Promise<{url: string, publicId: string, bytes: number}>}
 */

/*
const uploadPDFToCloudinary = (buffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'book-club/pdfs',
        resource_type: 'raw', // 'raw' para PDFs (no 'image')
        public_id: `pdf_${Date.now()}`,
        format: 'pdf',
      },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
          });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Subir portada a Cloudinary
 * @param {Buffer} buffer - Contenido de la imagen
 * @returns {Promise<{url: string, publicId: string}>}
 */

/*
const uploadCoverToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'book-club/covers',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 1200, crop: 'fill' }, // Tamaño estándar de portada
          { quality: 'auto' },
          { fetch_format: 'auto' }, // WebP si el navegador lo soporta
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Eliminar archivo de Cloudinary
 * @param {string} publicId - ID público del archivo
 * @param {string} resourceType - Tipo de recurso ('raw' para PDF, 'image' para portadas)
 * @returns {Promise<void>}
 */

/*
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`✓ Archivo eliminado de Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('✗ Error al eliminar de Cloudinary:', error.message);
    // No lanzar error para no fallar la operación principal
  }
};

module.exports = {
  uploadPDF,
  uploadCover,
  uploadPDFToCloudinary,
  uploadCoverToCloudinary,
  deleteFromCloudinary,
};

*/