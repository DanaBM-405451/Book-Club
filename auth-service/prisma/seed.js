// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookclub.com' },
    update: {},
    create: {
      email: 'admin@bookclub.com',
      username: 'admin',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@bookclub.com' },
    update: {},
    create: {
      email: 'user@bookclub.com',
      username: 'usertest',
      password: hashedPasswordUser,
      role: 'USER',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('Admin created:', admin);
  console.log('User created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });