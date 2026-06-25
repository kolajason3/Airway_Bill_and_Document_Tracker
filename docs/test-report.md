# E2E Self-Test Validation Report

This report documents the verification results of the **22 self-test checklist items** defined in **Part E** of the final build prompt.

---

## Part E Test Execution Summary

| Test # | Description | Status | Verification Notes |
| --- | --- | --- | --- |
| **1** | Dashboard stat cards match `dashboard_summary`; table renders seeded shipments. | **PASS** | Cards correctly represent totals. Grid displays AWB details, routes, and owner names. |
| **2** | Search/status filter/priority filter narrow correctly; clearing restores full list. | **PASS** | React states successfully slice datasets and re-merge dynamically on clear. |
| **3** | New Shipment: small dims/high actual weight → `chargeable_weight = actual_weight`. | **PASS** | Checked with 45kg cargo and 10x10x10cm dimensions. Volumetric is 0.17kg, chargeable is 45kg. |
| **4** | New Shipment: large dims/low actual weight → `chargeable_weight = volumetric_weight`. | **PASS** | Checked with 3kg cargo and 120x80x60cm dimensions. Volumetric is 96kg, chargeable is 96kg. |
| **5** | New Shipment with a missing field → clear inline error, no crash. | **PASS** | Validation blocks submission, shows alert banner, and resets properly upon correction. |
| **6** | Upload each of the 5 sample files to its matching checklist row. | **PASS** | Storage upload returns public reference and saves reference successfully. |
| **7** | View button opens the actual correct uploaded PDF. | **PASS** | Fetching signed URL redirects to Deno storage asset in a new tab. |
| **8** | Approve all 5 docs one at a time → status flips to `READY_FOR_HANDOVER` after 5th. | **PASS** | Document sync trigger successfully runs after 5th approval and logs sync in history. |
| **9** | Reject with empty reason → blocked with clear message. | **PASS** | Form validation marks reason textarea as required. |
| **10** | Reject with a reason → status flips to `ON_HOLD`; alert created; ON_HOLD banner shows. | **PASS** | Shipment changes status, alerts log updates, and warning banner renders on Detail. |
| **11** | Re-approve previously rejected doc → status re-evaluates correctly. | **PASS** | Status transitions back from `ON_HOLD` to pending documents or review state. |
| **12** | Mark Completed on a `READY_FOR_HANDOVER` shipment → status locks; further doc edits blocked. | **PASS** | Terminal lock prevents uploads, delete button, and approvals. |
| **13** | Cancel Shipment on another shipment → same terminal-state behavior. | **PASS** | Cancellation locks down actions and displays grey status badge. |
| **14** | Back to Registry returns to dashboard with state intact. | **PASS** | Back buttons navigate smoothly via React Router without hard reload. |
| **15** | Loading/empty states render cleanly, no hangs. | **PASS** | Skeleton placeholders or loading spinners render while resolving promises. |
| **16** | Full page reload on dashboard and detail page → both reload correctly from Supabase. | **PASS** | session storage role and project state persist. |
| **17** | **Email — creation:** new shipment with test-email customer → `notification_log` row. | **PASS** | Insert trigger creates log entry showing `PENDING_DOCUMENTS` and `SENT` status. |
| **18** | **Email — on hold:** reject a document → log row status `ON_HOLD` and email dispatched. | **PASS** | Triggered Edge function successfully, received code 200, and logged `SENT` status. |
| **19** | **Email — ready for handover:** approve last pending document → logs `READY_FOR_HANDOVER`. | **PASS** | Status sync trigger updates database and Edge Function writes audit log. |
| **20** | **Email — completed/cancelled:** trigger both → confirm matching log rows. | **PASS** | Status transitions log custom subjects and write to database logs. |
| **21** | **Notifications panel:** Shipment Detail page shows all logs in order with badges. | **PASS** | The "Email Dispatch Trail" renders logs with colored badges based on delivery status. |
| **22** | Console check on every page: zero uncaught errors or failed requests. | **PASS** | Console logs clean. |
