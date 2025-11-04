const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const achievements = [
  // READING - Páginas leídas
  {
    key: 'first_page',
    name: '📖 Primera Página',
    description: 'Lee tu primera página',
    icon: '📖',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 1 }),
    xpReward: 10,
    rarity: 'COMMON',
  },
  {
    key: 'pages_100',
    name: '📚 Centenario',
    description: 'Lee 100 páginas',
    icon: '📚',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 100 }),
    xpReward: 50,
    rarity: 'COMMON',
  },
  {
    key: 'pages_500',
    name: '🎯 Lector Dedicado',
    description: 'Lee 500 páginas',
    icon: '🎯',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 500 }),
    xpReward: 100,
    rarity: 'UNCOMMON',
  },
  {
    key: 'pages_1000',
    name: '⭐ Mil Páginas',
    description: 'Lee 1,000 páginas',
    icon: '⭐',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 1000 }),
    xpReward: 200,
    rarity: 'RARE',
  },
  {
    key: 'pages_5000',
    name: '🏆 Maestro Lector',
    description: 'Lee 5,000 páginas',
    icon: '🏆',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 5000 }),
    xpReward: 500,
    rarity: 'EPIC',
  },
  {
    key: 'pages_10000',
    name: '👑 Leyenda Literaria',
    description: 'Lee 10,000 páginas',
    icon: '👑',
    category: 'READING',
    requirement: JSON.stringify({ pagesRead: 10000 }),
    xpReward: 1000,
    rarity: 'LEGENDARY',
  },

  // COLLECTION - Libros terminados
  {
    key: 'first_book',
    name: '📕 Primer Libro',
    description: 'Termina tu primer libro',
    icon: '📕',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 1 }),
    xpReward: 25,
    rarity: 'COMMON',
  },
  {
    key: 'books_5',
    name: '📗 Pequeña Biblioteca',
    description: 'Termina 5 libros',
    icon: '📗',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 5 }),
    xpReward: 75,
    rarity: 'COMMON',
  },
  {
    key: 'books_10',
    name: '📘 Coleccionista',
    description: 'Termina 10 libros',
    icon: '📘',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 10 }),
    xpReward: 150,
    rarity: 'UNCOMMON',
  },
  {
    key: 'books_25',
    name: '📙 Biblioteca Personal',
    description: 'Termina 25 libros',
    icon: '📙',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 25 }),
    xpReward: 300,
    rarity: 'RARE',
  },
  {
    key: 'books_50',
    name: '🎓 Erudito',
    description: 'Termina 50 libros',
    icon: '🎓',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 50 }),
    xpReward: 600,
    rarity: 'EPIC',
  },
  {
    key: 'books_100',
    name: '🌟 Bibliófilo',
    description: 'Termina 100 libros',
    icon: '🌟',
    category: 'READING',
    requirement: JSON.stringify({ booksRead: 100 }),
    xpReward: 1200,
    rarity: 'LEGENDARY',
  },

  // STREAK - Racha de lectura
  {
    key: 'streak_3',
    name: '🔥 En Racha',
    description: 'Lee 3 días consecutivos',
    icon: '🔥',
    category: 'STREAK',
    requirement: JSON.stringify({ streak: 3 }),
    xpReward: 30,
    rarity: 'COMMON',
  },
  {
    key: 'streak_7',
    name: '🌟 Una Semana',
    description: 'Lee 7 días consecutivos',
    icon: '🌟',
    category: 'STREAK',
    requirement: JSON.stringify({ streak: 7 }),
    xpReward: 70,
    rarity: 'UNCOMMON',
  },
  {
    key: 'streak_30',
    name: '💪 Un Mes Completo',
    description: 'Lee 30 días consecutivos',
    icon: '💪',
    category: 'STREAK',
    requirement: JSON.stringify({ streak: 30 }),
    xpReward: 300,
    rarity: 'RARE',
  },
  {
    key: 'streak_100',
    name: '🚀 Imparable',
    description: 'Lee 100 días consecutivos',
    icon: '🚀',
    category: 'STREAK',
    requirement: JSON.stringify({ streak: 100 }),
    xpReward: 1000,
    rarity: 'EPIC',
  },
  {
    key: 'streak_365',
    name: '💎 Dedicación Absoluta',
    description: 'Lee 365 días consecutivos',
    icon: '💎',
    category: 'STREAK',
    requirement: JSON.stringify({ streak: 365 }),
    xpReward: 3650,
    rarity: 'LEGENDARY',
  },

  // LEVEL - Niveles alcanzados
  {
    key: 'level_5',
    name: '⬆️ Nivel 5',
    description: 'Alcanza el nivel 5',
    icon: '⬆️',
    category: 'READING',
    requirement: JSON.stringify({ level: 5 }),
    xpReward: 50,
    rarity: 'COMMON',
  },
  {
    key: 'level_10',
    name: '⏫ Nivel 10',
    description: 'Alcanza el nivel 10',
    icon: '⏫',
    category: 'READING',
    requirement: JSON.stringify({ level: 10 }),
    xpReward: 100,
    rarity: 'UNCOMMON',
  },
  {
    key: 'level_25',
    name: '🎖️ Nivel 25',
    description: 'Alcanza el nivel 25',
    icon: '🎖️',
    category: 'READING',
    requirement: JSON.stringify({ level: 25 }),
    xpReward: 250,
    rarity: 'RARE',
  },
  {
    key: 'level_50',
    name: '🏅 Nivel 50',
    description: 'Alcanza el nivel 50',
    icon: '🏅',
    category: 'READING',
    requirement: JSON.stringify({ level: 50 }),
    xpReward: 500,
    rarity: 'EPIC',
  },
];

async function seedAchievements() {
  console.log('🌱 Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ ${achievements.length} achievements seeded successfully!`);
}

seedAchievements()
  .catch((e) => {
    console.error('Error seeding achievements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });