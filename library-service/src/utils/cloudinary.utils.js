// library-service/src/utils/cloudinary.utils.js

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Agregar verificación de configuración
console.log('☁️ Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
});

// Configurar Multer para guardar en memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Aceptar portadas (imágenes)
    if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes para la portada'));
      }
    }
    // Aceptar PDF
    else if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF'));
      }
    }
    // Aceptar EPUB
    else if (file.fieldname === 'epub') {
      if (
        file.mimetype === 'application/epub+zip' ||
        file.originalname.endsWith('.epub')
      ) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos EPUB'));
      }
    } else {
      cb(null, true);
    }
  },
});

/**
 * Subir portada de libro a Cloudinary
 */
async function uploadBookCover(buffer, bookId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `book-club/covers`,
        public_id: `book_${bookId}_cover`,
        resource_type: 'image',
        format: 'jpg',
        transformation: [
          { width: 600, height: 900, crop: 'limit' },
          { quality: 'auto:good' },
        ],
        access_mode: 'public',
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary cover upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cover uploaded:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Subir archivo PDF/EPUB a Cloudinary
 */
async function uploadBookFile(buffer, bookId, fileType) {
  return new Promise((resolve, reject) => {
    const extension = fileType.toLowerCase(); //pdf o epub

    const filename = `book_${bookId}.${extension}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `book-club/files`,
        public_id: filename, // Usamos el nombre con punto
        resource_type: 'raw', // Usar 'raw' para archivos no-imagen
        access_mode: 'public',
        use_filename: true,   // Usar el nombre de archivo especificado
        unique_filename: false, // No agregar caracteres aleatorios
        format: extension // Forzar formato
        
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Cloudinary ${fileType} upload error:`, error);
          reject(error);
        } else {
          // Forzamos que la URL tenga la extensión si Cloudinary no la puso
          let secureUrl = result.secure_url;
          if (!secureUrl.endsWith(`.${extension}`)) {
             // A veces raw resource type no pone extension, aseguramos que la URL sirva
             // Pero con use_filename y public_id debería bastar.
             console.log(`⚠️ URL generated without extension: ${secureUrl}`);
          }
          console.log(`✅ ${fileType} uploaded:`, secureUrl);
          resolve(secureUrl);
        }
      }
    );

    uploadStream.end(buffer);
  });
}



module.exports = {
  upload,
  uploadBookCover,
  uploadBookFile,
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