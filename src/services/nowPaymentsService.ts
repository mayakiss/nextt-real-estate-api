import axios from 'axios';
import dotenv from 'dotenv';
import speakeasy from 'speakeasy';

dotenv.config();

interface AuthResponse {
  token: string;
}

interface CreateInvoiceRequest {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
}

interface CreateInvoiceResponse {
  id: string;
  token_id: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
}

interface WithdrawalRequest {
  address: string;
  currency: string;
  amount: number;
  ipn_callback_url?: string;
  extra_id?: string;
}

interface BatchWithdrawalResponse {
  id: string;
  withdrawals: {
    id: string;
    address: string;
    currency: string;
    amount: string;
    batch_withdrawal_id: string;
    status: string;
    hash: string | null;
    error: string | null;
    created_at: string;
    updated_at: string | null;
  }[];
}

class NowPaymentsService {
  private static instance: NowPaymentsService;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  
  private readonly BASE_URL = 'https://api.nowpayments.io/v1';
  private readonly API_KEY = process.env.NOWPAYMENTS_API_KEY || 'E5SAS92-P3M42QW-K1VJX2N-XC43277';
  private readonly BASE_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly BASE_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
  private readonly TWO_FA_SECRET = process.env.NOWPAYMENTS_2FA_SECRET || 'IE3FCYSEMF2FUM2G';
  
  private readonly credentials = {
    email: process.env.NOWPAYMENTS_EMAIL || 'iss.tankary@gmail.com',
    password: process.env.NOWPAYMENTS_PASSWORD || 'Bentac-6ximbi-dekhic'
  };

  private constructor() {
    // Private constructor to enforce singleton
    if (!this.credentials.email || !this.credentials.password) {
      throw new Error('NowPayments credentials not found in environment variables');
    }
  }

  public static getInstance(): NowPaymentsService {
    if (!NowPaymentsService.instance) {
      NowPaymentsService.instance = new NowPaymentsService();
    }
    return NowPaymentsService.instance;
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.BASE_URL}/auth`,
        {
          email: this.credentials.email,
          password: this.credentials.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.token) {
        throw new Error('Invalid authentication response');
      }

      this.token = response.data.token;
      // Token expires in 5 minutes (300 seconds) as per NowPayments API
      this.tokenExpiry = new Date(Date.now() + 300 * 1000);
      return this.token;
    } catch (error) {
      console.error('NowPayments authentication failed:', error);
      throw new Error('Failed to authenticate with NowPayments');
    }
  }

  private async getValidToken(): Promise<string> {
    if (!this.token || !this.tokenExpiry || Date.now() >= this.tokenExpiry.getTime()) {
      return this.authenticate();
    }
    return this.token;
  }

  private generateOrderId(): string {
    const prefix = 'NEXTT';
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    return `${prefix}-${randomNum}`;
  }

  private generate2FACode(): string {
    if (!this.TWO_FA_SECRET) {
      throw new Error('2FA secret not configured');
    }
    return speakeasy.totp({
      secret: this.TWO_FA_SECRET,
      encoding: 'base32'
    });
  }

  public async createInvoice(amount: number, description: string): Promise<{ 
    invoice_url: string;
    order_id: string;
    price_amount: string;
    created_at: string;
  }> {
    try {
      const orderId = this.generateOrderId();
      
      const invoiceData: CreateInvoiceRequest = {
        price_amount: amount,
        price_currency: 'usd',
        order_id: orderId,
        order_description: description,
        ipn_callback_url: `${this.BASE_BACKEND_URL}/api/payments/callback`,
        success_url: `${this.BASE_FRONTEND_URL}/payment/success`,
        cancel_url: `${this.BASE_FRONTEND_URL}/payment/cancel`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await axios.post<CreateInvoiceResponse>(
        `${this.BASE_URL}/invoice`,
        invoiceData,
        {
          headers: {
            'x-api-key': this.API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        invoice_url: response.data.invoice_url,
        order_id: response.data.order_id,
        price_amount: response.data.price_amount,
        created_at: response.data.created_at
      };
    } catch (error) {
      console.error('Failed to create NowPayments invoice:', error);
      throw new Error('Failed to create payment invoice');
    }
  }

  public async createWithdrawal(withdrawalData: WithdrawalRequest): Promise<BatchWithdrawalResponse> {
    try {
      const token = await this.getValidToken();

      const payload = {
        ipn_callback_url: `${this.BASE_BACKEND_URL}/api/payments/withdrawal-callback`,
        withdrawals: [
          {
            ...withdrawalData,
            ipn_callback_url: withdrawalData.ipn_callback_url || `${this.BASE_BACKEND_URL}/api/payments/withdrawal-callback`
          }
        ]
      };

      const response = await axios.post<BatchWithdrawalResponse>(
        `${this.BASE_URL}/payout`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Automatically verify the withdrawal
      await this.verifyWithdrawal(response.data.id);

      return response.data;
    } catch (error) {
      console.error('Failed to create withdrawal:', error);
      throw new Error('Failed to create withdrawal');
    }
  }

  private async verifyWithdrawal(batchWithdrawalId: string): Promise<void> {
    try {
      const token = await this.getValidToken();
      const verificationCode = this.generate2FACode();

      await axios.post(
        `${this.BASE_URL}/payout/${batchWithdrawalId}/verify`,
        { verification_code: verificationCode },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to verify withdrawal:', error);
      throw new Error('Failed to verify withdrawal');
    }
  }

  // This method can be used to check if the service can authenticate successfully
  public async testAuthentication(): Promise<boolean> {
    try {
      await this.getValidToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a singleton instance
export const nowPaymentsService = NowPaymentsService.getInstance();
