import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface JwtPayload {
  _id: string;
}

interface RequestWithUser extends Request {
  user?: User;
}

export const authenticateAdmin = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    // Check for API key for cron jobs
    const cronApiKey = req.headers.authorization?.split(' ')[1];
    if (cronApiKey && cronApiKey === process.env.CRON_API_KEY) {
      return next();
    }

    // Check for JWT token for admin users
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here') as JwtPayload;
    const user = await User.findById(decoded._id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}; 