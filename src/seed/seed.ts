import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Transaction } from '../models/Transaction';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/estate';

const mockProjects = [
  {
    title: 'Riverfront Residences',
    description: 'Luxury waterfront apartments in a prime downtown location with stunning views and premium amenities.',
    location: 'Miami, FL',
    type: 'residential',
    images: ['https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
    roi: 8.5,
    term: 36,
    funded: 2750000,
    target: 5000000,
    minInvestment: 5000,
    status: 'available',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2028-01-15'),
    details: {
      propertyType: 'Multi-family',
      size: '150,000 sq ft',
      units: 45,
      yearBuilt: 2022,
      occupancyRate: 92,
      features: [
        'Rooftop pool and lounge',
        'State-of-the-art fitness center',
        'Smart home technology',
        'EV charging stations',
        'Concierge service'
      ],
      documents: [
        { name: 'Investment Prospectus', url: '#' },
        { name: 'Financial Projections', url: '#' },
        { name: 'Property Appraisal', url: '#' }
      ],
      paymentSchedule: 'Monthly dividends'
    }
  },
  {
    title: 'Sunnyvale Tech Hub',
    description: 'Modern office complex in Silicon Valley designed for tech startups and established companies.',
    location: 'Sunnyvale, CA',
    type: 'commercial',
    images: ['https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'],
    roi: 7.2,
    term: 48,
    funded: 4200000,
    target: 8000000,
    minInvestment: 10000,
    status: 'available',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2028-10-01'),
    details: {
      propertyType: 'Office',
      size: '85,000 sq ft',
      units: 12,
      yearBuilt: 2020,
      occupancyRate: 87,
      features: [
        'High-speed fiber internet',
        'Collaborative workspaces',
        'Conference facilities',
        'LEED certified green building',
        'Secure access control'
      ],
      documents: [
        { name: 'Investment Prospectus', url: '#' },
        { name: 'Financial Projections', url: '#' },
        { name: 'Property Appraisal', url: '#' }
      ],
      paymentSchedule: 'Quarterly dividends'
    }
  }
];

const mockUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isVerified: true,
    kycVerified: true,
    kyc: {
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: '1980-01-01',
      nationality: 'US',
      address: '123 Admin Street',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'United States',
      idType: 'passport',
      idNumber: 'A12345678',
      idFront: 'https://example.com/id-front.jpg',
      idBack: 'https://example.com/id-back.jpg',
      selfie: 'https://example.com/selfie.jpg',
      proofOfAddress: 'https://example.com/address-proof.pdf'
    }
  },
  {
    email: 'user@example.com',
    password: 'user123',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    isVerified: true,
    kycVerified: true,
    kyc: {
      firstName: 'Regular',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      nationality: 'US',
      address: '456 User Avenue',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
      idType: 'drivers_license',
      idNumber: 'DL12345678',
      idFront: 'https://example.com/user-id-front.jpg',
      idBack: 'https://example.com/user-id-back.jpg',
      selfie: 'https://example.com/user-selfie.jpg',
      proofOfAddress: 'https://example.com/user-address-proof.pdf'
    }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Transaction.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = await User.create(mockUsers);
    console.log('Created users');

    // Create projects with owner reference
    const projects = await Project.create(
      mockProjects.map(project => ({
        ...project,
        owner: users[0]._id // Admin user as owner
      }))
    );
    console.log('Created projects');

    // Create transactions
    const transactions = [
      {
        type: 'investment',
        amount: 5000,
        project: projects[0]._id,
        user: users[1]._id,
        date: new Date('2025-01-20'),
        status: 'completed'
      },
      {
        type: 'investment',
        amount: 15000,
        project: projects[1]._id,
        user: users[1]._id,
        date: new Date('2024-10-15'),
        status: 'completed'
      },
      {
        type: 'dividend',
        amount: 35.42,
        project: projects[0]._id,
        user: users[1]._id,
        date: new Date('2025-02-28'),
        status: 'completed'
      }
    ];

    await Transaction.create(transactions);
    console.log('Created transactions');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 