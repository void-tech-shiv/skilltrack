import { prisma } from './src/lib/prisma';
import bcrypt from 'bcrypt';

async function seedPending() {
  const ts = Date.now();
  const t1 = await prisma.trainee.create({
    data: {
      canonicalId: `MAHA-TRN-LIVE-${ts}-1`,
      firstName: 'Aarav',
      lastName: 'Kulkarni',
      dob: new Date('2000-03-12'),
      gender: 'MALE',
      phone: '9820199881',
      aadhaarNumber: '998811223344',
      apaarAbcId: 'APAAR99881122',
      educationLevel: 'GRADUATE',
      category: 'OBC',
      skills: 'Full Stack Development, Cloud Computing',
      careerGoals: 'Senior Software Engineer'
    }
  });

  const u1 = await prisma.user.create({
    data: {
      email: `aarav.kulkarni.${ts}@gmail.com`,
      passwordHash: await bcrypt.hash('Password@123', 10),
      role: 'TRAINEE',
      status: 'PENDING',
      traineeId: t1.id
    }
  });

  const t2 = await prisma.trainee.create({
    data: {
      canonicalId: `MAHA-TRN-LIVE-${ts}-2`,
      firstName: 'Ananya',
      lastName: 'Shinde',
      dob: new Date('2001-07-24'),
      gender: 'FEMALE',
      phone: '9830299772',
      aadhaarNumber: '997722334455',
      apaarAbcId: 'APAAR99772233',
      educationLevel: 'POST_GRADUATE',
      category: 'GENERAL',
      skills: 'Data Science, Machine Learning',
      careerGoals: 'AI Research Scientist'
    }
  });

  const u2 = await prisma.user.create({
    data: {
      email: `ananya.shinde.${ts}@gmail.com`,
      passwordHash: await bcrypt.hash('Password@123', 10),
      role: 'TRAINEE',
      status: 'PENDING',
      traineeId: t2.id
    }
  });

  console.log(`Seeded 2 live pending learners successfully: ${u1.email}, ${u2.email}`);
}

seedPending().finally(() => prisma.$disconnect());
