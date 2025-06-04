import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appOw05G5NymB3vL8');

// Simple Airtable service that only handles the fields you specified
export class SimpleAirtableService {
  async createUser(userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    planTier: string;
    stripeCustomerId?: string;
  }) {
    try {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.email || 'Unknown User';
      
      const record = await base('Users').create({
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
      // Don't throw error, just log it so app continues working
      return null;
    }
  }

  async updateUserPlan(email: string, planTier: string) {
    try {
      const records = await base('Users').select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length > 0) {
        const record = records[0];
        await base('Users').update(record.id, {
          'Plan Tier': planTier
        });
        console.log('User plan updated in Airtable');
      }
    } catch (error) {
      console.error('Error updating user plan in Airtable:', error);
    }
  }

  async updateStripeCustomerId(email: string, stripeCustomerId: string) {
    try {
      const records = await base('Users').select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      }).firstPage();

      if (records.length > 0) {
        const record = records[0];
        await base('Users').update(record.id, {
          'Stripe Customer ID': stripeCustomerId
        });
        console.log('Stripe Customer ID updated in Airtable');
      }
    } catch (error) {
      console.error('Error updating Stripe Customer ID in Airtable:', error);
    }
  }
}

export const simpleAirtableService = new SimpleAirtableService();