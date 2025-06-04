import Airtable from 'airtable';
import {
  type User,
  type UpsertUser,
  type CaptionJob,
  type InsertCaptionJob,
  type Billing,
  type InsertBilling,
} from "@shared/schema";

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY environment variable is required');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appOw05G5NymB3vL8');

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserPlanTier(userId: string, planTier: string): Promise<User>;
  updateUserMinutesCaptioned(userId: string, additionalMinutes: number): Promise<User>;
  createCaptionJob(job: InsertCaptionJob): Promise<CaptionJob>;
  getCaptionJob(id: number): Promise<CaptionJob | undefined>;
  getCaptionJobsByUser(userId: string): Promise<CaptionJob[]>;
  updateCaptionJobStatus(id: number, status: string, outputCaptionFile?: string, outputVideoFile?: string, errorLog?: string): Promise<CaptionJob | undefined>;
  createBilling(billing: InsertBilling): Promise<Billing>;
  getBillingByUser(userId: string): Promise<Billing[]>;
}

export class AirtableOnlyStorage implements IStorage {
  private airtableToUser(record: any): User {
    const email = record.get('Email') || record.id;
    const fullName = record.get('Name') || '';
    const nameParts = fullName.split(' ');

    return {
      id: email,
      email: email,
      firstName: nameParts[0] || null,
      lastName: nameParts.slice(1).join(' ') || null,
      profileImageUrl: null,
      planTier: record.get('Plan Tier') || 'free',
      totalMinutesCaptioned: String(record.get('Total Minutes Captioned') || 0),
      stripeCustomerId: record.get('Stripe Customer ID') || null,
      stripeSubscriptionId: record.get('Stripe Subscription ID') || null,
      createdAt: record.createdTime ? new Date(record.createdTime) : new Date(),
      updatedAt: record.get('Last Modified') ? new Date(record.get('Last Modified')) : new Date(),
    };
  }

  private airtableToCaptionJob(record: any): CaptionJob {
    const jobIdValue = record.get('Replit Job ID');
    const jobId = typeof jobIdValue === 'number' ? jobIdValue : (jobIdValue ? parseInt(String(jobIdValue)) : 0);
    
    return {
      id: jobId,
      userId: record.get('User') && record.get('User').length > 0 ? record.get('User')[0] : '',
      filename: record.get('Video File Name') || '',
      videoFileUrl: record.get('Video File URL') || null,
      videoDuration: String(record.get('Video Duration') || 0),
      watermarked: record.get('Watermarked') || false,
      status: record.get('Status') || 'pending',
      outputCaptionFile: record.get('Output Caption File') || null,
      outputVideoFile: record.get('Output Video File') || null,
      captionOptions: record.get('Caption Options') ? JSON.parse(record.get('Caption Options')) : null,
      errorLog: record.get('Error Log') || null,
      createdAt: record.createdTime ? new Date(record.createdTime) : new Date(),
      updatedAt: record.get('Last Modified') ? new Date(record.get('Last Modified')) : new Date(),
    };
  }

