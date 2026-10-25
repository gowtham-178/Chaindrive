// Shared TypeScript types for ChainDrive

export enum UserRole {
  ADMIN = 'admin',
  OFFICER = 'officer',
  DRIVER = 'driver',
}

export enum LicenseStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ViolationStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

export enum DisputeStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
}

export enum DisputeOutcome {
  UPHELD = 'upheld',
  DISMISSED = 'dismissed',
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  profile: {
    fullName: string;
    phone: string;
    dateOfBirth?: Date;
    address?: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  createdAt: Date;
}

export interface License {
  _id: string;
  licenseNumber: string;
  userId: string;
  dataHash: string;
  hashSalt: string;
  status: LicenseStatus;
  issuedAt: Date;
  expiresAt: Date;
  blockchainData: {
    txHash: string;
    blockNumber: number;
    contractAddress: string;
  };
}

export interface Violation {
  _id: string;
  violationId: number;
  driverId: string;
  officerId: string;
  licenseNumber: string;
  violationType: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  occurredAt: Date;
  description: string;
  evidence: Array<{ type: string; url: string }>;
  dataHash: string;
  hashSalt: string;
  fineAmount: number;
  fineAmountEth: string;
  status: ViolationStatus;
  disputeId?: string;
  blockchainData: {
    txHash: string;
    blockNumber: number;
  };
  createdAt: Date;
}

export interface Dispute {
  _id: string;
  violationId: string;
  driverId: string;
  reason: string;
  evidence: Array<{ type: string; url: string }>;
  status: DisputeStatus;
  resolution?: {
    outcome: DisputeOutcome;
    adjustedFine?: number;
    resolvedBy: string;
    resolvedAt: Date;
    notes: string;
  };
  dataHash: string;
  blockchainData?: {
    txHash: string;
    blockNumber: number;
  };
  createdAt: Date;
}
