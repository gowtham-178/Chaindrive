import mongoose, { Document, Schema, Types } from 'mongoose';

export type LicenseStatus = 'applied' | 'approved' | 'issued' | 'suspended' | 'revoked' | 'rejected';

export interface ILicenseHistory {
  action: string;
  actorId: Types.ObjectId;
  actorRole: string;
  timestamp: Date;
  notes?: string;
  txHash?: string;
}

export interface ILicense extends Document {
  licenseNumber: string;
  userId: Types.ObjectId;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  vehicleClasses: string[]; // e.g. ['MCWG', 'LMV']
  status: LicenseStatus;
  onChainHash?: string;
  salt?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  applicationDate: Date;
  applicationNotes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  revocationReason?: string;
  documents?: {
    idProofUrl?: string;
    addressProofUrl?: string;
    medicalCertificateUrl?: string;
  };
  qrCode?: string;
  history: ILicenseHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    licenseNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    vehicleClasses: [{ type: String, required: true }],
    status: {
      type: String,
      enum: ['applied', 'approved', 'issued', 'suspended', 'revoked', 'rejected'],
      default: 'applied',
      index: true,
    },
    onChainHash: { type: String, sparse: true, index: true },
    salt: { type: String },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    applicationDate: { type: Date, default: Date.now },
    applicationNotes: { type: String },
    rejectionReason: { type: String },
    suspensionReason: { type: String },
    revocationReason: { type: String },
    documents: {
      idProofUrl: { type: String },
      addressProofUrl: { type: String },
      medicalCertificateUrl: { type: String },
    },
    qrCode: { type: String },
    history: [
      {
        action: { type: String, required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorRole: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
        txHash: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const License = mongoose.model<ILicense>('License', LicenseSchema);
