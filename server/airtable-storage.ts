import { airtableService } from './airtable';
import type { User, UpsertUser, InsertCaptionJob, CaptionJob, InsertBilling, Billing } from '@shared/schema';

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(
    userId: string, 
    stripeCustomerId: string, 
    stripeSubscriptionId?: string
  ): Promise<User>;
  updateUserPlanTier(userId: string, planTier: string): Promise<User>;
  updateUserMinutesCaptioned(userId: string, additionalMinutes: number): Promise<User>;

  // Caption Job operations
  createCaptionJob(job: InsertCaptionJob): Promise<CaptionJob>;
  getCaptionJob(id: number): Promise<CaptionJob | undefined>;
  getCaptionJobsByUser(userId: string): Promise<CaptionJob[]>;
  updateCaptionJobStatus(
    id: number, 
    outputCaptionFile?: string, 
    outputVideoFile?: string,
    errorLog?: string
  ): Promise<CaptionJob | undefined>;

  // Billing operations
  createBilling(billing: InsertBilling): Promise<Billing>;
  getBillingByUser(userId: string): Promise<Billing[]>;
}

export class AirtableStorage implements IStorage {
  // Convert Airtable record to User type
  private airtableToUser(record: any): User {
    const fields = record.fields;
    const fullName = fields['Name'] || '';
    const nameParts = fullName.split(' ');
    
    return {
      id: fields['Email'] || record.id, // Use email as ID since we removed user ID mapping
      email: fields['Email'] || null,
      firstName: nameParts[0] || null,
      lastName: nameParts.slice(1).join(' ') || null,
      profileImageUrl: null,
      planTier: fields['Plan Tier'] || 'free',
      totalMinutesCaptioned: '0', // Start with 0, will be updated from caption jobs
      stripeCustomerId: fields['Stripe Customer ID'] || null,
      stripeSubscriptionId: null,
      createdAt: fields['Created At'] ? new Date(fields['Created At']) : null,
      updatedAt: fields['Created At'] ? new Date(fields['Created At']) : null,
    };
  }

  // Convert Airtable record to CaptionJob type
  private airtableToCaptionJob(record: any): CaptionJob {
    const fields = record.fields;
    return {
      id: fields['Job ID'],
      userId: fields['User ID'],
      filename: fields['Filename'],
      videoFileUrl: fields['Video File URL'] || null,
      videoDuration: (fields['Video Duration'] || 0).toString(),
      watermarked: fields['Watermarked'] || false,
      status: fields['Status'] || 'pending',
      outputCaptionFile: fields['Output Caption File'] || null,
      outputVideoFile: fields['Output Video File'] || null,
      captionOptions: fields['Caption Options'] ? JSON.parse(fields['Caption Options']) : null,
      errorLog: fields['Error Log'] || null,
      createdAt: fields['Created At'] ? new Date(fields['Created At']) : null,
      updatedAt: fields['Updated At'] ? new Date(fields['Updated At']) : null,
    };
  }

