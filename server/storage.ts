import {
  users,
  captionJobs,
  billing,
  type User,
  type UpsertUser,
  type InsertCaptionJob,
  type CaptionJob,
  type InsertBilling,
  type Billing,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { simpleAirtableService } from "./simple-airtable";

// Interface for storage operations
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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is a new user
    const existingUser = await this.getUser(userData.id);
    const isNewUser = !existingUser;

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Send webhook for new account creation and sync to Airtable
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

      // Send simplified data to Airtable (only the fields you specified)
      try {
        await simpleAirtableService.createUser({
          email: user.email || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          planTier: user.planTier,
          stripeCustomerId: user.stripeCustomerId || undefined,
        });
      } catch (error) {
        console.warn('Failed to sync user to Airtable:', error);
      }
    }

    return user;
  }

  async updateUserStripeInfo(
    userId: string, 
    stripeCustomerId: string, 
    stripeSubscriptionId?: string
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPlanTier(userId: string, planTier: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        planTier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserMinutesCaptioned(userId: string, additionalMinutes: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        totalMinutesCaptioned: sql`${users.totalMinutesCaptioned} + ${additionalMinutes}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Caption Job operations
  async createCaptionJob(job: InsertCaptionJob): Promise<CaptionJob> {
    const [captionJob] = await db
      .insert(captionJobs)
      .values(job)
      .returning();

    // Caption jobs are tracked via webhooks, no need for direct Airtable sync

    return captionJob;
  }

  async getCaptionJob(id: number): Promise<CaptionJob | undefined> {
    const [job] = await db
      .select()
      .from(captionJobs)
      .where(eq(captionJobs.id, id));
    return job;
  }

  async getCaptionJobsByUser(userId: string): Promise<CaptionJob[]> {
    return db
      .select()
      .from(captionJobs)
      .where(eq(captionJobs.userId, userId))
      .orderBy(desc(captionJobs.createdAt));
  }

  async updateCaptionJobStatus(
    id: number, 
    status: string, 
    outputCaptionFile?: string, 
    outputVideoFile?: string,
    errorLog?: string
  ): Promise<CaptionJob | undefined> {
    const [job] = await db
      .update(captionJobs)
      .set({
        status,
        outputCaptionFile,
        outputVideoFile,
        errorLog,
        updatedAt: new Date(),
      })
      .where(eq(captionJobs.id, id))
      .returning();

    // Job status updates are handled via webhooks

    return job;
  }

  // Billing operations
  async createBilling(billing: InsertBilling): Promise<Billing> {
    const [bill] = await db
      .insert(billing)
      .values(billing)
      .returning();
    return bill;
  }

  async getBillingByUser(userId: string): Promise<Billing[]> {
    return db
      .select()
      .from(billing)
      .where(eq(billing.userId, userId))
      .orderBy(desc(billing.createdAt));
  }
}

export const storage = new DatabaseStorage();
