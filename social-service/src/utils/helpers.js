// social-service/src/utils/helpers.js

/**
 * Calcular porcentaje de progreso
 */
const calculateProgress = (currentPage, totalPages) => {
  if (!totalPages || totalPages === 0) return 0;
  const progress = (currentPage / totalPages) * 100;
  return parseFloat(Math.min(100, Math.max(0, progress)).toFixed(2)); // ✅ 2 decimales
};

/**
 * Formatear fecha para MySQL
 */
const formatDateForMySQL = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Verificar si una fecha está en el pasado
 */
const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Verificar si una fecha está en el futuro
 */
const isDateInFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Calcular puntos por progreso en reto
 * @param {number} progressPercent - Porcentaje de progreso (0-100)
 * @param {number} totalPages - Total de páginas del libro
 * @returns {number} - Puntos XP
 */
const calculateChallengePoints = (progressPercent, totalPages) => {
  // Base: 1 punto por cada 10 páginas
  const basePoints = Math.floor(totalPages / 10);
  
  // Bonus por completar
  const completionBonus = progressPercent >= 100 ? 50 : 0;
  
  // Bonus por progreso
  const progressBonus = Math.floor(progressPercent / 10) * 5;
  
  return basePoints + completionBonus + progressBonus;
};

/**
 * Generar metadata para notificaciones
 */
const createNotificationMetadata = (type, data) => {
  const metadata = {
    type,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  return JSON.stringify(metadata);
};

/**
 * Parsear metadata de notificaciones
 */
const parseNotificationMetadata = (metadataString) => {
  try {
    return JSON.parse(metadataString);
  } catch (error) {
    return null;
  }
};

/**
 * Sanitizar texto (remover HTML, caracteres especiales)
 */
const sanitizeText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remover HTML tags
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
};

/**
 * Generar slug de texto
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Múltiples guiones a uno solo
};

/**
 * Obtener rango de fechas para frecuencia de lectura
 */
const getDateRangeForFrequency = (frequency, startDate) => {
  const start = new Date(startDate);
  let end = new Date(start);
  
  switch (frequency) {
    case 'WEEKLY':
      end.setDate(end.getDate() + 7);
      break;
    case 'BIWEEKLY':
      end.setDate(end.getDate() + 14);
      break;
    case 'MONTHLY':
      end.setMonth(end.getMonth() + 1);
      break;
    default:
      end.setDate(end.getDate() + 7);
  }
  
  return { start, end };
};

/**
 * Verificar si el reto ha finalizado
 */
const isChallengeEnded = (endDate) => {
  return new Date(endDate) < new Date();
};

/**
 * Calcular promedio de progreso de participantes
 */
const calculateAverageProgress = (participants) => {
  if (!participants || participants.length === 0) return 0;
  
  const sum = participants.reduce((acc, p) => acc + parseFloat(p.progressPercent), 0);
  return parseFloat((sum / participants.length).toFixed(2)); // ✅ 2 decimales
};

/**
 * Generar ranking por progreso
 */
const generateRanking = (participants) => {
  return participants
    .sort((a, b) => {
      // Primero por completado
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }
      // Luego por porcentaje de progreso
      if (parseFloat(b.progressPercent) !== parseFloat(a.progressPercent)) {
        return parseFloat(b.progressPercent) - parseFloat(a.progressPercent);
      }
      // Finalmente por fecha de última actualización (más reciente primero)
      return new Date(b.updatedAt) - new Date(a.updatedAt); // ✅ Corregido a updatedAt
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));
};

/**
 * Crear respuesta paginada
 */
const createPaginatedResponse = (data, page, limit, total) => {
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  
  return {
    success: true, // ✅ Agregar success
    data,
    pagination: {
      page: currentPage,
      limit: itemsPerPage,
      total,
      totalPages: Math.ceil(total / itemsPerPage),
      hasNextPage: currentPage * itemsPerPage < total,
      hasPrevPage: currentPage > 1,
    },
  };
};

/**
 * Validar si un string es un número entero válido
 */
const isValidInteger = (value) => {
  return !isNaN(value) && Number.isInteger(Number(value)) && Number(value) > 0;
};

