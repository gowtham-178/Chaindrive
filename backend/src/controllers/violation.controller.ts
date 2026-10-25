import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { violationService } from '../services/violation.service';

const recordViolationSchema = z.object({
  licenseNumber: z.string().min(3),
  vehiclePlate: z.string().min(2),
  violationType: z.string().min(2),
  description: z.string().min(5),
  location: z.string().min(2),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  occurredAt: z.string().optional(),
  fineAmountInr: z.number().positive(),
  evidenceUrl: z.string().optional(),
});

const payViolationSchema = z.object({
  payerAddress: z.string().min(40),
  txHash: z.string().min(64),
  blockNumber: z.number().optional(),
});

const disputeSchema = z.object({
  reason: z.string().min(10),
  evidenceUrl: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
  notes: z.string().optional(),
});

export async function recordViolation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = recordViolationSchema.parse(req.body);
    const violation = await violationService.recordViolation(req.user!.userId, input);
    res.status(201).json({ success: true, data: violation });
  } catch (err) {
    next(err);
  }
}

export async function getViolations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: {
      driverId?: string;
      officerId?: string;
      licenseNumber?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {};

    if (req.user!.role === 'driver') {
      filter.driverId = req.user!.userId;
    } else if (req.user!.role === 'officer') {
      if (req.query['mine'] === 'true') {
        filter.officerId = req.user!.userId;
      }
    }

    if (req.query['status']) filter.status = req.query['status'] as string;
    if (req.query['licenseNumber']) filter.licenseNumber = req.query['licenseNumber'] as string;
    if (req.query['page']) filter.page = parseInt(req.query['page'] as string, 10);
    if (req.query['limit']) filter.limit = parseInt(req.query['limit'] as string, 10);

    const result = await violationService.getViolations(filter);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getViolationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const violation = await violationService.getViolationById(req.params['id'] as string);
    res.json({ success: true, data: violation });
  } catch (err) {
    next(err);
  }
}

export async function payViolation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { payerAddress, txHash, blockNumber } = payViolationSchema.parse(req.body);
    const payment = await violationService.payViolation(
      req.params['id'] as string,
      payerAddress,
      txHash,
      blockNumber
    );
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

export async function disputeViolation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = disputeSchema.parse(req.body);
    const dispute = await violationService.disputeViolation(
      req.user!.userId,
      req.params['id'] as string,
      input
    );
    res.status(201).json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { decision, notes } = resolveDisputeSchema.parse(req.body);
    const dispute = await violationService.resolveDispute(
      req.user!.userId,
      req.params['disputeId'] as string,
      decision,
      notes
    );
    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
}

export async function getDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: { driverId?: string; status?: string } = {};
    if (req.user!.role === 'driver') {
      filter.driverId = req.user!.userId;
    }
    if (req.query['status']) {
      filter.status = req.query['status'] as string;
    }
    const disputes = await violationService.getDisputes(filter);
    res.json({ success: true, data: disputes });
  } catch (err) {
    next(err);
  }
}

export async function verifyViolationIntegrity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isValid = await violationService.verifyViolationIntegrity(req.params['id'] as string);
    res.json({ success: true, data: { isValid } });
  } catch (err) {
    next(err);
  }
}
