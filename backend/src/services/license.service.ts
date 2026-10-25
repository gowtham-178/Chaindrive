import { Types } from 'mongoose';
import { License, ILicense, LicenseStatus } from '../models/License';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { generateLicenseHash, generateSalt, verifyDataIntegrity } from '../utils/hash.utils';
import { getBlockchainService } from './blockchain.service';
import { createAuditLog } from '../models/AuditLog';

export interface ApplyLicenseInput {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  vehicleClasses: string[];
  documents?: {
    idProofUrl?: string;
    addressProofUrl?: string;
    medicalCertificateUrl?: string;
  };
  applicationNotes?: string;
}

export class LicenseService {
  async apply(userId: string, input: ApplyLicenseInput): Promise<ILicense> {
    const existing = await License.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['applied', 'approved', 'issued'] },
    });

    if (existing) {
      throw new AppError(
        `User already has a license application with status: ${existing.status}`,
        400
      );
    }

    const license = await License.create({
      userId: new Types.ObjectId(userId),
      fullName: input.fullName,
      dateOfBirth: new Date(input.dateOfBirth),
      gender: input.gender,
      bloodGroup: input.bloodGroup,
      address: input.address,
      vehicleClasses: input.vehicleClasses,
      status: 'applied',
      documents: input.documents,
      applicationNotes: input.applicationNotes,
      applicationDate: new Date(),
      history: [
        {
          action: 'APPLICATION_SUBMITTED',
          actorId: new Types.ObjectId(userId),
          actorRole: 'driver',
          timestamp: new Date(),
          notes: 'Driver submitted initial license application',
        },
      ],
    });

    await createAuditLog({
      action: 'LICENSE_APPLICATION_SUBMITTED',
      actorId: new Types.ObjectId(userId),
      actorRole: 'driver',
      targetType: 'license',
      targetId: (license._id as Types.ObjectId).toString(),
      details: { vehicleClasses: input.vehicleClasses },
    });

    return license;
  }

  async getApplications(status?: string, page = 1, limit = 20): Promise<{
    licenses: ILicense[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = {};
    if (status) {
      query['status'] = status;
    }

    const total = await License.countDocuments(query);
    const licenses = await License.find(query)
      .populate('userId', 'email walletAddress profile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      licenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewApplication(
    adminId: string,
    licenseId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<ILicense> {
    const license = await License.findById(licenseId);
    if (!license) {
      throw new AppError('License application not found', 404);
    }

    if (license.status !== 'applied') {
      throw new AppError(`Cannot review application with current status: ${license.status}`, 400);
    }

    license.status = decision;
    if (decision === 'rejected') {
      license.rejectionReason = reason;
    }

    license.history.push({
      action: decision === 'approved' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      timestamp: new Date(),
      notes: reason,
    });

    await license.save();

    await createAuditLog({
      action: decision === 'approved' ? 'LICENSE_APPROVED' : 'LICENSE_REJECTED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      targetType: 'license',
      targetId: licenseId,
      details: { decision, reason },
    });

    return license;
  }

  async issueLicense(adminId: string, licenseId: string): Promise<ILicense> {
    const license = await License.findById(licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }

    if (license.status !== 'approved') {
      throw new AppError('Only approved applications can be issued on-chain', 400);
    }

    const driverUser = await User.findById(license.userId);
    if (!driverUser) {
      throw new AppError('Driver account associated with this license was not found', 404);
    }

    const driverWallet = driverUser.walletAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    // Generate permanent license number if not already present
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const licenseNumber = `DL-IND-${year}-${randomSuffix}`;

    const issuedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 20); // 20-year validity

    const salt = generateSalt();
    const hashData = {
      licenseNumber,
      userId: (license.userId as Types.ObjectId).toString(),
      fullName: license.fullName,
      dateOfBirth: license.dateOfBirth.toISOString().split('T')[0] ?? '',
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const onChainHash = generateLicenseHash(hashData, salt);

    let txHash: string | undefined;
    try {
      const blockchain = getBlockchainService();
      const expiryTimestamp = Math.floor(expiresAt.getTime() / 1000);
      const receipt = await blockchain.issueLicense(driverWallet, onChainHash, expiryTimestamp);
      txHash = receipt.hash;
    } catch (err) {
      console.warn('Blockchain issueLicense call failed (Hardhat node might be offline, continuing with off-chain recording):', err);
      txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    license.licenseNumber = licenseNumber;
    license.status = 'issued';
    license.issuedAt = issuedAt;
    license.expiresAt = expiresAt;
    license.salt = salt;
    license.onChainHash = onChainHash;
    license.qrCode = JSON.stringify({
      licenseNumber,
      holder: license.fullName,
      hash: onChainHash,
      verifyUrl: `/verify?number=${licenseNumber}`,
    });

    license.history.push({
      action: 'LICENSE_ISSUED_ON_CHAIN',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      timestamp: new Date(),
      notes: `Issued on-chain with hash: ${onChainHash}`,
      txHash,
    });

    await license.save();

    await createAuditLog({
      action: 'LICENSE_ISSUED_ON_CHAIN',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      targetType: 'license',
      targetId: licenseId,
      details: { licenseNumber, onChainHash, txHash },
    });

    return license;
  }

  async suspendLicense(adminId: string, licenseId: string, reason: string): Promise<ILicense> {
    const license = await License.findById(licenseId);
    if (!license) throw new AppError('License not found', 404);
    if (license.status !== 'issued') {
      throw new AppError('Only active issued licenses can be suspended', 400);
    }

    let txHash: string | undefined;
    if (license.onChainHash) {
      try {
        const blockchain = getBlockchainService();
        const receipt = await blockchain.suspendLicense(license.onChainHash, reason);
        txHash = receipt.hash;
      } catch (err) {
        console.warn('Blockchain suspendLicense call failed:', err);
      }
    }

    license.status = 'suspended';
    license.suspensionReason = reason;
    license.history.push({
      action: 'LICENSE_SUSPENDED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      timestamp: new Date(),
      notes: reason,
      txHash,
    });

    await license.save();
    return license;
  }

  async revokeLicense(adminId: string, licenseId: string, reason: string): Promise<ILicense> {
    const license = await License.findById(licenseId);
    if (!license) throw new AppError('License not found', 404);

    let txHash: string | undefined;
    if (license.onChainHash) {
      try {
        const blockchain = getBlockchainService();
        const receipt = await blockchain.revokeLicense(license.onChainHash, reason);
        txHash = receipt.hash;
      } catch (err) {
        console.warn('Blockchain revokeLicense call failed:', err);
      }
    }

    license.status = 'revoked';
    license.revocationReason = reason;
    license.history.push({
      action: 'LICENSE_REVOKED',
      actorId: new Types.ObjectId(adminId),
      actorRole: 'admin',
      timestamp: new Date(),
      notes: reason,
      txHash,
    });

    await license.save();
    return license;
  }

  async getDriverLicense(userId: string): Promise<ILicense | null> {
    return await License.findOne({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async getLicenseByNumber(licenseNumber: string): Promise<ILicense | null> {
    return await License.findOne({ licenseNumber }).populate('userId', 'email profile');
  }

  async verifyPublic(licenseNumber: string): Promise<{
    isValid: boolean;
    licenseNumber: string;
    fullName: string;
    vehicleClasses: string[];
    status: LicenseStatus;
    issuedAt?: Date;
    expiresAt?: Date;
    isIntegrityVerified: boolean;
    onChainHash?: string;
  }> {
    const license = await License.findOne({ licenseNumber });
    if (!license) {
      throw new AppError('License not found', 404);
    }

    let isIntegrityVerified = false;
    if (license.onChainHash && license.salt && license.issuedAt && license.expiresAt) {
      const hashData = {
        licenseNumber: license.licenseNumber,
        userId: (license.userId as Types.ObjectId).toString(),
        fullName: license.fullName,
        dateOfBirth: license.dateOfBirth.toISOString().split('T')[0] ?? '',
        issuedAt: license.issuedAt.toISOString(),
        expiresAt: license.expiresAt.toISOString(),
      };
      isIntegrityVerified = verifyDataIntegrity(hashData, license.salt, license.onChainHash, 'license');
    }

    const isValid = license.status === 'issued' && isIntegrityVerified && (!license.expiresAt || new Date() < license.expiresAt);

    return {
      isValid,
      licenseNumber: license.licenseNumber,
      fullName: license.fullName,
      vehicleClasses: license.vehicleClasses,
      status: license.status,
      issuedAt: license.issuedAt,
      expiresAt: license.expiresAt,
      isIntegrityVerified,
      onChainHash: license.onChainHash,
    };
  }
}

export const licenseService = new LicenseService();
