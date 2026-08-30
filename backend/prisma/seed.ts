import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Comprehensive Production Database for All 7 Roles ---');

  // Clean old records
  await prisma.auditLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.consentLog.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateApplication.deleteMany();
  await prisma.evidenceSubmission.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.module.deleteMany();
  await prisma.providerCourseAuthorization.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.user.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.trainee.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash('PS135', 10);

  // 1. Create Organizations
  const govOrg = await prisma.organization.create({
    data: { name: 'Maharashtra State Innovation Society', type: 'GOVERNMENT', status: 'ACTIVE' }
  });

  const provider1 = await prisma.organization.create({
    data: { name: 'Pune Skill Institute', type: 'TRAINING_PROVIDER', status: 'ACTIVE' }
  });

  const provider2 = await prisma.organization.create({
    data: { name: 'Tech Academy Mumbai', type: 'TRAINING_PROVIDER', status: 'ACTIVE' }
  });

  const employer1 = await prisma.organization.create({
    data: { name: 'Tata Motors Pune', type: 'EMPLOYER', status: 'ACTIVE' }
  });

  const employer2 = await prisma.organization.create({
    data: { name: 'Mahindra Tech Solutions', type: 'EMPLOYER', status: 'ACTIVE' }
  });

  // 2. Create Trainers
  const trainer1 = await prisma.trainer.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'trainer@gmail.com',
      phone: '9820011223',
      organizationId: provider1.id,
      status: 'APPROVED',
      specialization: 'EV Battery Diagnostics & Automation'
    }
  });

  const trainer2 = await prisma.trainer.create({
    data: {
      name: 'Amit Deshmukh',
      email: 'teacher@gmail.com',
      phone: '9830022334',
      organizationId: provider2.id,
      status: 'APPROVED',
      specialization: 'Data Analytics & Full Stack'
    }
  });

  // 3. Create Users for all roles with @gmail.com and password PS135
  const userSeeds = [
    { email: 'admin@gmail.com', role: 'GOVERNMENT_ADMIN', orgId: govOrg.id, trainerId: null },
    { email: 'coursemanager@gmail.com', role: 'COURSE_MANAGER', orgId: govOrg.id, trainerId: null },
    { email: 'courcemanager@gmail.com', role: 'COURSE_MANAGER', orgId: govOrg.id, trainerId: null },
    { email: 'provider@gmail.com', role: 'TRAINING_PROVIDER', orgId: provider1.id, trainerId: null },
    { email: 'trainer@gmail.com', role: 'TRAINER', orgId: provider1.id, trainerId: trainer1.id },
    { email: 'teacher@gmail.com', role: 'TRAINER', orgId: provider2.id, trainerId: trainer2.id },
    { email: 'analyst@gmail.com', role: 'ANALYST', orgId: govOrg.id, trainerId: null },
    { email: 'employer@gmail.com', role: 'EMPLOYER', orgId: employer1.id, trainerId: null },

    // Legacy @maha.gov.in accounts also synced with PS135
    { email: 'admin@maha.gov.in', role: 'GOVERNMENT_ADMIN', orgId: govOrg.id, trainerId: null },
    { email: 'coursemanager@maha.gov.in', role: 'COURSE_MANAGER', orgId: govOrg.id, trainerId: null },
    { email: 'provider@maha.gov.in', role: 'TRAINING_PROVIDER', orgId: provider1.id, trainerId: null },
    { email: 'analyst@maha.gov.in', role: 'ANALYST', orgId: govOrg.id, trainerId: null },
    { email: 'employer@maha.gov.in', role: 'EMPLOYER', orgId: employer1.id, trainerId: null },
    { email: 'pending.employer@maha.gov.in', role: 'EMPLOYER', orgId: employer2.id, trainerId: null, status: 'PENDING' }
  ];

  for (const u of userSeeds) {
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        role: u.role as any,
        status: (u as any).status || 'ACTIVE',
        organizationId: u.orgId,
        trainerId: u.trainerId
      }
    });
  }

  // 4. Create Programs, Courses & Modules
  const prog1 = await prisma.program.create({
    data: { name: 'Electric Vehicle & Clean Energy', sector: 'Automotive & Energy' }
  });

  const prog2 = await prisma.program.create({
    data: { name: 'Information Technology & Data Intelligence', sector: 'IT & ITeS' }
  });

  const course1 = await prisma.course.create({
    data: {
      name: 'EV Battery Maintenance & Diagnostics',
      code: 'EV-101',
      description: 'Comprehensive certification on high-voltage battery architecture, testing, and diagnostics.',
      programId: prog1.id,
      skills: JSON.stringify(['Battery Diagnostics', 'Thermal Management', 'BMS Calibration', 'HV Safety Protocols']),
      targetJobRoles: JSON.stringify(['EV Service Engineer', 'Battery Diagnostic Technician', 'EV Fleet Supervisor']),
      expectedDurationHours: 120,
      attendanceRequirement: 80.0,
      moduleRequirement: 80.0,
      evidenceRequired: true
    }
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Data Analytics & Business Intelligence',
      code: 'DA-201',
      description: 'End-to-end data processing, SQL data warehousing, Python modeling, and PowerBI visualization.',
      programId: prog2.id,
      skills: JSON.stringify(['SQL', 'Python', 'PowerBI', 'Statistical Inference', 'Data Modeling']),
      targetJobRoles: JSON.stringify(['Junior Data Analyst', 'BI Specialist', 'Operations Analytics Associate']),
      expectedDurationHours: 100,
      attendanceRequirement: 75.0,
      moduleRequirement: 80.0,
      evidenceRequired: true
    }
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'Industrial Automation & PLC Programming',
      code: 'IA-301',
      description: 'Industrial robotics, SCADA systems, ladder logic, and IoT sensor integration.',
      programId: prog1.id,
      skills: JSON.stringify(['PLC Ladder Logic', 'SCADA Integration', 'Sensors & Actuators', 'Industrial Safety']),
      targetJobRoles: JSON.stringify(['Automation Technician', 'PLC Programmer', 'Plant Maintenance Specialist']),
      expectedDurationHours: 150,
      attendanceRequirement: 85.0,
      moduleRequirement: 80.0,
      evidenceRequired: true
    }
  });

  // Create Modules for Courses
  const m1_c1 = await prisma.module.create({ data: { courseId: course1.id, name: 'Module 1: High-Voltage Safety Protocols', order: 1, requiredEvidence: true } });
  const m2_c1 = await prisma.module.create({ data: { courseId: course1.id, name: 'Module 2: Lithium-Ion Cell Chemistry & Architecture', order: 2, requiredEvidence: false } });
  const m3_c1 = await prisma.module.create({ data: { courseId: course1.id, name: 'Module 3: Battery Management Systems (BMS) Calibration', order: 3, requiredEvidence: true } });
  const m4_c1 = await prisma.module.create({ data: { courseId: course1.id, name: 'Module 4: Diagnostic Scan Tools & Fault Isolation', order: 4, requiredEvidence: true } });

  const m1_c2 = await prisma.module.create({ data: { courseId: course2.id, name: 'Module 1: Relational Data Warehousing & SQL', order: 1, requiredEvidence: true } });
  const m2_c2 = await prisma.module.create({ data: { courseId: course2.id, name: 'Module 2: Python for Data Science & Pandas', order: 2, requiredEvidence: true } });
  const m3_c2 = await prisma.module.create({ data: { courseId: course2.id, name: 'Module 3: Business Dashboarding with PowerBI', order: 3, requiredEvidence: false } });
  const m4_c2 = await prisma.module.create({ data: { courseId: course2.id, name: 'Module 4: Capstone Predictive Modeling', order: 4, requiredEvidence: true } });

  // 5. Provider Course Authorizations
  await prisma.providerCourseAuthorization.create({
    data: {
      providerId: provider1.id,
      courseId: course1.id,
      status: 'AUTHORIZED',
      reason: 'State certified EV workshop with accredited dyno labs'
    }
  });

  await prisma.providerCourseAuthorization.create({
    data: {
      providerId: provider1.id,
      courseId: course3.id,
      status: 'AUTHORIZED',
      reason: 'Industrial automation lab facility'
    }
  });

  await prisma.providerCourseAuthorization.create({
    data: {
      providerId: provider2.id,
      courseId: course2.id,
      status: 'AUTHORIZED',
      reason: 'Accredited data lab and AWS cloud partner'
    }
  });

  // 6. Create Batches
  const batch1 = await prisma.batch.create({
    data: {
      name: 'EV-101-PUNE-B1',
      courseId: course1.id,
      providerId: provider1.id,
      trainerId: trainer1.id,
      capacity: 30,
      trainingMode: 'HYBRID',
      location: 'Pune Skill Institute Center A, Shivajinagar',
      schedule: 'Mon-Wed-Fri 09:00 AM - 01:00 PM',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-30'),
      status: 'ACTIVE'
    }
  });

  const batch2 = await prisma.batch.create({
    data: {
      name: 'DA-201-MUM-B1',
      courseId: course2.id,
      providerId: provider2.id,
      trainerId: trainer2.id,
      capacity: 30,
      trainingMode: 'ONLINE',
      location: 'Mumbai Central Innovation Hub',
      schedule: 'Tue-Thu-Sat 02:00 PM - 06:00 PM',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-09-15'),
      status: 'ACTIVE'
    }
  });

  // Create Sessions for Batch 1
  const session1 = await prisma.session.create({
    data: {
      batchId: batch1.id,
      date: new Date('2026-08-20'),
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      mode: 'OFFLINE',
      location: 'Lab Room 302',
      trainerId: trainer1.id,
      plannedHours: 4.0,
      actualHours: 4.0,
      topic: 'HV Disconnect & Cell Safety Isolation'
    }
  });

  const session2 = await prisma.session.create({
    data: {
      batchId: batch1.id,
      date: new Date('2026-08-22'),
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      mode: 'HYBRID',
      location: 'Lab Room 302 + Zoom',
      trainerId: trainer1.id,
      plannedHours: 4.0,
      actualHours: 4.0,
      topic: 'BMS Diagnostic Telemetry Scan'
    }
  });

  // 7. Seed 50 Trainees with full relational profiles
  const districts = ['Pune', 'Mumbai', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'];
  const outcomes = ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'APPRENTICESHIP', 'DROPPED'];
  const nonPlacementTaxonomies = ['SKILL_MISMATCH', 'LOCATION_CONSTRAINT', 'WAGE_EXPECTATION', 'FURTHER_STUDIES', 'HEALTH_PERSONAL'];

  for (let i = 1; i <= 50; i++) {
    const isBatch1 = i <= 25;
    const batch = isBatch1 ? batch1 : batch2;
    const district = districts[i % districts.length];

    const trainee = await prisma.trainee.create({
      data: {
        canonicalId: `TR-${1000 + i}`,
        firstName: `Trainee${i}`,
        lastName: `Test${i}`,
        dob: new Date(1998 + (i % 6), (i % 12), 15),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone: `98765432${(i % 10).toString().padStart(2, '0')}`,
        district,
        division: ['Pune', 'Thane', 'Nashik'].includes(district) ? 'Pune Division' : 'Mumbai Division',
        educationLevel: i % 3 === 0 ? 'Diploma in Engineering' : i % 2 === 0 ? 'B.Sc' : 'Higher Secondary',
        category: i % 4 === 0 ? 'OBC' : i % 3 === 0 ? 'SC/ST' : 'General',
        skills: isBatch1 ? 'EV Battery, Mechanical Diagnostics, Electrical Circuits' : 'SQL, Python, Excel, PowerBI',
        careerGoals: isBatch1 ? 'Lead EV Diagnostic Technician' : 'Business Intelligence Analyst',
        consentStatus: true,
        consentDate: new Date('2026-06-01')
      }
    });

    // Consent Log
    await prisma.consentLog.create({
      data: {
        traineeId: trainee.id,
        consentType: 'LONGITUDINAL_OUTCOMES_TRACKING',
        granted: true,
        ipAddress: '127.0.0.1',
        notes: 'Consent confirmed on registration portal'
      }
    });

    // Link Primary Trainee (TR-1001) as User for testing
    if (i === 1) {
      await prisma.user.create({
        data: {
          email: 'trainee@maha.gov.in',
          passwordHash,
          role: 'TRAINEE',
          status: 'ACTIVE',
          traineeId: trainee.id
        }
      });
    }

    // Pending Trainee for approval workflow testing
    if (i === 50) {
      await prisma.user.create({
        data: {
          email: 'pending.trainee@maha.gov.in',
          passwordHash,
          role: 'TRAINEE',
          status: 'PENDING',
          traineeId: trainee.id
        }
      });
    }

    const isDropped = i % 10 === 0;
    const isCompleted = !isDropped && i % 3 === 0;

    const enrollment = await prisma.enrollment.create({
      data: {
        traineeId: trainee.id,
        batchId: batch.id,
        status: isDropped ? 'DROPPED' : isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        requestedAt: new Date('2026-05-20'),
        approvedAt: new Date('2026-05-25'),
        approvedBy: 'coursemanager@maha.gov.in',
        completedAt: isCompleted ? new Date('2026-08-25') : null,
        completedBy: isCompleted ? 'coursemanager@maha.gov.in' : null,
        completionRecommendedBy: isCompleted ? trainer1.name : null,
        completionRecommendedAt: isCompleted ? new Date('2026-08-20') : null
      }
    });

    // Module Progress
    const activeModules = isBatch1 ? [m1_c1, m2_c1, m3_c1, m4_c1] : [m1_c2, m2_c2, m3_c2, m4_c2];
    for (const mod of activeModules) {
      await prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId: mod.id,
          status: isCompleted ? 'VERIFIED' : i % 2 === 0 ? 'VERIFIED' : 'SUBMITTED',
          evidenceUrl: `http://localhost:5000/uploads/evidence_${trainee.canonicalId}_mod_${mod.order}.pdf`,
          verifiedBy: trainer1.id,
          verifiedAt: new Date()
        }
      });
    }

    // Session Attendance
    if (isBatch1) {
      await prisma.attendance.create({
        data: {
          sessionId: session1.id,
          traineeId: trainee.id,
          status: isDropped ? 'ABSENT' : 'PRESENT',
          trainingHours: isDropped ? 0 : 4.0,
          verifiedBy: trainer1.id
        }
      });

      await prisma.attendance.create({
        data: {
          sessionId: session2.id,
          traineeId: trainee.id,
          status: isDropped ? 'ABSENT' : i % 5 === 0 ? 'LATE' : 'PRESENT',
          trainingHours: isDropped ? 0 : 4.0,
          verifiedBy: trainer1.id
        }
      });
    }

    // Evidence Submission
    if (i <= 10) {
      await prisma.evidenceSubmission.create({
        data: {
          enrollmentId: enrollment.id,
          traineeId: trainee.id,
          title: 'HV Safety Circuit Diagnostics Lab Report',
          fileUrl: `http://localhost:5000/uploads/lab_report_${trainee.canonicalId}.pdf`,
          fileType: 'PDF',
          description: 'Completed physical oscilloscope waveform and battery cell resistance readings.',
          status: i <= 5 ? 'VERIFIED' : 'PENDING',
          verifiedBy: i <= 5 ? trainer1.id : null,
          verificationNotes: i <= 5 ? 'Accurate measurement data and compliance with ISO 6469.' : null,
          verifiedAt: i <= 5 ? new Date() : null
        }
      });
    }

    // Certificate issuance for completed trainees
    if (isCompleted && i === 3) {
      const certApp = await prisma.certificateApplication.create({
        data: {
          enrollmentId: enrollment.id,
          traineeId: trainee.id,
          status: 'APPROVED',
          attendancePercent: 92.5,
          modulePercent: 100.0,
          evidenceVerified: true,
          decisionReason: 'Met all course and safety evidence prerequisites',
          decisionBy: 'admin@maha.gov.in',
          decidedAt: new Date('2026-08-26')
        }
      });

      const certNumber = `CERT-MH-2026-${1000 + i}`;
      await prisma.certificate.create({
        data: {
          certificateNumber: certNumber,
          traineeId: trainee.id,
          courseId: batch.courseId,
          enrollmentId: enrollment.id,
          issueDate: new Date('2026-08-26'),
          status: 'ISSUED',
          qrCodeData: `https://maha.gov.in/verify/${certNumber}`,
          verificationUrl: `http://localhost:5174/verify-certificate/${certNumber}`,
          approvedBy: 'admin@maha.gov.in'
        }
      });
    }

    // Outcomes & PS #26135 taxonomies
    if (isDropped) {
      // Intervention for High Risk Dropped Trainees
      await prisma.intervention.create({
        data: {
          traineeId: trainee.id,
          actionType: 'COUNSELING',
          priority: 'HIGH',
          status: 'OPEN',
          assignedTo: 'Counselor Priya Patil',
          notes: 'High dropout risk detected due to consecutive session absences.',
          dueDate: new Date('2026-09-05'),
          createdById: 'admin@maha.gov.in'
        }
      });
    } else {
      const outcomeType = outcomes[i % outcomes.length];
      
      if (outcomeType === 'EMPLOYED') {
        const salary = 28000 + (i * 1200);
        await prisma.outcome.create({
          data: {
            traineeId: trainee.id,
            status: 'EMPLOYED',
            date: new Date('2026-07-15'),
            employerName: 'Tata Motors Pune',
            jobTitle: isBatch1 ? 'EV Diagnostic Specialist' : 'Business Analyst',
            salary,
            industry: isBatch1 ? 'Automotive EV' : 'IT Services',
            skillRelevanceScore: 'HIGH',
            retentionCheckpoint: '6_MONTH',
            notes: 'Placed via campus recruitment drive.'
          }
        });

        // Verification Request for Employer
        if (i <= 5) {
          await prisma.verification.create({
            data: {
              traineeId: trainee.id,
              organizationId: employer1.id,
              level: 'EMPLOYER',
              status: i === 1 ? 'PENDING' : 'VERIFIED',
              verifiedBy: i > 1 ? 'employer@maha.gov.in' : null,
              evidenceNotes: i > 1 ? 'Employee confirmed active on payroll.' : null
            }
          });
        }
      } else if (outcomeType === 'SELF_EMPLOYED') {
        await prisma.outcome.create({
          data: {
            traineeId: trainee.id,
            status: 'SELF_EMPLOYED',
            date: new Date('2026-07-20'),
            salary: 35000,
            industry: 'Automotive Services',
            enterpriseName: `Maha EV Workshop & Battery Services (${trainee.district})`,
            businessSector: 'Automotive & Repair Services',
            monthlyRevenue: 65000,
            registrationType: 'Udyam Registration',
            skillRelevanceScore: 'HIGH',
            retentionCheckpoint: '3_MONTH',
            notes: 'Independent EV service station opened with Mudra loan support.'
          }
        });
      } else if (outcomeType === 'APPRENTICESHIP') {
        await prisma.outcome.create({
          data: {
            traineeId: trainee.id,
            status: 'APPRENTICESHIP',
            date: new Date('2026-08-01'),
            employerName: 'Tata Motors Pune',
            stipend: 18500,
            contractMonths: 12,
            convertedToPermanent: false,
            skillRelevanceScore: 'HIGH',
            retentionCheckpoint: 'INITIAL',
            notes: '1-year government apprentice contract under NAPS scheme.'
          }
        });
      } else if (outcomeType === 'UNEMPLOYED') {
        await prisma.outcome.create({
          data: {
            traineeId: trainee.id,
            status: 'UNEMPLOYED',
            date: new Date('2026-08-10'),
            nonPlacementReason: nonPlacementTaxonomies[i % nonPlacementTaxonomies.length],
            notes: 'Candidate seeking positions matching wage expectation and local district.'
          }
        });
      }

      // Follow-Up records
      await prisma.followUp.create({
        data: {
          traineeId: trainee.id,
          type: '3_MONTH',
          status: 'COMPLETED',
          responses: JSON.stringify({
            currentlyEmployed: outcomeType === 'EMPLOYED' || outcomeType === 'SELF_EMPLOYED',
            satisfactionScore: 9,
            usingTrainedSkills: true
          }),
          loggedBy: 'Field Officer Anand Joshi',
          notes: 'Trainee confirmed continued employment and good skill application.'
        }
      });
    }
  }

  console.log('✅ Seed completed successfully with all 7 roles, courses, batches, and PS #26135 outcomes!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
