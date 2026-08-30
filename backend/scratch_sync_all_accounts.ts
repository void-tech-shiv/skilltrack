import { prisma } from './src/lib/prisma';
import bcrypt from 'bcrypt';

async function ensureAllRoles() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Trainer
  const trainer = await prisma.trainer.findFirst();
  if (trainer) {
    const trainerUser = await prisma.user.upsert({
      where: { email: 'trainer@maha.gov.in' },
      update: { passwordHash, status: 'ACTIVE', role: 'TRAINER', trainerId: trainer.id },
      create: {
        email: 'trainer@maha.gov.in',
        passwordHash,
        role: 'TRAINER',
        status: 'ACTIVE',
        trainerId: trainer.id,
        organizationId: trainer.organizationId
      }
    });
    console.log('✅ Trainer user synced:', trainerUser.email);
  }

  // 2. Learner
  const trainee = await prisma.trainee.findFirst({
    where: { canonicalId: 'TR-1001' }
  }) || await prisma.trainee.findFirst();

  if (trainee) {
    const learnerUser = await prisma.user.upsert({
      where: { email: 'learner@maha.gov.in' },
      update: { passwordHash, status: 'ACTIVE', role: 'TRAINEE', traineeId: trainee.id },
      create: {
        email: 'learner@maha.gov.in',
        passwordHash,
        role: 'TRAINEE',
        status: 'ACTIVE',
        traineeId: trainee.id
      }
    });
    console.log('✅ Learner user synced:', learnerUser.email, 'Linked to Trainee ID:', trainee.canonicalId);
  }

  // Ensure all existing roles have password123
  const accounts = [
    { email: 'admin@maha.gov.in', role: 'GOVERNMENT_ADMIN' },
    { email: 'coursemanager@maha.gov.in', role: 'COURSE_MANAGER' },
    { email: 'provider@maha.gov.in', role: 'TRAINING_PROVIDER' },
    { email: 'employer@maha.gov.in', role: 'EMPLOYER' },
    { email: 'analyst@maha.gov.in', role: 'ANALYST' }
  ];

  for (const acc of accounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { passwordHash, status: 'ACTIVE', role: acc.role },
      create: { email: acc.email, passwordHash, role: acc.role, status: 'ACTIVE' }
    });
    console.log('✅ Account confirmed:', acc.email, 'Role:', acc.role);
  }

  const all = await prisma.user.findMany({
    select: { email: true, role: true, status: true }
  });
  console.log('\n--- ALL ACCOUNTS IN DATABASE ---');
  console.table(all);
}

ensureAllRoles().finally(() => prisma.$disconnect());