  // Convert Airtable record to Billing type
  private airtableToBilling(record: any): Billing {
    const fields = record.fields;
    return {
      id: parseInt(record.id, 36), // Use Airtable record ID as numeric ID
      userId: fields['User ID'],
      status: fields['Status'],
      stripePaymentId: fields['Stripe Payment ID'] || null,
      paymentDate: fields['Payment Date'] ? new Date(fields['Payment Date']) : null,
      amount: (fields['Amount'] || 0).toString(),
      plan: fields['Plan Tier'] || null,
      minutesPurchased: (fields['Minutes Purchased'] || 0).toString(),
      createdAt: fields['Created At'] ? new Date(fields['Created At']) : null,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const record = await airtableService.getUser(id);
      return record ? this.airtableToUser(record) : undefined;
    } catch (error) {
      console.error('Error getting user from Airtable:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUser(userData.id);
    const isNewUser = !existingUser;

    try {
      let record;
      if (existingUser) {
        // Update existing user
        record = await airtableService.updateUser(userData.id, {
          email: userData.email || undefined,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          planTier: userData.planTier || 'free',
          totalMinutesCaptioned: parseInt(userData.totalMinutesCaptioned || '0'),
          stripeCustomerId: userData.stripeCustomerId || undefined,
          stripeSubscriptionId: userData.stripeSubscriptionId || undefined,
        });
      } else {
        // Create new user
        record = await airtableService.createUser({
          id: userData.id,
          email: userData.email || undefined,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          profileImageUrl: userData.profileImageUrl || undefined,
          planTier: userData.planTier || 'free',
          totalMinutesCaptioned: parseInt(userData.totalMinutesCaptioned || '0'),
          stripeCustomerId: userData.stripeCustomerId || undefined,
          stripeSubscriptionId: userData.stripeSubscriptionId || undefined,
        });
      }

      const user = this.airtableToUser(record);

      // Send webhook for new account creation
      if (isNewUser) {
        try {
          await fetch('https://hook.us2.make.com/4ou2o5iracc2tpssh7yeh2tkukuenl9x', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'user_created',
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              planTier: user.planTier,
              totalMinutesCaptioned: parseFloat(user.totalMinutesCaptioned || '0'),
              stripeCustomerId: user.stripeCustomerId,
              stripeSubscriptionId: user.stripeSubscriptionId,
              createdAt: user.createdAt,
            }),
          });
          console.log('User creation webhook sent successfully');
        } catch (error) {
          console.warn('Failed to send user creation webhook:', error);
        }
      }

      return user;
    } catch (error) {
      console.error('Error upserting user in Airtable:', error);
      throw error;
    }
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    try {
      const record = await airtableService.updateUser(userId, {
        stripeCustomerId,
        stripeSubscriptionId,
      });
      return this.airtableToUser(record);
    } catch (error) {
      console.error('Error updating user stripe info in Airtable:', error);
      throw error;
    }
  }

  async updateUserPlanTier(userId: string, planTier: string): Promise<User> {
    try {
      const record = await airtableService.updateUser(userId, {
        planTier,
      });
      return this.airtableToUser(record);
    } catch (error) {
      console.error('Error updating user plan tier in Airtable:', error);
      throw error;
    }
  }

  async updateUserMinutesCaptioned(userId: string, additionalMinutes: number): Promise<User> {
    try {
      const currentUser = await this.getUser(userId);
      if (!currentUser) {
        throw new Error(`User ${userId} not found`);
      }

      const currentMinutes = parseFloat(currentUser.totalMinutesCaptioned || '0');
      const newTotal = currentMinutes + additionalMinutes;

      const record = await airtableService.updateUser(userId, {
        totalMinutesCaptioned: newTotal,
      });
      return this.airtableToUser(record);
    } catch (error) {
      console.error('Error updating user minutes in Airtable:', error);
      throw error;
    }
  }

  async createCaptionJob(job: InsertCaptionJob): Promise<CaptionJob> {
    try {
      // Generate a unique job ID (using timestamp + random)
      const jobId = Date.now() + Math.floor(Math.random() * 1000);
      
      const record = await airtableService.createCaptionJob({
        id: jobId,
        userId: job.userId,
        filename: job.filename,
        videoFileUrl: job.videoFileUrl || undefined,
        videoDuration: parseFloat(job.videoDuration || '0'),
        watermarked: job.watermarked || false,
        status: job.status || 'pending',
        captionOptions: job.captionOptions,
      });

      return this.airtableToCaptionJob(record);
    } catch (error) {
      console.error('Error creating caption job in Airtable:', error);
      throw error;
    }
  }

  async getCaptionJob(id: number): Promise<CaptionJob | undefined> {
    try {
      const records = await airtableService.getCaptionJobsByUser(''); // We'll filter by job ID
      const record = records.find(r => r.fields['Job ID'] === id);
      return record ? this.airtableToCaptionJob(record) : undefined;
    } catch (error) {
      console.error('Error getting caption job from Airtable:', error);
      return undefined;
    }
  }

  async getCaptionJobsByUser(userId: string): Promise<CaptionJob[]> {
    try {
      const records = await airtableService.getCaptionJobsByUser(userId);
      return records.map(record => this.airtableToCaptionJob(record));
    } catch (error) {
      console.error('Error getting caption jobs from Airtable:', error);
      return [];
    }
  }

  async updateCaptionJobStatus(
    id: number, 
    outputCaptionFile?: string, 
    outputVideoFile?: string,
    errorLog?: string
  ): Promise<CaptionJob | undefined> {
    try {
      const record = await airtableService.updateCaptionJob(id, {
        outputCaptionFile,
        outputVideoFile,
        errorLog,
      });
      return this.airtableToCaptionJob(record);
    } catch (error) {
      console.error('Error updating caption job status in Airtable:', error);
      return undefined;
    }
  }

  async createBilling(billing: InsertBilling): Promise<Billing> {
    try {
      const record = await airtableService.createBilling({
        userId: billing.userId,
        stripeCustomerId: billing.stripePaymentId || '',
        stripeSubscriptionId: undefined,
        planTier: billing.plan || 'free',
        amount: parseFloat(billing.amount || '0'),
        currency: 'usd',
        status: billing.status || 'pending',
      });
      return this.airtableToBilling(record);
    } catch (error) {
      console.error('Error creating billing record in Airtable:', error);
      throw error;
    }
  }

  async getBillingByUser(userId: string): Promise<Billing[]> {
    try {
      const records = await airtableService.getBillingByUser(userId);
      return records.map(record => this.airtableToBilling(record));
    } catch (error) {
      console.error('Error getting billing records from Airtable:', error);
      return [];
    }
  }
}

export const storage = new AirtableStorage();