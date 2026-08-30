import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating all accounts to @gmail.com with password PS135 ---');

  const passwordHash = await bcrypt.hash('PS135', 10);

  // 1. Ensure organizations exist
  let govOrg = await prisma.organization.findFirst({ where: { type: 'GOVERNMENT' } });
  if (!govOrg) {
    govOrg = await prisma.organization.create({
      data: { name: 'Maharashtra State Innovation Society', type: 'GOVERNMENT', status: 'ACTIVE' }
    });
  }

  let providerOrg = await prisma.organization.findFirst({ where: { type: 'TRAINING_PROVIDER' } });
  if (!providerOrg) {
    providerOrg = await prisma.organization.create({
      data: { name: 'Pune Skill Institute', type: 'TRAINING_PROVIDER', status: 'ACTIVE' }
    });
  }

  let employerOrg = await prisma.organization.findFirst({ where: { type: 'EMPLOYER' } });
  if (!employerOrg) {
    employerOrg = await prisma.organization.create({
      data: { name: 'Tata Motors Pune', type: 'EMPLOYER', status: 'ACTIVE' }
    });
  }

  // 2. Ensure distinct trainers exist for trainer@ and teacher@
  const getOrCreateTrainer = async (name: string, email: string, phone: string) => {
    let t = await prisma.trainer.findUnique({ where: { email } });
    if (!t) {
      t = await prisma.trainer.create({
        data: {
          name,
          email,
          specialization: 'Electric Vehicle & Industrial Automation',
          phone,
          status: 'APPROVED',
          organizationId: providerOrg!.id
        }
      });
    }
    return t;
  };

  const trainer1 = await getOrCreateTrainer('Rajesh Sharma', 'trainer@gmail.com', '9822012345');
  const trainer2 = await getOrCreateTrainer('Anjali Verma', 'teacher@gmail.com', '9822012346');

  // 3. Ensure distinct trainees exist for learner@ and trainee@
  const getOrCreateTrainee = async (canonicalId: string, firstName: string, lastName: string, phone: string) => {
    let t = await prisma.trainee.findUnique({ where: { canonicalId } });
    if (!t) {
      t = await prisma.trainee.create({
        data: {
          canonicalId,
          firstName,
          lastName,
          dob: new Date('2002-05-15'),
          gender: 'MALE',
          phone,
          district: 'Pune',
          division: 'Pune Division',
          educationLevel: 'Graduate',
          category: 'General',
          skills: 'EV Battery, Mechanical Diagnostics, Electrical Circuits',
          careerGoals: 'EV Diagnostic Engineer',
          consentStatus: true,
          consentDate: new Date()
        }
      });
    }
    return t;
  };

  const trainee1 = await getOrCreateTrainee('MS-2026-PUN-0001', 'Aarav', 'Patil', '9822099991');
  const trainee2 = await getOrCreateTrainee('MS-2026-PUN-0002', 'Neha', 'Kulkarni', '9822099992');

  // 4. Upsert function that handles trainerId / traineeId unique constraints
  const upsertUser = async (email: string, role: string, orgId?: string | null, trainerId?: string | null, traineeId?: string | null) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: role as any,
          status: 'ACTIVE',
          emailVerified: true,
          organizationId: orgId || null,
          trainerId: trainerId || existing.trainerId,
          traineeId: traineeId || existing.traineeId
        }
      });
      console.log(`Updated: ${email} (${role}) -> password: PS135`);
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: role as any,
          status: 'ACTIVE',
          emailVerified: true,
          organizationId: orgId || null,
          trainerId: trainerId || null,
          traineeId: traineeId || null
        }
      });
      console.log(`Created: ${email} (${role}) -> password: PS135`);
    }
  };

  // Upsert all @gmail.com accounts
  await upsertUser('admin@gmail.com', 'GOVERNMENT_ADMIN', govOrg.id);
  await upsertUser('coursemanager@gmail.com', 'COURSE_MANAGER', govOrg.id);
  await upsertUser('courcemanager@gmail.com', 'COURSE_MANAGER', govOrg.id);
  await upsertUser('provider@gmail.com', 'TRAINING_PROVIDER', providerOrg.id);
  await upsertUser('trainer@gmail.com', 'TRAINER', providerOrg.id, trainer1.id);
  await upsertUser('teacher@gmail.com', 'TRAINER', providerOrg.id, trainer2.id);
  await upsertUser('analyst@gmail.com', 'ANALYST', govOrg.id);
  await upsertUser('employer@gmail.com', 'EMPLOYER', employerOrg.id);
  await upsertUser('learner@gmail.com', 'TRAINEE', null, null, trainee1.id);
  await upsertUser('trainee@gmail.com', 'TRAINEE', null, null, trainee2.id);

  // Also update existing users' password to PS135
  await prisma.user.updateMany({
    data: {
      passwordHash,
      status: 'ACTIVE'
    }
  });

  console.log('\n--- All user accounts successfully synchronized with password PS135! ---');
}

main()
  .catch(e => {
    console.error('Error updating accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
