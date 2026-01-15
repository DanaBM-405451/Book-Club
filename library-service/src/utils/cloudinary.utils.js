
// library-service/src/utils/cloudinary.utils.js

const path = require('path');
// Aseguramos carga de .env por si acaso
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

// Configuración Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 600000,
});

// Configuración Multer (Disk Storage)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Limpiamos el nombre original de caracteres raros
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + cleanName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/**
 * Función robusta para subir a Cloudinary (Compatible con Windows)
 */
async function uploadToCloudinary(filePath, folder, resourceType) {
  return new Promise((resolve, reject) => {
    
    // 1. SANITIZACIÓN DE RUTA (Windows Fix) 🧹
    // Convertimos backslashes a slashes y resolvemos la ruta absoluta
    const absolutePath = path.resolve(filePath);
    
    console.log(`📤 Preparando subida (${resourceType})...`);
    console.log(`   - Ruta original: ${filePath}`);
    console.log(`   - Ruta absoluta: ${absolutePath}`);

    // 2. VERIFICACIÓN DE EXISTENCIA 🕵️‍♂️
    if (!fs.existsSync(absolutePath)) {
        console.error("❌ ERROR CRÍTICO: El archivo no existe en disco:", absolutePath);
        return reject(new Error(`File not found at ${absolutePath}`));
    }

    // 3. SUBIDA
    cloudinary.uploader.upload(
      absolutePath, 
      {
        folder: folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: false,
        timeout: 600000
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Cloudinary Error Detallado:`, error);
          reject(error);
        } else {
          console.log(`✅ Subida exitosa: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      }
    );
  });
}

// Wrappers
async function uploadBookCover(filePath, bookId) {
    return await uploadToCloudinary(filePath, 'book-club/covers', 'image');
}

async function uploadBookFile(filePath, bookId, fileType) {
    return await uploadToCloudinary(filePath, 'book-club/files', 'raw');
}

module.exports = { upload, uploadBookCover, uploadBookFile };

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