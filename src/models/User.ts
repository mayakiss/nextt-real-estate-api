import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface KYC {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  idFront: string | null;
  idBack: string | null;
  selfie: string | null;
  proofOfAddress: string | null;
}

export interface User extends mongoose.Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  balance: number;
  role: 'investor' | 'admin';
  isVerified: boolean;
  kycVerified: boolean;
  kyc: KYC;
  membershipLevel?: string; // 'minimum' | 'premium' | etc.
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const kycSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  idType: {
    type: String,
    enum: ['passport', 'drivers_license', 'national_id'],
    required: true,
  },
  idNumber: {
    type: String,
    required: true,
    trim: true,
  },
  idFront: {
    type: String,
    default: null,
  },
  idBack: {
    type: String,
    default: null,
  },
  selfie: {
    type: String,
    default: null,
  },
  proofOfAddress: {
    type: String,
    default: null,
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    kycVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    kyc: {
      type: kycSchema,
      default: null,
    },
    membershipLevel: {
      type: String,
      enum: ['minimum', 'silver', 'gold', 'diamond', null],
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<User>('User', userSchema); 