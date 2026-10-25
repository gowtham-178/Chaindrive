import mongoose, { Document, Schema, Types } from 'mongoose';

export type ViolationStatus = 'pending' | 'paid' | 'disputed' | 'resolved' | 'cancelled';

export interface IViolationHistory {
  action: string;
  actorId: Types.ObjectId;
  actorRole: string;
  timestamp: Date;
  notes?: string;
  txHash?: string;
}

export interface IViolation extends Document {
  violationId: string;
  onChainViolationId?: number;
  licenseNumber: string;
  driverId: Types.ObjectId;
  driverAddress?: string;
  officerId: Types.ObjectId;
  officerBadgeNumber?: string;
  violationType: string;
  description: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  occurredAt: Date;
  fineAmountInr: number;
  fineAmountWei: string;
  dueDate: Date;
  status: ViolationStatus;
  onChainHash?: string;
  salt?: string;
  evidenceUrl?: string;
  vehiclePlate: string;
  paidAt?: Date;
  paidTxHash?: string;
  history: IViolationHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ViolationSchema = new Schema<IViolation>(
  {
    violationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    onChainViolationId: {
      type: Number,
      sparse: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driverAddress: {
      type: String,
    },
    officerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    officerBadgeNumber: {
      type: String,
    },
    violationType: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    occurredAt: {
      type: Date,
      required: true,
    },
    fineAmountInr: {
      type: Number,
      required: true,
    },
    fineAmountWei: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'disputed', 'resolved', 'cancelled'],
      default: 'pending',
      index: true,
    },
    onChainHash: {
      type: String,
      sparse: true,
      index: true,
    },
    salt: {
      type: String,
    },
    evidenceUrl: {
      type: String,
    },
    vehiclePlate: {
      type: String,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    paidTxHash: {
      type: String,
    },
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

export const Violation = mongoose.model<IViolation>('Violation', ViolationSchema);
