import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import transactionRoutes from './routes/transactionRoutes';
import kycRoutes from './routes/kycRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { cronService } from './services/cronService';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estate';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize cron jobs after database connection
    cronService; // This will trigger the singleton initialization
    console.log('Cron jobs initialized');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payments', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Estate API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 