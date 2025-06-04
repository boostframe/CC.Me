import Airtable from 'airtable';
import type { User, CaptionJob, Billing } from '@shared/schema';

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY environment variable is required');
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID environment variable is required');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appOw05G5NymB3vL8');

// Airtable table names
const TABLES = {
  USERS: 'Users',
  CAPTION_JOBS: 'Caption Jobs',
  BILLING: 'Billing'
} as const;

export class AirtableService {
  // User operations
  async createUser(userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    planTier: string;
    stripeCustomerId?: string;
  }) {
    try {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.email || 'Unknown User';

      const record = await base(TABLES.USERS).create({
        'Email': userData.email || '',
        'Name': fullName,
        'Auth Provider': 'Replit',
        'Stripe Customer ID': userData.stripeCustomerId || '',
        'Plan Tier': userData.planTier,
        'Created At': new Date().toISOString()
      });

      console.log('User created in Airtable:', record.id);
      return record;
    } catch (error) {
      console.error('Error creating user in Airtable:', error);
      throw error;
    }
  }

  async updateUser(email: string, updates: Partial<{
    planTier: string;
    stripeCustomerId: string;
  }>) {
    try {
      // Find the user record first
      const records = await base(TABLES.USERS).select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error(`User with email ${email} not found in Airtable`);
      }

      const record = records[0];
      const updateData: any = {};

      if (updates.planTier !== undefined) updateData['Plan Tier'] = updates.planTier;
      if (updates.stripeCustomerId !== undefined) updateData['Stripe Customer ID'] = updates.stripeCustomerId;

      const updatedRecord = await base(TABLES.USERS).update(record.id, updateData);
      console.log('User updated in Airtable:', updatedRecord.id);
      return updatedRecord;
    } catch (error) {
      console.error('Error updating user in Airtable:', error);
      throw error;
    }
  }

  async getUser(email: string) {
    try {
      const records = await base(TABLES.USERS).select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      }).firstPage();

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Error getting user from Airtable:', error);
      throw error;
    }
  }

  // Caption Job operations
  async createCaptionJob(jobData: {
    id: number;
    userId: string;
    filename: string;
    videoFileUrl?: string;
    videoDuration: number;
    watermarked: boolean;
    status: string;
    captionOptions?: any;
  }) {
    try {
      const record = await base(TABLES.CAPTION_JOBS).create({
        'Job ID': jobData.id,
        'User ID': jobData.userId,
        'Filename': jobData.filename,
        'Video File URL': jobData.videoFileUrl || '',
        'Video Duration': jobData.videoDuration,
        'Watermarked': jobData.watermarked,
        'Status': jobData.status,
        'Caption Options': JSON.stringify(jobData.captionOptions || {}),
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });

      console.log('Caption job created in Airtable:', record.id);
      return record;
    } catch (error) {
      console.error('Error creating caption job in Airtable:', error);
      throw error;
    }
  }

  async updateCaptionJob(jobId: number, updates: {
    outputCaptionFile?: string;
    outputVideoFile?: string;
    errorLog?: string;
  }) {
    try {
      // Find the job record first
      const records = await base(TABLES.CAPTION_JOBS).select({
        filterByFormula: `{Job ID} = ${jobId}`,
        maxRecords: 1
      }).firstPage();

      if (records.length === 0) {
        throw new Error(`Caption job with ID ${jobId} not found in Airtable`);
      }

      const record = records[0];
      const updateData: any = {
        'Updated At': new Date().toISOString()
      };

      if (updates.outputCaptionFile !== undefined) updateData['Output Caption File'] = updates.outputCaptionFile;
      if (updates.outputVideoFile !== undefined) updateData['Output Video File'] = updates.outputVideoFile;
      if (updates.errorLog !== undefined) updateData['Error Log'] = updates.errorLog;

      const updatedRecord = await base(TABLES.CAPTION_JOBS).update(record.id, updateData);
      console.log('Caption job updated in Airtable:', updatedRecord.id);
      return updatedRecord;
    } catch (error) {
      console.error('Error updating caption job in Airtable:', error);
      throw error;
    }
  }

  async getCaptionJobsByUser(userId: string) {
    try {
      const records = await base(TABLES.CAPTION_JOBS).select({
        filterByFormula: `{User ID} = '${userId}'`,
        sort: [{ field: 'Created At', direction: 'desc' }]
      }).all();

      return records;
    } catch (error) {
      console.error('Error getting caption jobs from Airtable:', error);
      throw error;
    }
  }

  // Billing operations
  async createBilling(billingData: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    planTier: string;
    amount: number;
    currency: string;
    status: string;
  }) {
    try {
      const record = await base(TABLES.BILLING).create({
        'User ID': billingData.userId,
        'Stripe Customer ID': billingData.stripeCustomerId,
        'Stripe Subscription ID': billingData.stripeSubscriptionId || '',
        'Plan Tier': billingData.planTier,
        'Amount': billingData.amount,
        'Currency': billingData.currency,
        'Status': billingData.status,
        'Created At': new Date().toISOString(),
        'Updated At': new Date().toISOString()
      });

      console.log('Billing record created in Airtable:', record.id);
      return record;
    } catch (error) {
      console.error('Error creating billing record in Airtable:', error);
      throw error;
    }
  }

  async getBillingByUser(userId: string) {
    try {
      const records = await base(TABLES.BILLING).select({
        filterByFormula: `{User ID} = '${userId}'`,
        sort: [{ field: 'Created At', direction: 'desc' }]
      }).all();

      return records;
    } catch (error) {
      console.error('Error getting billing records from Airtable:', error);
      throw error;
    }
  }
}

export const airtableService = new AirtableService();