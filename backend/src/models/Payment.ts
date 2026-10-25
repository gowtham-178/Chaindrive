import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  violationId: string;
  onChainViolationId: number;
  payerAddress: string;
  amountWei: string;
  amountInr: number;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
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
      required: true,
      index: true,
    },
    payerAddress: {
      type: String,
      required: true,
      index: true,
    },
    amountWei: {
      type: String,
      required: true,
    },
    amountInr: {
      type: Number,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'confirmed',
      index: true,
    },
    receiptUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
