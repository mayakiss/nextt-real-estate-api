import express from 'express';
import { auth } from '../middleware/auth';
import {
  submitKYC,
  getKYCStatus,
  verifyKYC,
  getPendingKYC,
  updateKYC
} from '../controllers/kycController';

const router = express.Router();

// User routes (require authentication)
router.post('/submit', auth, submitKYC);
router.get('/status', auth, getKYCStatus);
router.put('/update', auth, updateKYC);

// Admin routes (require authentication and admin role)
router.get('/pending', auth, getPendingKYC);
router.post('/verify/:userId', auth, verifyKYC);

export default router; 