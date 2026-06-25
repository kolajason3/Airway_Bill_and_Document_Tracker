# Bug Report & Known Limitations

## Issues Found & Resolved During Implementation

1. **Vite dev server restart issue**: 
   - *Symptom*: When environment configuration (.env) is renamed or modified, Vite restarts. Playwright was hitting ERR_CONNECTION_REFUSED during startup.
   - *Resolution*: Set appropriate startup delay in test script execution to ensure Vite has fully booted before navigating.
2. **Mock Client `maybeSingle` function crash**:
   - *Symptom*: Public tracking search in `PortalGateway.jsx` invoked `.maybeSingle()` which crashed when using the Mock Database client.
   - *Resolution*: Implemented `maybeSingle` on the Mock client builders inside [supabase.js](file:///c:/Users/john/Downloads/New%20Project/frontend/src/services/supabase.js).
3. **Session persistence bypass**:
   - *Symptom*: E2E tests got stuck on logged-in views when reloading page.
   - *Resolution*: Added `sessionStorage.clear()` inside test validation routines to ensure logout transitions operate correctly.

## Prototype Limitations & Operational Scope

1. **Row Level Security (RLS) policies**:
   - All tables (`customers`, `shipments`, `shipment_documents`, `status_history`, `alerts`) are fully configured with RLS `USING (true) WITH CHECK (true)` for prototype testing convenience. In production, these should restrict access based on user role authentication.
2. **Resend Free Sandbox**:
   - Resend operates in sandbox mode unless custom domains are verified. Consequently, real inbox delivery is limited only to the registered developer email address (others will return `SENT` from the API, but actual inbox routing is suppressed).
3. **Mock Storage URLs**:
   - In local mock mode, storage returns static pre-signed paths, while in real mode it requests authentic signed URLs from the Supabase client.
