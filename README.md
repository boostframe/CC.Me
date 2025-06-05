# CaptionCraft Me

This project is a Node/React application originally built for Replit. To run it locally you will need Node.js 20 and a PostgreSQL database.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in the required environment variables. At a minimum you will need database credentials, Stripe keys, Airtable credentials and Google Cloud Storage credentials.

3. Start the development server:

```bash
npm run dev
```

The server listens on port `5000`.

4. Type-check the project:

```bash
npm run check
```

## Environment variables
See `.env.example` for a full list. Important keys include:

- `DATABASE_URL`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`
- `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`
- Google Cloud Storage keys: `GCS_TYPE`, `GCS_PROJECT_ID`, `GCS_PRIVATE_KEY_ID`, `GCS_PRIVATE_KEY`, `GCS_CLIENT_EMAIL`, `GCS_CLIENT_ID`, `GCS_AUTH_URI`, `GCS_TOKEN_URI`, `GCS_AUTH_PROVIDER_X509_CERT_URL`, `GCS_CLIENT_X509_CERT_URL`, `GCS_UNIVERSE_DOMAIN`
- `DISABLE_REPLIT_AUTH=true` if running outside Replit

