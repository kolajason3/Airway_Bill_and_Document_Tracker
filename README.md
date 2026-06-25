# Airway Bill & Document Tracker (AWB-DT)
### ORBEM Solutions Private Limited — Serverless Supabase Redesign (React JSX)

The **Airway Bill & Document Tracker** is a secure cargo control tower application designed to automate document compliance auditing. This redesigned serverless version uses **React with plain JavaScript/JSX** and **Supabase** for database-backed storage, secure auth, and file uploads.

To make evaluation configuration-free, the application includes an **Automated Local Storage Mock Adapter**. If cloud credentials are not supplied, it automatically emulates all database tables, storage upload buckets, and triggers inside your web browser.

---

## 🚀 Key Features

1. **Multi-Role Portal Selection Screen**: On startup, choose to sign in as **Admin** (unrestricted override access), log in as a **Staff Employee** (e.g. Akshaya, Rasul khan, Jason), or search and track as a **Guest Exporter**.
2. **Admin Control Center**: Administrators can edit shipment details, bypass rules to force change cargo statuses, delete shipments entirely, and inspect a global operational audit log.
3. **Staff Operations Panel**: Cargo employees can run new AWB intakes (registering shipments) and upload compliance files, but are restricted from deleting data or executing final airport gate clearance.
4. **Real File Upload Vault**: Replaces simple checkbox switches with a drag-and-drop file uploader that saves compliance documents directly to **Supabase Storage** and allows viewing or downloading the files.
5. **Volumetric Chargeable Calculator**: Integrated volumetric weight tool implementing cargo density checkoffs to calculate chargeable weight (`(L * W * H) / 6000`).
6. **SQL Database Triggers**: Automatically audits uploaded URLs. Once all 5 files are present, the database auto-promotes the status from `Documents Pending` to `Ready for Review`.

---

## 🛠️ Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PortalGateway.jsx  # Login selection screen (Admin, Staff, Exporter Search)
│   │   │   ├── Dashboard.jsx      # KPIs, shipments grid, and Admin Master logs
│   │   │   ├── ShipmentDetail.jsx # Uploader panel, Admin overrides, and audit logs timeline
│   │   │   └── ShipmentForm.jsx   # Cargo registry intake (and edit panel for Admin)
│   │   ├── services/
│   │   │   └── supabase.js       # Supabase Client SDK & Local Mock fallback adapter
│   │   ├── App.jsx                # Navigation, routing, and role state management
│   │   ├── main.jsx               # React mount root
│   │   └── index.css              # Tailwind CSS directives & style layers
│   ├── package.json               # Vite package manifest
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── postcss.config.js
│   └── index.html
├── schema.sql                     # Production PostgreSQL setup scripts & Triggers
└── README.md                      # Presentation and configuration guide
```

---

## ⚙️ Running Locally (Zero-Configuration)

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
4. Open the displayed local address (e.g. `http://localhost:5173` or `http://localhost:5174`) in your browser. 
   - *Note: Since no `.env` file is present, the app will initialize with sandbox mock data seeded in your browser's Local Storage!*

---

## ☁️ Connecting to Supabase Cloud

To connect the application to your live Supabase cloud database:

1. Create a free account at [Supabase](https://supabase.com) and spin up a new project.
2. Go to the **SQL Editor** tab in your Supabase dashboard, paste the entire SQL script from the root `schema.sql` file, and click **Run**. This will create the tables, triggers, and seed staff profiles.
3. Open the **Storage** tab, create a new public bucket, and name it exactly `document-vault`.
4. In the settings of your Supabase project, copy the **Project URL** and **API Anon Key**.
5. Create a file named `.env` in the `frontend` directory and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-string
   ```
6. Restart your Vite development server (`npm run dev`). The client console log will print: `⚡ Connected to Supabase Cloud Instance.` and the app will sync directly with the cloud database.
