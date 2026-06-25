# Airway Bill & Document Tracker (AWB-DT)
### ORBEM Solutions Private Limited — Serverless Supabase Redesign (React JSX)

The **Airway Bill & Document Tracker** is a secure cargo control tower application designed to automate document compliance auditing. This redesigned serverless version uses **React with plain JavaScript/JSX**, **Supabase** (Database, Storage, Edge Functions, pg_net), and **Resend** to automate real-time status email alerts.

---

## 🚀 Key Features

1. **Multi-Role Portal Selection Screen**: On startup, choose to sign in as **Admin** (unrestricted override access), log in as a **Staff Employee** (e.g., Akshaya, Rasul khan, Jason), or search and track as a **Guest Exporter**.
2. **Admin Control Center**: Administrators can edit shipment details, bypass rules to force change cargo statuses, delete shipments entirely, and inspect a global operational audit log.
3. **Staff Operations Panel**: Cargo employees can run new AWB intakes (registering shipments) and upload compliance files, but are restricted from deleting data or executing final airport gate clearance.
4. **Real File Upload Vault**: Replaces simple checkbox switches with a drag-and-drop file uploader that saves compliance documents directly to **Supabase Storage** and allows viewing or downloading the files.
5. **Volumetric Chargeable Calculator**: Integrated volumetric weight tool implementing cargo density checkoffs to calculate chargeable weight (`(L * W * H) / 6000`).
6. **SQL Database Triggers**: Automatically audits uploaded URLs. Once all 5 files are present, the database auto-promotes the status from `Documents Pending` to `Ready for Review`.
7. **Email Alerting System**: Dispatches automatic email updates (via **Resend**) on shipment registration, status transitions (e.g., placed on hold, ready for airline handover, completed, or cancelled).
8. **Email Audit Trail**: Displays a dense log of all dispatched notifications directly on the shipment details dashboard.

---

## 📁 System Documentation

For detailed guides, models, and reports, see the following:
- [System Architecture](file:///c:/Users/john/Downloads/New%20Project/docs/architecture.md) — React ↔ Supabase ↔ Resend data flow.
- [Entity-Relationship Diagram](file:///c:/Users/john/Downloads/New%20Project/docs/er-diagram.md) — Mermaid ER diagram of all 6 database tables.
- [Use Case Diagram](file:///c:/Users/john/Downloads/New%20Project/docs/use-case-diagram.md) — Actors and platform boundaries.
- [Deployment Guide](file:///c:/Users/john/Downloads/New%20Project/docs/deployment-guide.md) — CLI commands, secrets setting, and Edge Function deployment.
- [Self-Test Validation Report](file:///c:/Users/john/Downloads/New%20Project/docs/test-report.md) — Full Part E checklist pass/fail report.
- [QA Bug Report](file:///c:/Users/john/Downloads/New%20Project/docs/bug-report.md) — Fixed bugs, constraints, and known limitations.

---

## ⚙️ Running Locally (Zero-Configuration Sandbox)

1. Open your terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the displayed local address (e.g., `http://localhost:5173`) in your browser. 
   - *Note: Since no `.env` file is present, the app will initialize with sandbox mock data seeded in your browser's Local Storage, including full emulation of the Resend email logs and storage folders!*
