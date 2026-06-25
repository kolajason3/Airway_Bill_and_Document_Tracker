# QA Bug Report & System Limitations

This document lists bugs resolved during final development and validation checks, along with prototype configurations and platform scope boundaries.

---

## 1. Resolved Issues

| Component | Description | Resolution |
| --- | --- | --- |
| **supabase.js (Mock)** | `TypeError: maybeSingle is not a function` during search query fallback. | Implemented the `maybeSingle()` query resolver inside all mock query builder return points. |
| **test_client_email.js** | Public search checking card was not accessible due to initial Gateway card collapse. | Updated the browser automation script to click the `'Exporter / Customer Tracking'` card first. |
| **test_client_email.js** | Browser session persistence kept operators logged in, bypassing tracking gateway. | Added a `sessionStorage.clear()` instruction to force logout between client lookup transitions. |
| **ShipmentDetail.jsx** | File reference paths had hardcoded references matching legacy `document-vault` naming. | Standardized storage bucket handling to `shipment-documents` with 60-second expiration. |

---

## 2. System Limitations & Assumptions

1. **Row Level Security (RLS) Policies**:
   - The RLS policies implemented on the PostgreSQL database (`0004_rls_policies.sql`) are configured with `USING (true) WITH CHECK (true)`. This leaves rows open to unrestricted read/write operations by any user with a public anon key, which is optimal for rapid testing and demonstrations but should be secured (bound to auth user IDs) prior to production deployment.

2. **Resend Free Sandbox**:
   - Without domain verification on resend.com, the Resend mail API will only successfully deliver emails to the single owner/developer account that signed up for the key. Other recipient addresses will mock a valid `SENT` callback in the `notification_log` but will be dropped by Resend's security sandbox. This is a Resend API level limitation, not a software bug.

3. **Private Storage signed URLs**:
   - The `shipment-documents` private bucket signed URLs are set to expire in 60 seconds. This meets the master security spec, meaning links opened in a new tab will fail to render if they are reloaded after 1 minute.
