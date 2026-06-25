# Airway Bill & Document Tracker (AWB-DT)
### ORBEM Solutions Private Limited — Serverless Supabase Redesign (React JSX)

The **Airway Bill & Document Tracker** is a secure cargo control tower application designed to automate document compliance auditing. This serverless version uses **React (Vite)**, **Supabase** (Postgres + Storage + Edge Functions), and **Resend** to automate operational status notifications to exporter client emails.

---

## 🚀 Key Features

1. **Multi-Role Portal Selection Screen**: On startup, choose to sign in as **Admin** (unrestricted override access), log in as a **Staff Employee** (e.g. Akshaya, Rasul khan, Jason), or search and track as a **Guest Exporter**.
2. **Client Email Capture**: Operators can input a client contact email on intake, which is saved directly to the database.
3. **Resend Email Alerts**: Sends status update emails (intake confirmation, document rejections, airliner handover clearance, completion, and cancellations) directly to client/customer mailboxes.
4. **Outbound Notification Trails**: Renders a dense status dashboard in the shipment details page listing the dispatch history of all email notifications.
5. **Supabase Edge Functions**: Deployed serverless TypeScript endpoints in Deno handle templates compilation and API routing to Resend.
6. **Volumetric Chargeable Calculator**: Integrated volumetric weight tool implementing cargo density checkoffs to calculate chargeable weight (`(L * W * H) / 6000`).

---

## 🛠️ Project Documentation

All system layouts, database entities, and build instructions are documented under the `/docs/` folder:
- [System Architecture](file:///c:/Users/john/Downloads/New%20Project/docs/architecture.md)
- [Entity-Relationship Diagram](file:///c:/Users/john/Downloads/New%20Project/docs/er-diagram.md)
- [Use Case Analysis](file:///c:/Users/john/Downloads/New%20Project/docs/use-case-diagram.md)
- [E2E Testing Report](file:///c:/Users/john/Downloads/New%20Project/docs/test-report.md)
- [Bug Report & Limits](file:///c:/Users/john/Downloads/New%20Project/docs/bug-report.md)
- [Deployment & Setup Guide](file:///c:/Users/john/Downloads/New%20Project/docs/deployment-guide.md)

---

## ⚙️ Running Locally (Mock Mode)

1. Open your terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the displayed local address in your browser. Since no `.env` file is present, it will fallback to mock localStorage mode.
