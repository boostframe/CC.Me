import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import { storage } from "./airtable-only-storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCaptionJobSchema, captionOptionsSchema } from "@shared/schema";
import { z } from "zod";
import { Storage } from "@google-cloud/storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

// Initialize Google Cloud Storage
let gcs: Storage | null = null;
try {
  const credentials = {
    type: process.env.GCS_TYPE,
    project_id: process.env.GCS_PROJECT_ID,
    private_key_id: process.env.GCS_PRIVATE_KEY_ID,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GCS_CLIENT_EMAIL,
    client_id: process.env.GCS_CLIENT_ID,
    auth_uri: process.env.GCS_AUTH_URI,
    token_uri: process.env.GCS_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GCS_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GCS_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GCS_UNIVERSE_DOMAIN
  };

  gcs = new Storage({
    credentials,
    projectId: process.env.GCS_PROJECT_ID
  });
  console.log('Google Cloud Storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error);
}

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUser(userEmail);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Usage endpoint
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUser(userEmail);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const totalMinutes = parseFloat(user.totalMinutesCaptioned || "0");
      const freeRemaining = Math.max(0, 5 - totalMinutes);
      const watermarkRemaining = Math.max(0, 10 - totalMinutes);
      const isPaid = user.planTier === "Paid";
      const isOverLimit = totalMinutes >= 10 && !isPaid;

      res.json({
        totalMinutes,
        freeRemaining,
        watermarkRemaining,
        isPaid,
        planTier: user.planTier,
        isOverLimit,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  // Upload video endpoint
  app.post('/api/upload', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const user = await storage.getUser(userEmail);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      // Parse caption options
      let captionOptions;
      try {
        captionOptions = captionOptionsSchema.parse(JSON.parse(req.body.captionOptions || '{}'));
      } catch (error) {
        return res.status(400).json({ message: "Invalid caption options" });
      }

      // Parse video duration from request
      const videoDuration = parseFloat(req.body.videoDuration || "0");
      if (videoDuration <= 0) {
        return res.status(400).json({ message: "Invalid video duration" });
      }

      // Check usage limits
      const totalMinutes = parseFloat(user.totalMinutesCaptioned || "0");
      const wouldExceedLimit = totalMinutes + videoDuration > 10;
      const isPaid = user.planTier === "paid";

      if (wouldExceedLimit && !isPaid) {
        return res.status(403).json({ 
          message: "Usage limit would be exceeded. Please upgrade to continue.",
          requiresUpgrade: true 
        });
      }

      // Determine if this job should be watermarked
      const willBeWatermarked = totalMinutes + videoDuration > 5 && !isPaid;

      // Upload file to Google Cloud Storage
      let videoFileUrl = '';
      if (gcs && req.file) {
        try {
          const bucket = gcs.bucket('bfresearch_bucket');
          const fileName = `videos/${Date.now()}-${req.file.originalname}`;
          const file = bucket.file(fileName);
          
          const stream = file.createWriteStream({
            metadata: {
              contentType: req.file.mimetype,
            },
          });

          await new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', resolve);
            stream.end(req.file!.buffer);
          });

          // Generate a signed URL that's valid for 24 hours (since bucket has uniform access control)
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          });
          
          videoFileUrl = signedUrl;
          console.log('Successfully uploaded to Google Cloud Storage with signed URL');
        } catch (error) {
          console.error('Failed to upload to Google Cloud Storage:', error);
          return res.status(500).json({ message: "Failed to upload video file" });
        }
      } else {
        return res.status(500).json({ message: "Cloud storage not configured" });
      }

      // Generate unique job ID
      const jobId = Date.now() + Math.floor(Math.random() * 1000);

      // Create caption job
      const jobData = insertCaptionJobSchema.parse({
        id: jobId,
        userId: user.email, // Use email as userId since that's what Airtable expects
        filename: req.file.originalname,
        videoFileUrl,
        videoDuration: videoDuration.toString(),
        watermarked: willBeWatermarked,
        captionOptions,
        status: "pending",
      });

      const job = await storage.createCaptionJob(jobData);

      // Send to Make.com webhook for processing
      try {
        const webhookPayload = {
          jobId: job.id,
          userId: user.id,
          filename: req.file.originalname,
          videoFileUrl: videoFileUrl,
          videoDuration: videoDuration,
          watermarked: willBeWatermarked,
          captionOptions: captionOptions,
          user: {
            email: user.email,
            planTier: user.planTier || 'free',
            totalMinutesCaptioned: parseFloat(user.totalMinutesCaptioned || '0'),
            freeMinutesRemaining: Math.max(0, 5 - parseFloat(user.totalMinutesCaptioned || '0')),
            watermarkMinutesRemaining: Math.max(0, 10 - parseFloat(user.totalMinutesCaptioned || '0')),
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId
          },
          minutesUsage: {
            currentJobMinutes: videoDuration,
            totalMinutesUsed: parseFloat(user.totalMinutesCaptioned || '0'),
            newTotalMinutes: parseFloat(user.totalMinutesCaptioned || '0') + videoDuration,
            freeAllowance: 5,
            watermarkAllowance: 10,
            isPaidUser: user.planTier === 'paid'
          }
        };

        console.log('Sending to Make.com webhook:', JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch('https://hook.us2.make.com/db77h33dmy35wkmt3jqknqolf9op7749', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        if (!webhookResponse.ok) {
          console.error('Make.com webhook failed:', webhookResponse.status, webhookResponse.statusText);
        } else {
          console.log('Successfully sent to Make.com webhook');
          // Update job status to processing since webhook was sent
          await storage.updateCaptionJobStatus(job.id, 'processing');
        }
      } catch (error) {
        console.error('Error sending to Make.com webhook:', error);
        // If webhook fails, mark job as failed
        await storage.updateCaptionJobStatus(
          job.id,
          'failed',
          undefined,
          undefined,
          `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      res.json({
        jobId: job.id,
        estimatedWaitTime: "30-60 seconds",
        watermarked: willBeWatermarked,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Get user's jobs
  app.get('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const jobs = await storage.getCaptionJobsByUser(userEmail);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Stripe subscription endpoint
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan = 'monthly' } = req.body; // Default to monthly if not specified
      console.log(`Creating subscription for user ${userId} with plan: ${plan}`);
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For demo purposes, if user has existing subscription, cancel it and create new one
      if (user.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          await storage.updateUserStripeInfo(userId, user.stripeCustomerId || '', '');
        } catch (error) {
          console.log('Error canceling existing subscription:', error);
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      let customerId = user.stripeCustomerId;
      
      // Verify customer exists in Stripe, create new one if not
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (error) {
          console.log('Stored customer ID invalid, creating new customer');
          customerId = null;
        }
      }
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, customerId);
      }

      // First create a product
      const product = await stripe.products.create({
        name: 'BoostFrame Pro',
        description: 'Unlimited video captioning without watermarks',
      });

      // Set price and interval based on plan
      const isYearly = plan === 'yearly';
      const unitAmount = isYearly ? 29000 : 2900; // $290.00 or $29.00 in cents
      const interval = isYearly ? 'year' : 'month';
      
      console.log(`Creating ${interval} subscription with amount: ${unitAmount} cents`);

      // Then create a price for that product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: unitAmount,
        currency: 'usd',
        recurring: {
          interval: interval,
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      // Safely extract client secret
      const invoice = subscription.latest_invoice;
      let clientSecret = null;
      
      if (typeof invoice === 'object' && invoice !== null && 'payment_intent' in invoice) {
        const paymentIntent = invoice.payment_intent;
        if (typeof paymentIntent === 'object' && paymentIntent !== null && 'client_secret' in paymentIntent) {
          clientSecret = paymentIntent.client_secret;
        }
      }
      
      console.log(`Subscription created with ID: ${subscription.id}, client secret: ${clientSecret ? 'present' : 'missing'}`);
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Manual payment completion endpoint for testing
  app.post('/api/complete-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateUserPlanTier(userId, 'paid');
      console.log('Manually updated user plan to paid for user:', userId);
      res.json({ success: true, message: 'Plan updated to paid' });
    } catch (error: any) {
      console.error('Error updating plan:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Test endpoint to complete pending jobs manually
  app.post('/api/test-complete-job', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.body;
      const userId = req.user.claims.sub;
      
      if (!jobId) {
        return res.status(400).json({ message: 'Job ID required' });
      }

      // Simulate job completion with mock output files
      const job = await storage.updateCaptionJobStatus(
        parseInt(jobId),
        'complete',
        'https://example.com/captions.srt', // Mock caption file URL
        'https://example.com/captioned-video.mp4' // Mock video file URL
      );

      console.log('Manually completed job:', jobId, 'for user:', userId);
      res.json({ success: true, job });
    } catch (error: any) {
      console.error('Error completing job:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const event = req.body;
      
      // In production, verify the webhook signature
      // const sig = req.headers['stripe-signature'];
      // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

      switch (event.type) {
        case 'payment_intent.succeeded':
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            
            // Find user by stripe customer ID and update plan
            if (customer && 'id' in customer) {
              try {
                // Note: With Airtable storage, we would need to implement a search by stripe customer ID
                // For now, we'll log this event for webhook processing
                console.log('Payment succeeded for customer:', customer.id, 'subscription:', subscription.id);
              } catch (error) {
                console.error('Error processing payment webhook:', error);
              }
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          // Handle subscription cancellation
          console.log('Subscription deleted:', deletedSubscription.id);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  });

  // Job status webhook (for Make.com integration)
  app.post('/api/webhooks/job-status', async (req, res) => {
    try {
      console.log('Received webhook from Make.com:', JSON.stringify(req.body, null, 2));
      
      const { jobId, status, outputCaptionFile, outputVideoFile, errorLog } = req.body;
      
      if (!jobId || !status) {
        console.log('Missing required fields. jobId:', jobId, 'status:', status);
        return res.status(400).json({ 
          message: "Missing required fields", 
          received: req.body,
          required: ["jobId", "status"]
        });
      }

      const job = await storage.updateCaptionJobStatus(
        parseInt(jobId),
        status,
        outputCaptionFile,
        outputVideoFile,
        errorLog
      );

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // If job completed successfully, update user's total minutes
      if (status === "complete") {
        const additionalMinutes = parseFloat(job.videoDuration);
        const updatedUser = await storage.updateUserMinutesCaptioned(
          job.userId, 
          additionalMinutes
        );

        // Send usage update webhook to Make.com
        try {
          const usageWebhookPayload = {
            event: 'job_completed',
            jobId: parseInt(jobId),
            userId: job.userId,
            status: status,
            videoDuration: additionalMinutes,
            user: {
              email: updatedUser.email,
              planTier: updatedUser.planTier,
              totalMinutesCaptioned: parseFloat(updatedUser.totalMinutesCaptioned || '0'),
              freeMinutesRemaining: Math.max(0, 5 - parseFloat(updatedUser.totalMinutesCaptioned || '0')),
              watermarkMinutesRemaining: Math.max(0, 10 - parseFloat(updatedUser.totalMinutesCaptioned || '0')),
              stripeCustomerId: updatedUser.stripeCustomerId,
              stripeSubscriptionId: updatedUser.stripeSubscriptionId
            },
            minutesUsage: {
              completedJobMinutes: additionalMinutes,
              totalMinutesUsed: parseFloat(updatedUser.totalMinutesCaptioned || '0'),
              freeAllowance: 5,
              watermarkAllowance: 10,
              isPaidUser: updatedUser.planTier === 'paid'
            },
            outputFiles: {
              captionFile: outputCaptionFile,
              videoFile: outputVideoFile
            }
          };

          await fetch('https://hook.us2.make.com/db77h33dmy35wkmt3jqknqolf9op7749', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(usageWebhookPayload)
          });
          
          console.log('Usage update webhook sent to Make.com for completed job');
        } catch (error) {
          console.warn('Failed to send usage update webhook:', error);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
