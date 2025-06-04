# BoostFrame.io SaaS UI/UX & API Spec

## Table of Contents
1. Overview
2. Authentication & Account Flow
3. Dashboard Layout
4. Usage Meter & Plan Handling
5. Upload & Caption Options Form
6. Job List & Download Center
7. Billing & Stripe Integration
8. API Endpoints & Webhooks
9. Error Handling & Notifications
10. Responsive/Mobile Considerations
11. Out-of-Scope (For Reference)

---

## 1. Overview

BoostFrame.io offers a web platform for uploading portrait videos, customizing caption options, and downloading captioned (and optionally watermarked) video outputs.  
The UI integrates with Stripe for billing and interacts with Make.com and Airtable via back-end API routes/webhooks.

---

## 2. Authentication & Account Flow

- **User Signs Up/In** (via email/password, Magic.link, or third-party provider)
- Upon first login:
  - User is created in platform DB (and in Airtable via backend sync)
  - If first visit, show onboarding modal (feature summary, usage tiers)
- Auth token/session is set for API access

---

## 3. Dashboard Layout

### **A. Header / Navigation**
- Brand logo, "Dashboard" link
- User menu (account, billing, logout)
- Plan status (Free/Paid)

### **B. Main Dashboard Sections**
1. **Usage Meters**
   - “Free, no-watermark minutes: X of 5 used”
   - “Watermarked minutes: X of 5 used”
   - “Upgrade for unlimited captioning”
   - Progress bar visualizations

2. **Upload Panel**
   - Drag-and-drop or file select
   - “Portrait videos only” validator (client-side aspect ratio check)
   - Displays selected filename and duration

3. **Caption Options Form**
   - All options as supported by API (see Section 5)

4. **Job List/Table**
   - Columns: Date, Filename, Duration, Status, Download (caption & video), Watermarked (yes/no)
   - Statuses: Pending, Processing, Complete, Blocked, Failed
   - Retry/download buttons

5. **Upgrade Banner/Modal**
   - If at/over free limits, show persistent upgrade call-to-action

---

## 4. Usage Meter & Plan Handling

- **Usage meter and plan state** fetched from back-end (aggregates from Airtable via backend API)
- **Meter display logic:**
  - If <5 min total: "X free, no-watermark minutes remaining"
  - If 5–10 min: "X watermarked minutes remaining"
  - If ≥10 min and unpaid: “Limit reached, upgrade to continue”
  - If paid: “Unlimited captioning enabled”

---

## 5. Upload & Caption Options Form

### **A. Upload Widget**
- Accept `.mp4`, `.mov` formats (portrait only)
- Checks aspect ratio before upload (min 9:16 ratio)
- Error if non-portrait or file too large

### **B. Caption Options Form Fields** (all configurable, fetched from endpoint capabilities if dynamic)

- **Language**: Dropdown (Auto, English, Spanish, etc.)
- **Caption Style**: Dropdown (Block, Roll-up, Karaoke, etc.)
- **Font Size**: Small, Medium, Large
- **Font Color**: Color picker
- **Background**: Transparent, Black, White, Custom
- **Position**: Bottom, Top, Middle, Custom (with visual placement option)
- **Output Type**: Burned-in, SRT, VTT
- **Preview**: [Optional, shows a static preview of the caption style]
- **Save as Default**: Checkbox

### **C. Submission**
- When submitted:
  - Frontend validates usage allowance via API (before upload)
  - Uploads video to platform API (Next.js route or serverless handler)
  - Submits selected caption options as JSON payload
  - Receives job ID and estimated wait time
- Shows upload progress and confirmation

---

## 6. Job List & Download Center

- **Job Table** updates live (polling or via websocket)
- Each job:
  - Shows status badge (Pending, Processing, Complete, Failed, Blocked)
  - If complete: Show download link for caption file (SRT/VTT) and/or final video
  - “Watermarked” badge if applicable
  - “Retry” button if failed/blocked (unless at usage cap)
- **Error messages** appear inline with job status

---

## 7. Billing & Stripe Integration

- **Upgrade Button**: Visible at all times (or as modal/banner if at limit)
- When clicked:
  - Opens Stripe Checkout modal (one-time or subscription, configured in Stripe dashboard)
  - On payment success:  
    - Stripe webhook calls platform backend, marks user as “Paid” (and updates Airtable via Make.com if needed)
    - UI reflects new unlimited status
  - On failure/cancel: UI returns to dashboard, plan remains unchanged

- **Billing Page**
  - View plan details, change/cancel subscription (Stripe customer portal)
  - Show payment history (retrieved from backend)

---

## 8. API Endpoints & Webhooks (Frontend-facing)

### **A. Video Upload Endpoint**
- **POST `/api/upload`**
  - Body: `video_file` (multipart/form-data), `caption_options` (JSON), auth token
  - Server: Stores file (e.g., to GCS/S3), logs job, passes info to Make.com webhook

### **B. Usage Meter Endpoint**
- **GET `/api/usage`**
  - Returns: `{ total_minutes, free_remaining, watermark_remaining, is_paid, plan_tier }`
  - Used for meter displays and form gating

### **C. Job List Endpoint**
- **GET `/api/jobs`**
  - Returns: `[ { job_id, filename, date, duration, status, watermarked, download_links } ]`
  - Polls every N seconds for updates

### **D. Stripe Webhook Handler**
- **POST `/api/webhooks/stripe`**
  - Receives subscription/payment events
  - On successful payment: marks user as “Paid”, unlocks plan features

### **E. Job Status Webhook (from Make.com)**
- **POST `/api/webhooks/job-status`**
  - Make.com calls this on job completion/failure
  - Updates job record/status in DB

### **F. Auth Endpoints**
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/status`  
  - Auth token/session management

---

## 9. Error Handling & Notifications

- Inline errors on form fields and uploads (file size/type/aspect ratio, usage cap, network errors)
- Toast/notification for status updates, failures, plan limits
- If at/over limit: Upgrade prompt modal overlays dashboard
- Email notification on successful job completion (optional)

---

## 10. Responsive/Mobile Considerations

- All dashboard functions must be accessible and readable on mobile
- Upload and caption form collapses to single column on small screens
- Job list scrollable and easily tappable

---

## 11. Out-of-Scope (For Reference)

- All Make.com and Airtable module/configuration logic
- Video captioning and watermarking backend pipelines
- In-depth Stripe dashboard/product setup
- OAuth and social auth flows (beyond basic email login)
- Admin backend/analytics

---

# End of Spec