  private airtableToBilling(record: any): Billing {
    return {
      id: record.get('Billing ID') || Math.floor(Math.random() * 1000000),
      userId: record.get('User ID') || '',
      status: record.get('Status') || 'pending',
      stripePaymentId: record.get('Stripe Payment ID') || null,
      paymentDate: record.get('Payment Date') || null,
      amount: String(record.get('Amount') || 0),
      plan: record.get('Plan') || null,
      minutesPurchased: String(record.get('Minutes Purchased') || 0),
      createdAt: record.createdTime ? new Date(record.createdTime) : new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const records = await base('Users').select({
        filterByFormula: `{Email} = '${id}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length > 0) {
        return this.airtableToUser(records[0]);
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user from Airtable:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const existingRecords = await base('Users').select({
        filterByFormula: `{Email} = '${userData.email}'`,
        maxRecords: 1
      }).firstPage();

      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.email || 'Unknown User';

      if (existingRecords.length > 0) {
        const record = existingRecords[0];
        const updatedRecord = await base('Users').update(record.id, {
          'Name': fullName,
          'Plan Tier': userData.planTier || 'free',
          'Total Minutes Captioned': parseFloat(userData.totalMinutesCaptioned || '0'),
          'Stripe Customer ID': userData.stripeCustomerId || '',
          'Stripe Subscription ID': userData.stripeSubscriptionId || '',
        });
        return this.airtableToUser(updatedRecord);
      } else {
        const newRecord = await base('Users').create({
          'Email': userData.email || '',
          'Name': fullName,
          'Auth Provider': 'Replit',
          'Plan Tier': userData.planTier || 'free',
          'Total Minutes Captioned': parseFloat(userData.totalMinutesCaptioned || '0'),
          'Stripe Customer ID': userData.stripeCustomerId || '',
          'Stripe Subscription ID': userData.stripeSubscriptionId || '',
        });
        return this.airtableToUser(newRecord);
      }
    } catch (error) {
      console.error('Error upserting user in Airtable:', error);
      return {
        id: userData.id || userData.email || 'unknown',
        email: userData.email || '',
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        planTier: userData.planTier || 'free',
        totalMinutesCaptioned: userData.totalMinutesCaptioned || '0',
        stripeCustomerId: userData.stripeCustomerId || null,
        stripeSubscriptionId: userData.stripeSubscriptionId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    try {
      const records = await base('Users').select({
        filterByFormula: `{Email} = '${userId}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error('User not found');
      }

      const updateFields: any = {
        'Stripe Customer ID': stripeCustomerId,
      };

      if (stripeSubscriptionId) {
        updateFields['Stripe Subscription ID'] = stripeSubscriptionId;
      }

      const updatedRecord = await base('Users').update(records[0].id, updateFields);
      return this.airtableToUser(updatedRecord);
    } catch (error) {
      console.error('Error updating user stripe info in Airtable:', error);
      throw error;
    }
  }

  async updateUserPlanTier(userId: string, planTier: string): Promise<User> {
    try {
      const records = await base('Users').select({
        filterByFormula: `{Email} = '${userId}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error('User not found');
      }

      const updatedRecord = await base('Users').update(records[0].id, {
        'Plan Tier': planTier,
      });
      return this.airtableToUser(updatedRecord);
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

      const records = await base('Users').select({
        filterByFormula: `{Email} = '${userId}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error('User not found');
      }

      const updatedRecord = await base('Users').update(records[0].id, {
        'Total Minutes Captioned': newTotal,
      });
      return this.airtableToUser(updatedRecord);
    } catch (error) {
      console.error('Error updating user minutes in Airtable:', error);
      throw error;
    }
  }

  async createCaptionJob(job: InsertCaptionJob): Promise<CaptionJob> {
    try {
      console.log('Creating caption job with data:', job);

      // Find user record ID first
      const userRecords = await base('Users').select({
        filterByFormula: `{Email} = '${job.userId}'`,
        maxRecords: 1
      }).firstPage();

      if (userRecords.length === 0) {
        throw new Error(`User ${job.userId} not found`);
      }

      const userRecordId = userRecords[0].id;
      console.log('Found user record ID:', userRecordId);

      const airtableData = {
        'User': [userRecordId],
        'Video File Name': job.filename,
        'Video File URL': job.videoFileUrl || '',
        'Video Duration': parseFloat(job.videoDuration || '0'),
        'Watermarked': job.watermarked || false,
        'Caption Options': JSON.stringify(job.captionOptions || {}),
        'Replit Job ID': job.id, // Store as number
      };

      console.log('Creating Airtable record with data:', airtableData);

      const record = await base('Caption Jobs').create(airtableData);
      console.log('Caption job created in Airtable:', record.id);
      
      const createdJob = this.airtableToCaptionJob(record);
      console.log('Created job with ID:', createdJob.id);
      return createdJob;
    } catch (error) {
      console.error('Error creating caption job in Airtable:', error);
      throw error;
    }
  }

  async getCaptionJob(id: number): Promise<CaptionJob | undefined> {
    try {
      const records = await base('Caption Jobs').select({
        filterByFormula: `{Replit Job ID} = '${id}'`,
        maxRecords: 1
      }).firstPage();

      return records.length > 0 ? this.airtableToCaptionJob(records[0]) : undefined;
    } catch (error) {
      console.error('Error getting caption job from Airtable:', error);
      return undefined;
    }
  }

  async getCaptionJobsByUser(userId: string): Promise<CaptionJob[]> {
    try {
      console.log('Getting caption jobs for user:', userId);

      // First find the user record
      const userRecords = await base('Users').select({
        filterByFormula: `{Email} = '${userId}'`,
        maxRecords: 1
      }).firstPage();

      if (userRecords.length === 0) {
        console.log('User not found:', userId);
        return [];
      }

      const userRecordId = userRecords[0].id;
      console.log('Found user record ID for jobs lookup:', userRecordId);

      const records = await base('Caption Jobs').select({
        filterByFormula: `FIND('${userRecordId}', ARRAYJOIN({User}))`,
        sort: [{ field: 'Replit Job ID', direction: 'desc' }]
      }).all();

      return records.map(record => this.airtableToCaptionJob(record));
    } catch (error) {
      console.error('Error getting caption jobs from Airtable:', error);
      return [];
    }
  }

  async updateCaptionJobStatus(
    id: number, 
    status: string, 
    outputCaptionFile?: string, 
    outputVideoFile?: string,
    errorLog?: string
  ): Promise<CaptionJob | undefined> {
    try {
      const records = await base('Caption Jobs').select({
        filterByFormula: `{Replit Job ID} = '${id}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error(`Caption job with ID ${id} not found`);
      }

      const updateData: any = {
      };

      if (outputCaptionFile !== undefined) updateData['Output Caption File'] = outputCaptionFile;
      if (outputVideoFile !== undefined) updateData['Output Video File'] = outputVideoFile;
      if (errorLog !== undefined) updateData['Error Log'] = errorLog;

      const updatedRecord = await base('Caption Jobs').update(records[0].id, updateData);
      console.log('Caption job updated in Airtable:', updatedRecord.id);
      return this.airtableToCaptionJob(updatedRecord);
    } catch (error) {
      console.error('Error updating caption job status in Airtable:', error);
      return undefined;
    }
  }

  async createBilling(billing: InsertBilling): Promise<Billing> {
    try {
      const record = await base('Billing').create({
        'Billing ID': billing.id,
        'User ID': billing.userId,
        'Status': billing.status,
        'Stripe Payment ID': billing.stripePaymentId || '',
        'Payment Date': billing.paymentDate?.toISOString() || new Date().toISOString(),
        'Amount': parseFloat(billing.amount || '0'),
        'Plan': billing.plan || '',
        'Minutes Purchased': parseFloat(billing.minutesPurchased || '0'),
      });

      return this.airtableToBilling(record);
    } catch (error) {
      console.error('Error creating billing record in Airtable:', error);
      throw error;
    }
  }

  async getBillingByUser(userId: string): Promise<Billing[]> {
    try {
      const records = await base('Billing').select({
        filterByFormula: `{User ID} = '${userId}'`,
        sort: [{ field: 'Billing ID', direction: 'desc' }]
      }).all();

      return records.map(record => this.airtableToBilling(record));
    } catch (error) {
      console.error('Error getting billing records from Airtable:', error);
      return [];
    }
  }
}

export const storage = new AirtableOnlyStorage();