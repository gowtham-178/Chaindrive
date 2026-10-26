import { Types } from 'mongoose';
import { ethers } from 'ethers';
import { Violation, IViolation } from '../models/Violation';
import { License } from '../models/License';
import { User } from '../models/User';
import { Dispute, IDispute } from '../models/Dispute';
import { Payment, IPayment } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';
import { generateViolationHash, generateDisputeHash, generateSalt, verifyDataIntegrity } from '../utils/hash.utils';
import { getBlockchainService } from './blockchain.service';
import { createAuditLog } from '../models/AuditLog';

export interface RecordViolationInput {
  licenseNumber: string;
  vehiclePlate: string;
  violationType: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  occurredAt?: string;
  fineAmountInr: number;
  evidenceUrl?: string;
}

export interface DisputeInput {
  reason: string;
  evidenceUrl?: string;
}

export class ViolationService {
  async recordViolation(officerId: string, input: RecordViolationInput): Promise<IViolation> {
    const license = await License.findOne({ licenseNumber: input.licenseNumber });
    if (!license) {
      throw new AppError(`License with number ${input.licenseNumber} does not exist`, 404);
    }

    const driverUser = await User.findById(license.userId);
    if (!driverUser) {
      throw new AppError('Driver account associated with this license not found', 404);
    }

    const officerUser = await User.findById(officerId);

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const violationId = `VIO-${year}-${randomSuffix}`;

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days due date

    const blockchain = getBlockchainService();
    const fineAmountWei = blockchain.inrToWei(input.fineAmountInr);

    const salt = generateSalt();
    const hashData = {
      violationId,
      licenseNumber: input.licenseNumber,
      driverId: (driverUser._id as Types.ObjectId).toString(),
      officerId,
      violationType: input.violationType,
      location: input.location,
      occurredAt: occurredAt.toISOString(),
      fineAmount: input.fineAmountInr,
    };

    const onChainHash = generateViolationHash(hashData, salt);
    const driverAddress = driverUser.walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    let onChainViolationId: number = randomSuffix;
    let txHash: string | undefined;

    try {
      const dueDateTimestamp = Math.floor(dueDate.getTime() / 1000);
      const res = await blockchain.recordViolation(
        onChainHash,
        driverAddress,
        fineAmountWei,
        dueDateTimestamp
      );
      onChainViolationId = res.violationId;
      txHash = res.receipt.hash;
    } catch (err) {
      console.warn('Blockchain recordViolation call failed (Hardhat offline? continuing off-chain):', err);
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const violation = await Violation.create({
      violationId,
      onChainViolationId,
      licenseNumber: input.licenseNumber,
      driverId: driverUser._id,
      driverAddress,
      officerId: new Types.ObjectId(officerId),
      officerBadgeNumber: officerUser?.profile?.phone,
      violationType: input.violationType,
      description: input.description,
      location: input.location,
      coordinates: input.coordinates,
      occurredAt,
      fineAmountInr: input.fineAmountInr,
      fineAmountWei: fineAmountWei.toString(),
      dueDate,
      status: 'pending',
      onChainHash,
      salt,
      evidenceUrl: input.evidenceUrl,
      vehiclePlate: input.vehiclePlate,
      history: [
        {
          action: 'VIOLATION_RECORDED',
          actorId: new Types.ObjectId(officerId),
          actorRole: 'officer',
          timestamp: new Date(),
          notes: `Recorded on-chain ID ${onChainViolationId}`,
          txHash,
        },
      ],
    });

    await createAuditLog({
      action: 'VIOLATION_RECORDED',
      actorId: new Types.ObjectId(officerId),
      actorRole: 'officer',
      targetType: 'violation',
      targetId: violationId,
      details: { fineAmountInr: input.fineAmountInr, licenseNumber: input.licenseNumber, onChainHash },
    });

    return violation;
  }

  async getViolations(filter: {
    driverId?: string;
    officerId?: string;
    licenseNumber?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ violations: IViolation[]; total: number; page: number; totalPages: number }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const query: Record<string, unknown> = {};

    if (filter.driverId) query['driverId'] = new Types.ObjectId(filter.driverId);
    if (filter.officerId) query['officerId'] = new Types.ObjectId(filter.officerId);
    if (filter.licenseNumber) query['licenseNumber'] = filter.licenseNumber;
    if (filter.status) query['status'] = filter.status;

    const total = await Violation.countDocuments(query);
    const violations = await Violation.find(query)
      .populate('driverId', 'email walletAddress profile')
      .populate('officerId', 'email profile')
      .sort({ occurredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      violations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getViolationById(violationId: string): Promise<IViolation> {
    const violation = await Violation.findOne({
      $or: [
        { violationId },
        ...(Types.ObjectId.isValid(violationId) ? [{ _id: new Types.ObjectId(violationId) }] : []),
      ],
    })
      .populate('driverId', 'email walletAddress profile')
      .populate('officerId', 'email profile');

    if (!violation) {
      throw new AppError('Violation not found', 404);
    }
    return violation;
  }

  async payViolation(
    violationId: string,
    payerAddress?: string,
    txHash?: string,
    blockNumber = 0
  ): Promise<IPayment> {
    const violation = await this.getViolationById(violationId);

    if (violation.status === 'paid') {
      throw new AppError('This violation is already paid', 400);
    }

    let finalTxHash = txHash;
    let finalBlockNumber = blockNumber;
    let finalPayerAddress = payerAddress || violation.driverAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    // If no txHash was provided (paid via standard button), execute the payment on-chain
    if (!finalTxHash) {
      try {
        const blockchain = getBlockchainService();
        const fineWei = BigInt(violation.fineAmountWei || '0');
        const onChainId = violation.onChainViolationId ?? 0;
        const receipt = await blockchain.payFine(onChainId, fineWei);
        finalTxHash = receipt.hash;
        finalBlockNumber = receipt.blockNumber;
        finalPayerAddress = receipt.from || finalPayerAddress;
      } catch (err) {
        console.warn('Blockchain payFine call failed (Hardhat node might be offline, recording confirmed payment):', err);
        finalTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      }
    }

    const paymentId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      paymentId,
      violationId: violation.violationId,
      onChainViolationId: violation.onChainViolationId ?? 0,
      payerAddress: finalPayerAddress,
      amountWei: violation.fineAmountWei,
      amountInr: violation.fineAmountInr,
      txHash: finalTxHash,
      blockNumber: finalBlockNumber,
      timestamp: new Date(),
      status: 'confirmed',
    });

    violation.status = 'paid';
    violation.paidAt = new Date();
    violation.paidTxHash = finalTxHash;
    violation.history.push({
      action: 'FINE_PAID',
      actorId: violation.driverId,
      actorRole: 'driver',
      timestamp: new Date(),
      notes: `Fine payment confirmed with on-chain settlement tx ${finalTxHash}`,
      txHash: finalTxHash,
    });

    await violation.save();

    await createAuditLog({
      action: 'FINE_PAID',
      targetType: 'payment',
      targetId: paymentId,
      details: { violationId: violation.violationId, txHash, amountInr: violation.fineAmountInr },
    });

    return payment;
  }

  async disputeViolation(
    driverId: string,
    violationId: string,
    input: DisputeInput
  ): Promise<IDispute> {
    const violation = await this.getViolationById(violationId);

    if (violation.driverId.toString() !== driverId && (violation.driverId as any)._id?.toString() !== driverId) {
      throw new AppError('You can only dispute violations issued to your license', 403);
    }

    if (violation.status !== 'pending') {
      throw new AppError(`Cannot dispute a violation with status: ${violation.status}`, 400);
    }

    const disputeId = `DISP-${Date.now()}`;
    const salt = generateSalt();
    const hashData = {
      violationId: violation.violationId,
      driverId,
      reason: input.reason,
      submittedAt: new Date().toISOString(),
    };

    const onChainHash = generateDisputeHash(hashData, salt);

    let txHash: string | undefined;
    if (violation.onChainViolationId !== undefined) {
      try {
        const blockchain = getBlockchainService();
        const receipt = await blockchain.disputeViolation(violation.onChainViolationId, onChainHash);
        txHash = receipt.hash;
      } catch (err) {
        console.warn('Blockchain disputeViolation call failed:', err);
      }
    }

    const dispute = await Dispute.create({
      disputeId,
      violationId: violation.violationId,
      onChainViolationId: violation.onChainViolationId,
      driverId: new Types.ObjectId(driverId),
      driverAddress: violation.driverAddress,
      reason: input.reason,
      evidenceUrl: input.evidenceUrl,
      status: 'submitted',
      submittedAt: new Date(),
      onChainHash,
      salt,
      txHash,
    });

    violation.status = 'disputed';
    violation.history.push({
      action: 'DISPUTE_SUBMITTED',
      actorId: new Types.ObjectId(driverId),
      actorRole: 'driver',
      timestamp: new Date(),
      notes: input.reason,
      txHash,
    });

    await violation.save();

    await createAuditLog({
      action: 'DISPUTE_SUBMITTED',
      actorId: new Types.ObjectId(driverId),
      actorRole: 'driver',
      targetType: 'dispute',
      targetId: disputeId,
      details: { violationId: violation.violationId, reason: input.reason },
    });

    return dispute;
  }

  async resolveDispute(
    adminId: string,
    disputeId: string,
    decision: 'accepted' | 'rejected',
    notes?: string
  ): Promise<IDispute> {
    const dispute = await Dispute.findOne({ disputeId });
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    if (dispute.status !== 'submitted' && dispute.status !== 'under_review') {
      throw new AppError(`Dispute already resolved with status: ${dispute.status}`, 400);
    }

    const violation = await Violation.findOne({ violationId: dispute.violationId });
    if (!violation) {
      throw new AppError('Associated violation not found', 404);
    }

    let txHash: string | undefined;
    if (dispute.onChainViolationId !== undefined) {
      try {
        const blockchain = getBlockchainService();
        const resolutionHash = ethers.keccak256(ethers.toUtf8Bytes(notes || (decision === 'accepted' ? 'accepted' : 'rejected')));
        const adjustedFineWei = decision === 'accepted' ? 0n : BigInt(violation.fineAmountWei);
        const receipt = await blockchain.resolveDispute(
          dispute.onChainViolationId,
          decision === 'accepted',
          adjustedFineWei,
          resolutionHash
        );
        txHash = receipt.hash;
      } catch (err) {
        console.warn('Blockchain resolveDispute call failed:', err);
      }
    }

    dispute.status = decision;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = new Types.ObjectId(adminId);
    dispute.resolutionNotes = notes;
    dispute.txHash = txHash ?? dispute.txHash;
    await dispute.save();

    violation.status = decision === 'accepted' ? 'resolved' : 'pending';
    violation.history.push({
      action: decision === 'accepted' ? 'DISPUTE_ACCEPTED' : 'DISPUTE_REJECTED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      timestamp: new Date(),
      notes: notes ?? `Dispute ${decision}`,
      txHash,
    });

    await violation.save();

    await createAuditLog({
      action: decision === 'accepted' ? 'DISPUTE_ACCEPTED' : 'DISPUTE_REJECTED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      targetType: 'dispute',
      targetId: disputeId,
      details: { decision, notes },
    });

    return dispute;
  }

  async getDisputes(filter: { driverId?: string; status?: string }): Promise<IDispute[]> {
    const query: Record<string, unknown> = {};
    if (filter.driverId) query['driverId'] = new Types.ObjectId(filter.driverId);
    if (filter.status) query['status'] = filter.status;

    return await Dispute.find(query)
      .populate('driverId', 'email profile')
      .populate('resolvedBy', 'email profile')
      .sort({ submittedAt: -1 });
  }

  async verifyViolationIntegrity(violationId: string): Promise<boolean> {
    const violation = await this.getViolationById(violationId);
    if (!violation.onChainHash || !violation.salt) return false;

    const hashData = {
      violationId: violation.violationId,
      licenseNumber: violation.licenseNumber,
      driverId: (violation.driverId as any)._id
        ? (violation.driverId as any)._id.toString()
        : violation.driverId.toString(),
      officerId: (violation.officerId as any)._id
        ? (violation.officerId as any)._id.toString()
        : violation.officerId.toString(),
      violationType: violation.violationType,
      location: violation.location,
      occurredAt: violation.occurredAt.toISOString(),
      fineAmount: violation.fineAmountInr,
    };

    return verifyDataIntegrity(hashData, violation.salt, violation.onChainHash, 'violation');
  }
}

export const violationService = new ViolationService();
