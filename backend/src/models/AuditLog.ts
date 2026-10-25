import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actorId?: Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  targetType: 'license' | 'violation' | 'dispute' | 'payment' | 'user' | 'system';
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorEmail: {
      type: String,
    },
    actorRole: {
      type: String,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export async function createAuditLog(entry: {
  action: string;
  actorId?: Types.ObjectId;
  actorEmail?: string;
  actorRole?: string;
  targetType: 'license' | 'violation' | 'dispute' | 'payment' | 'user' | 'system';
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      ...entry,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