module.exports = {
  calculateProgress,
  formatDateForMySQL,
  isDateInPast,
  isDateInFuture,
  calculateChallengePoints,
  createNotificationMetadata,
  parseNotificationMetadata,
  sanitizeText,
  generateSlug,
  getDateRangeForFrequency,
  isChallengeEnded,
  calculateAverageProgress,
  generateRanking,
  createPaginatedResponse,
  isValidInteger,
};

/**
 * Calcular porcentaje de progreso
 */
/*
const calculateProgress = (currentPage, totalPages) => {
  if (!totalPages || totalPages === 0) return 0;
  const progress = (currentPage / totalPages) * 100;
  return Math.min(100, Math.max(0, progress));
};

/**
 * Formatear fecha para MySQL
 */
/*
const formatDateForMySQL = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Verificar si una fecha está en el pasado
 */
/*
const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Verificar si una fecha está en el futuro
 */
/*
const isDateInFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Calcular puntos por progreso en reto
 * @param {number} progressPercent - Porcentaje de progreso (0-100)
 * @param {number} totalPages - Total de páginas del libro
 * @returns {number} - Puntos XP
 */
/*
const calculateChallengePoints = (progressPercent, totalPages) => {
  // Base: 1 punto por cada 10 páginas
  const basePoints = Math.floor(totalPages / 10);
  
  // Bonus por completar
  const completionBonus = progressPercent >= 100 ? 50 : 0;
  
  // Bonus por progreso
  const progressBonus = Math.floor(progressPercent / 10) * 5;
  
  return basePoints + completionBonus + progressBonus;
};

/**
 * Generar metadata para notificaciones
 */
/*
const createNotificationMetadata = (type, data) => {
  const metadata = {
    type,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  return JSON.stringify(metadata);
};

/**
 * Parsear metadata de notificaciones
 */
/*
const parseNotificationMetadata = (metadataString) => {
  try {
    return JSON.parse(metadataString);
  } catch (error) {
    return null;
  }
};

/**
 * Sanitizar texto (remover HTML, caracteres especiales)
 */
/*
const sanitizeText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remover HTML tags
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
};

/**
 * Generar slug de texto
 */
/*
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Múltiples guiones a uno solo
};

/**
 * Obtener rango de fechas para frecuencia de lectura
 */
/*
const getDateRangeForFrequency = (frequency, startDate) => {
  const start = new Date(startDate);
  let end = new Date(start);
  
  switch (frequency) {
    case 'WEEKLY':
      end.setDate(end.getDate() + 7);
      break;
    case 'BIWEEKLY':
      end.setDate(end.getDate() + 14);
      break;
    case 'MONTHLY':
      end.setMonth(end.getMonth() + 1);
      break;
    default:
      end.setDate(end.getDate() + 7);
  }
  
  return { start, end };
};

/**
 * Verificar si el reto ha finalizado
 */
/*
const isChallengeEnded = (endDate) => {
  return new Date(endDate) < new Date();
};

/**
 * Calcular promedio de progreso de participantes
 */
/*
const calculateAverageProgress = (participants) => {
  if (!participants || participants.length === 0) return 0;
  
  const sum = participants.reduce((acc, p) => acc + parseFloat(p.progressPercent), 0);
  return sum / participants.length;
};

/**
 * Generar ranking por progreso
 */
/*
const generateRanking = (participants) => {
  return participants
    .sort((a, b) => {
      // Primero por completado
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? -1 : 1;
      }
      // Luego por porcentaje de progreso
      if (parseFloat(b.progressPercent) !== parseFloat(a.progressPercent)) {
        return parseFloat(b.progressPercent) - parseFloat(a.progressPercent);
      }
      // Finalmente por fecha de última actualización (más reciente primero)
      return new Date(a.lastUpdateAt) - new Date(b.lastUpdateAt);
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));
};

/**
 * Crear respuesta paginada
 */
/*
const createPaginatedResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Validar UUID
 */
/*
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

module.exports = {
  calculateProgress,
  formatDateForMySQL,
  isDateInPast,
  isDateInFuture,
  calculateChallengePoints,
  createNotificationMetadata,
  parseNotificationMetadata,
  sanitizeText,
  generateSlug,
  getDateRangeForFrequency,
  isChallengeEnded,
  calculateAverageProgress,
  generateRanking,
  createPaginatedResponse,
  isValidUUID,
};
*/