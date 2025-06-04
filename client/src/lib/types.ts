export interface Usage {
  totalMinutes: number;
  freeRemaining: number;
  watermarkRemaining: number;
  isPaid: boolean;
  planTier: string;
  isOverLimit: boolean;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  planTier: string;
  totalMinutesCaptioned: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaptionJob {
  id: number;
  userId: string;
  filename: string;
  videoFileUrl?: string;
  videoDuration: string;
  watermarked: boolean;
  status: 'pending' | 'processing' | 'complete' | 'failed' | 'blocked';
  outputCaptionFile?: string;
  outputVideoFile?: string;
  captionOptions?: any;
  errorLog?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaptionOptions {
  language: string;
  captionStyle: string;
  fontSize: string;
  fontColor: string;
  background: string;
  position: string;
  outputType: string;
  saveAsDefault: boolean;
}
