import { PrismaClient, Papel } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { nome: 'Empresa Demo', slug: 'demo' },
  });

  const senhaHash = await hash('Admin@123');

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Admin Demo',
      email: 'admin@demo.com',
      senhaHash,
      papel: Papel.SUPER_ADMIN,
    },
  });

  console.log('✔ Seed concluído');
  console.log('  Tenant: demo');
  console.log('  Login:  admin@demo.com / Admin@123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
