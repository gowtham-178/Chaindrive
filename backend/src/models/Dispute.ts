import mongoose, { Document, Schema, Types } from 'mongoose';

export type DisputeStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface IDispute extends Document {
  disputeId: string;
  violationId: string;
  onChainViolationId?: number;
  driverId: Types.ObjectId;
  driverAddress?: string;
  reason: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  submittedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  resolutionNotes?: string;
  onChainHash?: string;
  salt?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    disputeId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    violationId: {
      type: String,
      required: true,
      index: true,
    },
    onChainViolationId: {
      type: Number,
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
    reason: {
      type: String,
      required: true,
    },
    evidenceUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'accepted', 'rejected'],
      default: 'submitted',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
    },
    onChainHash: {
      type: String,
    },
    salt: {
      type: String,
    },
    txHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
