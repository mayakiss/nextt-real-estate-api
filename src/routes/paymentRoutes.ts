import express, { RequestHandler } from 'express';
import { handlePaymentCallback } from '../controllers/paymentCallbackController';

const router = express.Router();

// NowPayments callback endpoint
router.post('/callback', handlePaymentCallback as RequestHandler);

export default router; 