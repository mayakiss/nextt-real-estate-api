import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    // Log the entire callback payload for debugging
    console.log('NowPayments Callback Received:', {
      body: req.body,
      headers: req.headers
    });

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'Callback received' });

  } catch (error) {
    console.error('Payment callback error:', error);
    // Still send 200 to prevent retries, but log the error
    res.status(200).json({ status: 'Callback processed with errors' });
  }
}; 