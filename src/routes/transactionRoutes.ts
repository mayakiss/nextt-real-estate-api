import express, { RequestHandler } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransactionStatus,
  getUserInvestmentSummary,
  processDailyPayouts,
} from '../controllers/transactionController';
import { auth } from '../middleware/auth';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All routes are protected
router.use(auth);

// Transaction routes
router.post('/', createTransaction as RequestHandler);
router.get('/', getTransactions as RequestHandler);
router.get('/summary', getUserInvestmentSummary as RequestHandler);
router.get('/:id', getTransaction as RequestHandler);
router.patch('/:id/status', updateTransactionStatus as RequestHandler);

// Add the daily payout route
router.post('/process-daily-payouts', authenticateAdmin, processDailyPayouts);

export default router; 