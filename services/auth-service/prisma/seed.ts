import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Seed script to create initial admin user
 * 
 * Usage:
 *   npx ts-node prisma/seed.ts
 *   or
 *   npx prisma db seed
 */
async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mediamesh.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

  console.log('🌱 Seeding database...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user created:`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   ID: ${admin.id}`);
  console.log(`\n⚠️  Default credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n🔒 Please change the default password after first login!`);
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
