import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  planTier: varchar("plan_tier").default("free").notNull(), // free, paid, canceled
  totalMinutesCaptioned: decimal("total_minutes_captioned", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Caption Jobs table
export const captionJobs = pgTable("caption_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  videoFileUrl: text("video_file_url"),
  videoDuration: decimal("video_duration", { precision: 10, scale: 2 }).notNull(), // in minutes
  watermarked: boolean("watermarked").default(false).notNull(),
  status: varchar("status").default("pending").notNull(), // pending, processing, complete, failed, blocked
  outputCaptionFile: text("output_caption_file"),
  outputVideoFile: text("output_video_file"),
  captionOptions: jsonb("caption_options"),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing table
export const billing = pgTable("billing", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripePaymentId: varchar("stripe_payment_id"),
  paymentDate: timestamp("payment_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  plan: varchar("plan"), // monthly, yearly, payg
  minutesPurchased: decimal("minutes_purchased", { precision: 10, scale: 2 }),
  status: varchar("status").notNull(), // succeeded, failed, refunded, canceled
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCaptionJob = typeof captionJobs.$inferInsert;
export type CaptionJob = typeof captionJobs.$inferSelect;

export type InsertBilling = typeof billing.$inferInsert;
export type Billing = typeof billing.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCaptionJobSchema = createInsertSchema(captionJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingSchema = createInsertSchema(billing).omit({
  id: true,
  createdAt: true,
});

export const captionOptionsSchema = z.object({
  language: z.string().default("auto"),
  lineColor: z.string().default("#ffffff"),
  wordColor: z.string().default("#ffffff"),
  outlineColor: z.string().default("#000000"),
  allCaps: z.boolean().default(false),
  maxWordsPerLine: z.number().default(3),
  position: z.string().default("center"),
  alignment: z.string().default("center"),
  fontFamily: z.string().default("Arial"),
  fontSize: z.number().default(24),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  strikeout: z.boolean().default(false),
  style: z.enum(["classic", "karaoke", "highlight", "underline", "word_by_word"]).default("highlight"),
  outputType: z.string().default("burned-in"),
  saveAsDefault: z.boolean().default(false),
});

export type CaptionOptions = z.infer<typeof captionOptionsSchema>;
