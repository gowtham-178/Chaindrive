export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'officer' | 'driver';
  walletAddress?: string;
  profile: {
    fullName: string;
    phone: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode?: string;
      pincode?: string;
    };
  };
  isActive?: boolean;
  createdAt?: string;
}

export type LicenseStatus = 'applied' | 'approved' | 'issued' | 'suspended' | 'revoked' | 'rejected';

export interface License {
  _id: string;
  licenseNumber?: string;
  userId: string | User;
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
  status: LicenseStatus;
  onChainHash?: string;
  salt?: string;
  issuedAt?: string;
  expiresAt?: string;
  applicationDate?: string;
  applicationNotes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  qrCode?: string;
  documents?: {
    idProofUrl?: string;
    addressProofUrl?: string;
    medicalCertificateUrl?: string;
  };
  history?: Array<{
    action: string;
    actorId: string;
    actorRole: string;
    timestamp: string;
    notes?: string;
    txHash?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type ViolationStatus = 'pending' | 'paid' | 'disputed' | 'resolved' | 'cancelled';

export interface Violation {
  _id: string;
  violationId: string;
  onChainViolationId?: number;
  licenseNumber: string;
  driverId: string | User;
  driverAddress?: string;
  officerId: string | User;
  officerBadgeNumber?: string;
  violationType: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  occurredAt: string;
  fineAmountInr: number;
  fineAmountWei: string;
  dueDate: string;
  status: ViolationStatus;
  onChainHash?: string;
  evidenceUrl?: string;
  vehiclePlate: string;
  paidAt?: string;
  paidTxHash?: string;
  history?: Array<{
    action: string;
    actorId: string;
    actorRole: string;
    timestamp: string;
    notes?: string;
    txHash?: string;
  }>;
  createdAt: string;
}

export type DisputeStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface Dispute {
  _id: string;
  disputeId: string;
  violationId: string;
  onChainViolationId?: number;
  driverId: string | User;
  driverAddress?: string;
  reason: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  submittedAt: string;
  resolvedAt?: string;
  resolvedBy?: string | User;
  resolutionNotes?: string;
  onChainHash?: string;
  txHash?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  violationId: string;
  onChainViolationId: number;
  payerAddress: string;
  amountWei: string;
  amountInr: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface AuditLogItem {
  _id: string;
  action: string;
  actorId?: User;
  actorEmail?: string;
  actorRole?: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  users: { total: number; drivers: number; officers: number };
  licenses: { total: number; issued: number; pending: number; suspended: number };
  violations: { total: number; pending: number; paid: number; disputed: number };
  disputes: { pending: number };
  financials: { totalRevenueInr: number; totalTransactions: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  licenses?: T[];
  violations?: T[];
  logs?: T[];
  total: number;
  page: number;
  totalPages: number;
}
