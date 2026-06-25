# Deployment Guide

Detailed procedures to deploy, run, and configure the ORBEM Solutions Airway Bill & Document Tracker.

## 1. Local Development Quickstart

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` file inside `frontend/` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Start local Vite server**:
   ```bash
   npm run dev
   ```

---

## 2. Supabase Serverless & Database Deployment

1. **Deploy Tables and Logic**:
   Run the migration SQL scripts inside `/supabase/migrations/` in chronological order using the Supabase SQL editor:
   - `0001_init_schema.sql`
   - `0002_functions_triggers.sql`
   - `0003_views.sql`
   - `0004_rls_policies.sql`
   - `0005_email_alerts.sql` *(Note: Make sure to replace Edge Function URL and Anon Key placeholders in file before running)*

2. **Configure Storage Bucket**:
   - Go to Supabase Dashboard -> Storage -> New Bucket.
   - Create a private bucket named `shipment-documents`.

---

## 3. Resend Integration & Supabase Edge Function

1. **Set Server-Side Secrets**:
   Set your Resend API Key in Supabase secrets so the Edge Function can access it securely:
   ```bash
   npx supabase secrets set RESEND_API_KEY=your_api_key_here --project-ref your_project_ref
   ```

2. **Deploy the Edge Function**:
   Execute the deployment command from the project root:
   ```bash
   npx supabase functions deploy send-status-email --project-ref your_project_ref
   ```

3. **Database Webhooks Wiring**:
   Update your database trigger hook to point to the live deployed function url (e.g. `https://your_project_ref.functions.supabase.co/send-status-email`) by running the SQL definitions inside `0005_email_alerts.sql`.
