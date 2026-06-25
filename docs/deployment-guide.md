# Deployment & Configuration Guide

Follow these instructions to deploy the database schemas, configure Resend API keys, deploy Edge Functions, and run the React frontend.

---

## 1. Supabase Database Schema Setup

If you are setting up the Supabase database for the first time:
1. Open your project on the [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** tab.
3. Open a new query window, copy and paste the contents of `supabase/migrations/0001_init_schema.sql` through `0004_rls_policies.sql` (and optionally `seed.sql`), then click **Run**.
4. To implement email alerts triggers, copy and run the compiled migration script in `supabase/migrations/0005_email_alerts.sql`.

---

## 2. Supabase Storage Bucket Configuration

1. In the Supabase Dashboard, go to **Storage**.
2. Click **New Bucket**.
3. Name it exactly `shipment-documents`.
4. Make sure it is set to **Private** (or Public, but private is recommended for secure audits as signed URL pre-generation is fully integrated in our frontend code).
5. Create a storage RLS Policy:
   ```sql
   CREATE POLICY "allow_all_storage" ON storage.objects FOR ALL USING (bucket_id = 'shipment-documents') WITH CHECK (bucket_id = 'shipment-documents');
   ```

---

## 3. Resend Integration & Edge Function Deployment

To deploy the automated status email alert system to Supabase Cloud:

### Step 1: Install & Authenticate CLI
Confirm you have the Supabase CLI installed, and log in using your account access token:
```bash
npx supabase login
# Or set env variable: $env:SUPABASE_ACCESS_TOKEN="your_access_token_here"
```

### Step 2: Configure Resend Secret
Set the Resend API Key inside the remote Supabase secret manager. This allows the Edge Function to send emails securely without exposing keys:
```bash
npx supabase secrets set --project-ref <your-project-ref> RESEND_API_KEY="your_resend_api_key"
```

### Step 3: Deploy Edge Function
Deploy the `send-status-email` function using server-side bundling:
```bash
npx supabase functions deploy send-status-email --project-ref <your-project-ref> --use-api
```
Upon completion, copy the printed live URL (e.g. `https://<your-project-ref>.functions.supabase.co/send-status-email`).

---

## 4. Run Frontend Locally

1. Create a `.env` file in the `frontend` folder:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key-jwt
   ```
2. Run local installation and start the Vite dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
