import { Request, Response } from 'express';
import { parse } from 'csv-parse';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/auth';

interface CsvRow {
  canonicalId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  district: string;
  division: string;
  program: string;
  course: string;
  batchName: string;
  providerName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = req.params.jobId as string;
    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }
    const job = await prisma.importJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({
      id: job.id,
      status: job.status,
      fileName: job.fileName,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      errorCount: job.errorCount,
      errors: job.errors ? JSON.parse(job.errors) : [],
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });
  } catch (err) {
    console.error('Error fetching job status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user?.id || 'system';

    // 1. Create ImportJob
    const job = await prisma.importJob.create({
      data: {
        fileName: req.file.originalname,
        status: 'PENDING',
        uploadedBy: userId,
      }
    });

    // 2. Respond immediately
    res.status(202).json({
      message: 'File accepted for processing',
      jobId: job.id
    });

    // 3. Start background processing (do not await)
    const fileBuffer = req.file.buffer; // keep a reference
    setImmediate(() => {
      processBackgroundJob(job.id, fileBuffer, userId).catch(err => {
        console.error(`Background job ${job.id} failed horribly:`, err);
      });
    });

  } catch (error) {
    console.error('CSV Upload Error:', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
};

async function processBackgroundJob(jobId: string, buffer: Buffer, userId: string) {
  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' }
  });

  const errors: any[] = [];
  let rowCount = 0;
  let imported = 0;
  let duplicates = 0;

  try {
    const parser = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      rowCount++;
      
      if (!record.canonicalId || !record.firstName || !record.lastName) {
        errors.push({ row: rowCount, message: 'Missing required fields' });
        continue;
      }
      
      try {
        const existingTrainee = await prisma.trainee.findUnique({
          where: { canonicalId: record.canonicalId }
        });

        if (existingTrainee) {
          duplicates++;
        } else {
          await prisma.trainee.create({
            data: {
              canonicalId: record.canonicalId,
              firstName: record.firstName,
              lastName: record.lastName,
              dob: record.dob ? new Date(record.dob) : new Date('2000-01-01'),
              gender: record.gender || 'Unknown',
              phone: record.phone,
              district: record.district,
              division: record.division,
              consentStatus: true,
              consentDate: new Date(),
            }
          });
          imported++;
        }
      } catch (dbErr) {
        errors.push({ row: rowCount, message: 'DB Error on insert' });
      }

      // Update progress every 100 rows to avoid hammering DB
      if (rowCount % 100 === 0) {
        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            totalRows: rowCount,
            processedRows: imported + duplicates,
            errorCount: errors.length
          }
        });
      }
    }

    // Final update
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        totalRows: rowCount,
        processedRows: imported + duplicates,
        errorCount: errors.length,
        errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null
      }
    });

    if (imported > 0) {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'CSV_IMPORT_BG',
          resource: 'Trainee',
          metadata: JSON.stringify({ jobId, imported, duplicates, errors: errors.length })
        }
      });
    }

  } catch (err: any) {
    console.error('CSV Parsing failed:', err);
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errors: JSON.stringify([{ message: 'Fatal parsing error', details: err?.message }])
      }
    });
  }
}
