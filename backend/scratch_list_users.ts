import { prisma } from './src/lib/prisma';

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      traineeId: true,
      trainerId: true,
      trainee: { select: { firstName: true, lastName: true } }
    },
    orderBy: { role: 'asc' }
  });
  console.log(JSON.stringify(users, null, 2));
}

listUsers().finally(() => prisma.$disconnect());
