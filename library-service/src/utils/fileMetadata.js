const EPub = require('epub');
const fs = require('fs'); // Usamos fs normal para stat
const fsPromises = require('fs').promises; // Usamos promises para readFile
const pdfParse = require('pdf-parse');

/**
 * 1. Extraer metadatos de PDF
 */
const extractPdfMetadata = async (filePath) => {
  try {
    const dataBuffer = await fsPromises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return {
      title: data.info?.Title || null,
      author: data.info?.Author || null,
      pageCount: data.numpages || 0, // PDF sí tiene páginas reales
      description: null
    };
  } catch (error) {
    console.error("⚠️ Error leyendo PDF:", error.message);
    return { title: null, pageCount: 0 };
  }
};

/**
 * 2. Extraer metadatos de EPUB (Con estimación de páginas)
 */
const extractEpubMetadata = async (filePath) => {
  console.log("📖 Analizando EPUB:", filePath);

  // A. ESTIMACIÓN DE PÁGINAS (CRÍTICO PARA LA BARRA DE PROGRESO)
  // Como EPUB no tiene páginas, calculamos: 1 pág aprox cada 2.5KB de texto comprimido.
  let estimatedPages = 0;
  try {
      const stats = fs.statSync(filePath);
      const fileSizeInKb = stats.size / 1024;
      estimatedPages = Math.ceil(fileSizeInKb / 2.5); 
      // Ajuste de seguridad: Mínimo 50, Máximo 1500
      if (estimatedPages < 50) estimatedPages = 50;
      if (estimatedPages > 1500) estimatedPages = 1500;
  } catch (e) {
      console.warn("⚠️ No se pudo calcular tamaño del archivo");
  }

  // B. LECTURA DE METADATOS REALES (Título, Autor)
  return new Promise((resolve) => {
    const epub = new EPub(filePath);

    epub.on("error", (err) => {
      console.error("❌ Error librería EPUB:", err);
      // Si falla, devolvemos al menos las páginas estimadas
      resolve({ 
          title: null, 
          author: null, 
          pageCount: estimatedPages,
          description: null
      });
    });

    epub.on("end", () => {
      // Intentamos obtener metadatos limpios
      const title = epub.metadata.title || null;
      const author = epub.metadata.creator || epub.metadata.creatorFileAs || null;
      const description = epub.metadata.description || null;

      console.log("✅ Datos encontrados:", { title, author, pages: estimatedPages });

      // TODO: Extraer portada es complejo porque devuelve un buffer que hay que subir
      // Por ahora nos centramos en que texto y páginas funcionen.

      resolve({
        title: title,
        author: author,
        description: description,
        pageCount: estimatedPages, // ¡Aquí va el número mágico!
      });
    });

    epub.parse();
  });
};

/**
 * Helper para borrar archivos
 */
const cleanupTempFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
    }
  } catch (error) {
    console.error('⚠️ Error eliminando temp:', error.message);
  }
};

const normalizeMetadata = (meta) => {
    return {
        titulo: meta.title || null,
        autor: meta.author || null,
        descripcion: meta.description || null,
        pageCount: meta.pageCount || 0
    };
};

module.exports = { extractPdfMetadata, extractEpubMetadata, cleanupTempFile, normalizeMetadata };