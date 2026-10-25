import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { licenseService } from '../services/license.service';

const applySchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.string(),
  bloodGroup: z.string(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  vehicleClasses: z.array(z.string()).min(1),
  documents: z
    .object({
      idProofUrl: z.string().optional(),
      addressProofUrl: z.string().optional(),
      medicalCertificateUrl: z.string().optional(),
    })
    .optional(),
  applicationNotes: z.string().optional(),
});

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

const reasonSchema = z.object({
  reason: z.string().min(3),
});

export async function applyLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = applySchema.parse(req.body);
    const license = await licenseService.apply(req.user!.userId, input);
    res.status(201).json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query['status'] as string | undefined;
    const page = parseInt((req.query['page'] as string) || '1', 10);
    const limit = parseInt((req.query['limit'] as string) || '20', 10);
    const result = await licenseService.getApplications(status, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function reviewApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { decision, reason } = reviewSchema.parse(req.body);
    const license = await licenseService.reviewApplication(
      req.user!.userId,
      req.params['id'] as string,
      decision,
      reason
    );
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function issueLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const license = await licenseService.issueLicense(req.user!.userId, req.params['id'] as string);
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function suspendLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = reasonSchema.parse(req.body);
    const license = await licenseService.suspendLicense(
      req.user!.userId,
      req.params['id'] as string,
      reason
    );
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function revokeLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = reasonSchema.parse(req.body);
    const license = await licenseService.revokeLicense(
      req.user!.userId,
      req.params['id'] as string,
      reason
    );
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function getMyLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const license = await licenseService.getDriverLicense(req.user!.userId);
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function getLicenseByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const license = await licenseService.getLicenseByNumber(req.params['licenseNumber'] as string);
    if (!license) {
      res.status(404).json({ success: false, message: 'License not found' });
      return;
    }
    res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

export async function verifyLicensePublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const licenseNumber = (req.params['licenseNumber'] || req.query['number']) as string;
    if (!licenseNumber) {
      res.status(400).json({ success: false, message: 'License number is required' });
      return;
    }
    const result = await licenseService.verifyPublic(licenseNumber);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
