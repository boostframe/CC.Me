# Product Requirements Document (PRD): BoostFrame.io Captioning SaaS

## 1. Product Overview

BoostFrame.io is a SaaS platform that enables users to easily upload portrait videos, customize captions, and download captioned and watermarked (as applicable) video outputs.  
The product targets small businesses, content creators, and agencies who need fast, reliable, and flexible video captioning with minimal manual effort.

---

## 2. Goals and Objectives

- Deliver a fast, no-code video captioning service for portrait content
- Provide high-quality, customizable captions powered by a scalable cloud backend
- Offer a freemium pricing model:  
  - First 5 minutes (lifetime): free, no watermark  
  - Next 5 minutes: free, but with watermark  
  - Paid plans: unlimited minutes, no watermark
- Make onboarding, usage tracking, and billing seamless and transparent
- Ensure ease of integration and extensibility for future product features

---

## 3. User Personas

- **Content Creators:** Individuals making short-form content for platforms like TikTok, IG Reels, and YouTube Shorts  
- **Small Businesses/Agencies:** Teams captioning promotional, training, or marketing videos  
- **Social Media Managers:** Marketers automating video workflows for clients  
- **Trial Users:** Evaluating before purchase (free tier users)

---

## 4. User Stories

**As a user, I want to:**
- Sign up quickly and access my dashboard with clear usage info
- Upload a portrait video and customize my caption style, color, language, and position
- See my remaining free minutes and be notified about watermarks or upgrade needs
- Track the status of my jobs and download results when complete
- Upgrade my plan to remove watermarks and usage limits using Stripe payments
- Receive notifications and clear error messages for any issues

---

## 5. Features & Requirements

### 5.1 Core Features

- **User Authentication:** Email login (Magic.link, Clerk, or similar)
- **Dashboard:** Usage meters, upgrade CTA, upload widget, job list/status
- **Video Upload:** Portrait-only file support (.mp4/.mov), client-side validation
- **Caption Customization:** Options for language, style, font, color, position, and output format (as supported by API)
- **Automated Captioning Pipeline:**  
  - Job intake via API/webhook  
  - Usage and billing enforcement logic  
  - Calls to cloud captioning and watermarking (as per user tier/usage)
- **Download Center:** Secure, expiring download links for outputs
- **Job History:** All past jobs, status, watermarked/burned-in indicators
- **Notifications:** Status and error messages in UI (optionally email)
- **Billing & Payments:**  
  - Usage metering  
  - Stripe checkout integration  
  - Stripe webhooks for plan management  
  - Plan status and receipts in UI

### 5.2 Freemium Model & Policy Logic

| Lifetime Minutes | Output         | User Experience                |
|------------------|---------------|--------------------------------|
| 0–5              | No watermark  | Fully free                     |
| 5–10             | Watermark     | Free, “Made with BoostFrame.io”|
| 10+              | Blocked       | Prompt upgrade                 |
| Paid             | No watermark  | Unlimited usage                |

### 5.3 Technical/Non-Functional Requirements

- **Security:**  
  - Authenticated API endpoints  
  - Signed download URLs  
  - No exposure of private credentials
- **Performance:**  
  - Fast video upload and processing (<5min for jobs <5min)
- **Reliability:**  
  - Robust error handling, job retries, and status tracking
- **Extensibility:**  
  - Modular options form, future API/feature integrations
- **Scalability:**  
  - Make.com and Airtable backends for MVP; upgradable to custom cloud infrastructure

---

## 6. Technical Architecture Overview

- **Frontend:** Next.js/React app (Vercel/Netlify), mobile-friendly design
- **Backend:**  
  - API layer (Next.js API routes/serverless functions)  
  - Integrates with Make.com and Airtable via webhooks and REST
- **Automation:**  
  - Make.com scenarios for intake, processing, usage enforcement, job updates
- **Database:** Airtable as main DB (users, jobs, billing)
- **Payments:** Stripe Checkout and Customer Portal (webhooks for billing logic)
- **Storage:** Google Cloud Storage, S3, or Drive for file storage/delivery

---

## 7. Success Metrics

- **Activation:** % of signups who complete a job in first week
- **Conversion:** % of free users who upgrade to paid plan
- **Job Reliability:** >95% jobs completed successfully within SLA
- **Churn:** Monthly paid churn <5%
- **CSAT:** 4.5/5 user satisfaction on NPS or support tickets

---

## 8. Assumptions & Risks

- Video processing demand fits within Make.com and Airtable rate limits
- Stripe integration is reliable for all users/countries
- Portrait-only uploads enforced in client and backend
- Captioning API maintains high accuracy and uptime

---

## 9. Out-of-Scope for v1

- Team/multi-user accounts
- Non-portrait/landscape video support
- Advanced AI editing (auto-zoom, translation, etc.)
- Manual review/moderation pipelines
- Public API for third-party integrations

---

## 10. Launch & Milestones

1. **Spec & Design Approval**
2. **MVP Build:**  
   - Core dashboard  
   - Upload, job, usage, and Stripe logic  
   - Automation pipelines
3. **Alpha Testing:**  
   - Internal users and select creators
4. **Beta Release:**  
   - Public signups, bug bashes, first marketing push
5. **General Availability:**  
   - Full launch, Product Hunt, outreach, paid ads

---

## 11. Appendices

### A. Reference Documents  
- [UI/API Spec (Markdown)](link-to-ui-markdown)
- [Make.com & Airtable Spec (Markdown)](link-to-backend-markdown)
- [Captioning Endpoint Documentation](https://github.com/stephengpope/no-code-architects-toolkit/blob/main/docs/media/media_transcribe.md)

### B. Stakeholders  
- Product: Bill Fackelman  
- Tech Lead: [To be assigned]  
- Design: [To be assigned]  
- Automation: [To be assigned]

---

# End of PRD
