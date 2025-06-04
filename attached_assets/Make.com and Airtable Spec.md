# BoostFrame.io SaaS: Make.com Automation & Airtable Database Spec

## Table of Contents

1. Overview
2. Airtable Base and Schema
    - Users Table
    - Caption Jobs Table
    - Billing Table
    - Admin Views & Formulas
3. Make.com Scenario Architecture
    - Inbound Trigger (Webhooks)
    - Core Workflow Steps
    - Stripe Webhook Handling
    - Error Handling & Notifications
4. Key Automation Flows
5. Security & Access Control
6. Out-of-Scope (For Reference)

---

## 1. Overview

This document outlines the backend data and automation logic for BoostFrame.io’s captioning SaaS, leveraging **Airtable** for persistent data and **Make.com** for orchestrating workflows, usage policy, and billing.  
It describes the schema, key automations, and policy enforcement logic to keep user experience seamless and secure.

---

## 2. Airtable Base and Schema

### **A. Base Name:** `BoostFrame SaaS`

#### **1. Users Table**

| Field Name                  | Type              | Details / Description                                |
|-----------------------------|-------------------|------------------------------------------------------|
| User ID                     | Autonumber        | Primary key                                          |
| Email                       | Email             | Unique, used for auth                                |
| Name                        | Single line text  |                                                      |
| Auth Provider               | Single select     | e.g. Email, Google, Magic.link                       |
| Stripe Customer ID          | Single line text  | Set after Stripe onboarding                          |
| Plan Tier                   | Single select     | Free, Paid, Canceled, Admin, etc.                    |
| Total Minutes Captioned     | Rollup/Sum        | Sum of Caption Jobs' `Minutes Captioned`             |
| Free Minutes Remaining      | Formula           | `max(0, 5 - Total Minutes Captioned)`                |
| Watermark Minutes Remaining | Formula           | `max(0, 10 - Total Minutes Captioned)`               |
| Is Over Limit               | Formula           | `Total Minutes Captioned >= 10`                      |
| Is Paid                     | Formula           | `Plan Tier = 'Paid'`                                 |
| Last Login                  | Last modified time|                                                      |
| Created At                  | Created time      |                                                      |

---

#### **2. Caption Jobs Table**

| Field Name           | Type               | Details / Description                                 |
|----------------------|--------------------|-------------------------------------------------------|
| Job ID               | Autonumber         | Primary key                                           |
| User (Linked)        | Link to Users      |                                                       |
| Upload Date          | Created time       |                                                       |
| Video File URL       | URL / Attachment   | GCS/S3/Drive URL                                      |
| Video Duration       | Number (decimal)   | Minutes, or seconds if needed                         |
| Watermarked          | Checkbox / Formula | Set by Make.com (TRUE if watermark applied)           |
| Status               | Single select      | Pending, Processing, Complete, Blocked, Failed        |
| Output Caption File  | URL / Attachment   | SRT, VTT, etc.                                        |
| Output Video File    | URL / Attachment   | Burned-in or watermarked file                         |
| Caption Options      | Long text / JSON   | Raw options object from user                          |
| Minutes Captioned    | Formula            | Mirrors Video Duration                                |
| Billing ID           | Link to Billing    | For paid users, connect to Billing Table              |
| Error Log            | Long text          | Any errors encountered during processing              |

---

#### **3. Billing Table**

| Field Name         | Type                | Details / Description                                 |
|--------------------|---------------------|-------------------------------------------------------|
| Billing ID         | Autonumber          | Primary key                                           |
| User (Linked)      | Link to Users       | Foreign key                                           |
| Stripe Payment ID  | Single line text    | Stripe charge/subscription ID                         |
| Payment Date       | Date                |                                                       |
| Amount             | Currency            |                                                       |
| Plan               | Single select       | Free, Monthly, PAYG, etc.                             |
| Minutes Purchased  | Number              | For PAYG                                              |
| Status             | Single select       | Succeeded, Failed, Refunded, Canceled                 |

---

#### **4. Admin Views & Formulas**

- **Recent Jobs:** Filter jobs by status for support
- **Over Limit:** Users with Is Over Limit = TRUE (promo, upsell)
- **Paid Users:** Plan Tier = Paid
- **Failed Jobs:** For support team to review

##### **Sample Formula for "Is Over Limit":**
```airtable
IF({Total Minutes Captioned} >= 10, TRUE(), FALSE())
