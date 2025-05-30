import mongoose from 'mongoose';
import { User } from './User';
import { Project } from './Project';

export interface Transaction extends mongoose.Document {
  type:  'payout' | 'deposit' | 'withdrawal';
  amount: number;
  project?: mongoose.Types.ObjectId | Project;
  user: mongoose.Types.ObjectId | User;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  reference?: string | null;
  orderId?: string | null;
  walletAddress?: string | null;
}

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [ 'payout', 'deposit', 'withdrawal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'pending',
    },
    reference: {
      type: String,
      required: false
    },
    orderId: {
      type: String,
      required: false
    },
    walletAddress: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ project: 1, date: -1 });
transactionSchema.index({ type: 1, status: 1 });

export const Transaction = mongoose.model<Transaction>('Transaction', transactionSchema); 