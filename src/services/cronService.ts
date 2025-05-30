import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface PayoutResponse {
  success: boolean;
  totalProcessed: number;
  successfulPayouts: number;
  failedPayouts: number;
  error?: string;
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

class CronService {
  private static instance: CronService;

  private constructor() {
    this.initializeJobs();
  }

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  private initializeJobs() {
    // Schedule daily payout job to run at 6 PM UTC (18:00)
    // Cron format: Minute Hour Day Month Day-of-week
    cron.schedule('0 18 * * *', async () => {
      try {
        console.log('Starting daily payout processing...');
        const response = await axios.post<PayoutResponse>(
          `${BACKEND_URL}/api/transactions/process-daily-payouts`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              // Add any necessary authentication headers
              'Authorization': `Bearer ${process.env.CRON_API_KEY}`
            }
          }
        );

        if (response.data.success) {
          console.log('Daily payouts processed successfully:', {
            totalProcessed: response.data.totalProcessed,
            successfulPayouts: response.data.successfulPayouts,
            failedPayouts: response.data.failedPayouts
          });
        } else {
          console.error('Failed to process daily payouts:', response.data.error);
        }
      } catch (error) {
        console.error('Error in daily payout cron job:', error);
      }
    }, {
      timezone: "UTC"
    });
  }
}

// Export singleton instance
export const cronService = CronService.getInstance(); 