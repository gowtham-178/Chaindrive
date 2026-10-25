import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'officer' | 'driver';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
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
      postalCode?: string;
      pincode?: string;
    };
  };
  refreshToken?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'officer', 'driver'],
      required: true,
      default: 'driver',
    },
    walletAddress: {
      type: String,
      sparse: true,
      index: true,
    },
    profile: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      dateOfBirth: { type: Date },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        pincode: { type: String },
      },
    },
    refreshToken: {
      type: String,
      select: false, // never returned by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = ret as Record<string, any>;
        delete r['passwordHash'];
        delete r['refreshToken'];
        return r;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
