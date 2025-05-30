import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { nowPaymentsService } from '../services/nowPaymentsService';

// Constants for daily payout percentages based on membership level
const DAILY_PAYOUT_RATES = {
  minimum: 0.003, // 0.3% daily (approx 9% monthly)
  smarty: 0.005,  // 0.5% daily (approx 15% monthly)
  ultimium: 0.008 // 0.8% daily (approx 24% monthly)
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    // Get user ID from the token (set by auth middleware)
    const userId = (req as any).user._id;

    const transaction = new Transaction({
      ...req.body,
      user: userId,
      status: 'pending'
    });

    // For deposits, initiate NowPayments payment
    if (transaction.type === 'deposit') {
      try {
        // Save transaction first to get the ID
        await transaction.save();
        
        // Create payment invoice with NowPayments
        const paymentData = await nowPaymentsService.createInvoice(
          transaction.amount,
          `Deposit to wallet - Transaction ID: ${transaction._id}`
        );

        // Update transaction with NowPayments details
        transaction.orderId = paymentData.order_id;
        transaction.reference = paymentData.invoice_url;
        await transaction.save();

        // Return transaction details and payment URL to client
        return res.status(201).json({
          transaction,
          payment_url: paymentData.invoice_url
        });
      } catch (error) {
        // If payment initiation fails, mark transaction as failed
        transaction.status = 'failed';
        await transaction.save();
        console.error('Payment initiation error:', error);
        return res.status(400).json({ error: 'Failed to initiate payment' });
      }
    }

    // Handle withdrawal requests
    if (transaction.type === 'withdrawal') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has sufficient balance
      if (user.balance < transaction.amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Check minimum withdrawal amount
      if (transaction.amount < 25) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is 25 USDT' });
      }

      try {
        // Save transaction first to get the ID
        await transaction.save();

        // Extract wallet address from description or use a default one
        
        const walletAddress = transaction.walletAddress; 

        if (!walletAddress) {
          throw new Error('No wallet address provided');
        }

        // Initiate withdrawal with NowPayments
        const withdrawalData = await nowPaymentsService.createWithdrawal({
          address: walletAddress,
          currency: 'usdt',
          amount: transaction.amount,
          extra_id: transaction._id.toString() // Use transaction ID as reference
        });

        // Update transaction with withdrawal details
        transaction.orderId = withdrawalData.withdrawals[0].batch_withdrawal_id;
        transaction.reference = withdrawalData.withdrawals[0].id;
        
        // Deduct balance immediately
        user.balance -= transaction.amount;
        await user.save();
        
        await transaction.save();
        
        // Return in the same format as before
        return res.status(201).json({
          transaction
        });
      } catch (error) {
        transaction.status = 'failed';
        await transaction.save();
        console.error('Withdrawal initiation error:', error);
        return res.status(400).json({ error: 'Failed to initiate withdrawal' });
      }
    }

    // Handle payouts
    if (transaction.type === 'payout') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      user.balance += transaction.amount;
      await user.save();
    }

    await transaction.save();
    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(400).json({ error: error });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const query: any = { user: (req as any).user._id };

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(query)
      .populate('project', 'title type')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: (req as any).user._id,
    }).populate('project', 'title type');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch transaction' });
  }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: (req as any).user._id,
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow status updates
    transaction.status = status;
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update transaction' });
  }
};

export const getUserInvestmentSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    
    const summary = await Transaction.aggregate([
      { $match: { user: userId, type: 'investment' } },
      {
        $group: {
          _id: '$project',
          totalInvested: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch investment summary' });
  }
};

/**
 * Process daily payouts for all subscribed users
 * This function is triggered by a cron job at 6 PM UTC daily
 */
export const processDailyPayouts = async (req: Request, res: Response) => {
  try {
    // Get all users with a membership level
    const subscribedUsers = await User.find({ 
      membershipLevel: { $in: ['minimum', 'smarty', 'ultimium'] }
    });

    const payoutResults = [];
    const errors = [];

    // Process payout for each subscribed user
    for (const user of subscribedUsers) {
      try {
        // Get the user's subscription amount based on their membership level
        let subscriptionAmount = 0;
        switch (user.membershipLevel) {
          case 'minimum':
            subscriptionAmount = 500;
            break;
          case 'smarty':
            subscriptionAmount = 1000;
            break;
          case 'ultimium':
            subscriptionAmount = 5000;
            break;
        }

        // Calculate daily payout amount
        const payoutRate = DAILY_PAYOUT_RATES[user.membershipLevel as keyof typeof DAILY_PAYOUT_RATES];
        const payoutAmount = subscriptionAmount * payoutRate;

        // Create a transaction record for the payout
        const transaction = await Transaction.create({
          userId: user._id,
          type: 'payout',
          amount: payoutAmount,
          status: 'completed',
          description: `Daily payout for ${user.membershipLevel} membership`,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Update user's balance
        await User.findByIdAndUpdate(
          user._id,
          { $inc: { balance: payoutAmount } },
          { new: true }
        );

        payoutResults.push({
          userId: user._id,
          membershipLevel: user.membershipLevel,
          payoutAmount,
          transactionId: transaction._id
        });
      } catch (error) {
        errors.push({
          userId: user._id,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    // Return summary of processed payouts
    res.json({
      success: true,
      totalProcessed: subscribedUsers.length,
      successfulPayouts: payoutResults.length,
      failedPayouts: errors.length,
      payoutResults,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error processing daily payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process daily payouts' 
    });
  }
}; 