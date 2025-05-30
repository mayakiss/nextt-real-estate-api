import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

interface Document {
  name: string;
  url: string;
}

interface ProjectDetails {
  propertyType: string;
  size: string;
  units: number;
  yearBuilt: number;
  occupancyRate: number;
  features: string[];
  documents: Document[];
  paymentSchedule: string;
}

export interface Project extends mongoose.Document {
  title: string;
  description: string;
  location: string;
  type: 'residential' | 'commercial' | 'land';
  status: 'available' | 'sold' | 'reserved';
  features: string[];
  images: string[];
  owner: mongoose.Types.ObjectId;
  roi: number;
  term: number;
  funded: number;
  target: number;
  minInvestment: number;
  startDate: Date;
  endDate: Date;
  details: ProjectDetails;
  createdAt: Date;
  updatedAt: Date;
}

const projectDetailsSchema = new mongoose.Schema({
  propertyType: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  yearBuilt: {
    type: Number,
    required: true,
  },
  occupancyRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  features: [{
    type: String,
    trim: true,
  }],
  documents: [{
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  }],
  paymentSchedule: {
    type: String,
    required: true,
  },
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['residential', 'commercial', 'land'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },
    features: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
      trim: true,
    }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roi: {
      type: Number,
      required: true,
      min: 0,
    },
    term: {
      type: Number,
      required: true,
      min: 0,
    },
    funded: {
      type: Number,
      default: 0,
      min: 0,
    },
    target: {
      type: Number,
      required: true,
      min: 0,
    },
    minInvestment: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    details: {
      type: projectDetailsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
projectSchema.index({ title: 'text', description: 'text', location: 'text' });

export const Project = mongoose.model<Project>('Project', projectSchema); 