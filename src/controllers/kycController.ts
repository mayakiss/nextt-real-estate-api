import { Request, Response } from 'express';
import { User } from '../models/User';

// Submit KYC information
export const submitKYC = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const kycData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's KYC information
    user.kyc = kycData;
    user.kycVerified = false; // Reset verification status when new KYC is submitted
    await user.save();

    res.status(200).json({
      message: 'KYC information submitted successfully',
      kyc: user.kyc,
      kycVerified: user.kycVerified
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({ message: 'Error submitting KYC information' });
  }
};

// Get KYC status
export const getKYCStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('kyc kycVerified');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      kyc: user.kyc,
      kycVerified: user.kycVerified
    });
  } catch (error) {
    console.error('Error getting KYC status:', error);
    res.status(500).json({ message: 'Error retrieving KYC status' });
  }
};

// Admin: Verify KYC
export const verifyKYC = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { verified, rejectionReason } = req.body;

    // Check if user is admin
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can verify KYC' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycVerified = verified;
    if (!verified && rejectionReason) {
      // You might want to add a field to store rejection reason
      // user.kycRejectionReason = rejectionReason;
    }

    await user.save();

    res.status(200).json({
      message: verified ? 'KYC verified successfully' : 'KYC verification rejected',
      kycVerified: user.kycVerified
    });
  } catch (error) {
    console.error('Error verifying KYC:', error);
    res.status(500).json({ message: 'Error verifying KYC' });
  }
};

// Admin: Get all pending KYC submissions
export const getPendingKYC = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view pending KYC submissions' });
    }

    const pendingUsers = await User.find({
      kyc: { $ne: null },
      kycVerified: false
    }).select('email firstName lastName kyc createdAt');

    res.status(200).json(pendingUsers);
  } catch (error) {
    console.error('Error getting pending KYC:', error);
    res.status(500).json({ message: 'Error retrieving pending KYC submissions' });
  }
};

// Update KYC information
export const updateKYC = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const kycData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow updates if KYC is not verified
    if (user.kycVerified) {
      return res.status(400).json({ message: 'Cannot update verified KYC information' });
    }

    user.kyc = { ...user.kyc, ...kycData };
    await user.save();

    res.status(200).json({
      message: 'KYC information updated successfully',
      kyc: user.kyc
    });
  } catch (error) {
    console.error('Error updating KYC:', error);
    res.status(500).json({ message: 'Error updating KYC information' });
  }
}; 