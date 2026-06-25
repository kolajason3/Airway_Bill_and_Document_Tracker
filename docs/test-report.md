# System Verification Test Report

Full automated and manual end-to-end self-test results for the Airway Bill & Document Tracker.

| Step | Test Case Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| 1 | Dashboard stat cards match `dashboard_summary` view | **PASS** | Cards render numbers fetched from query perfectly. |
| 2 | Search/status filter/priority filter narrow correctly | **PASS** | Search bar filter is responsive, filters state correctly. |
| 3 | Small dimensions / high actual weight chargeable wt | **PASS** | Chargeable weight evaluates to actual weight correctly. |
| 4 | Large dimensions / low actual weight chargeable wt | **PASS** | Chargeable weight evaluates to volumetric weight correctly. |
| 5 | New Shipment with missing fields triggers inline error | **PASS** | Form reports standard HTML5/custom validation, no crash. |
| 6 | Upload 5 sample PDFs to shipment checklist rows | **PASS** | PDF files upload and update backend reference tables. |
| 7 | "View" button opens correct uploaded PDF | **PASS** | Generates 60s pre-signed URLs and launches file. |
| 8 | Approve all 5 documents, triggering status update | **PASS** | Shipment changes to `READY_FOR_HANDOVER` after 5 approvals. |
| 9 | Reject with empty reason blocked | **PASS** | UI textarea validated, form submission prevented. |
| 10 | Reject with reason changes status to `ON_HOLD` | **PASS** | Status transitions to `ON_HOLD` and displays red banner. |
| 11 | Re-approve rejected doc re-evaluates status | **PASS** | Flips status back to `PENDING_DOCUMENTS` or `READY_FOR_HANDOVER`. |
| 12 | Mark Completed locks doc editing | **PASS** | Terminal status locked; uploads/actions disabled. |
| 13 | Cancel shipment locks doc editing | **PASS** | Terminal status locked; uploads/actions disabled. |
| 14 | "Back to Registry" retains previous state | **PASS** | Standard navigation preserves parameters. |
| 15 | Loading/empty states render cleanly | **PASS** | Spinner loaders and fallback templates work without hangs. |
| 16 | Page reload restores full data correctly | **PASS** | All routes reload by fetching current UUID parameters. |
| 17 | Creation email creates `PENDING_DOCUMENTS` log | **PASS** | Dispatches HTTP trigger and inserts `SENT` mock row. |
| 18 | Document rejection email creates `ON_HOLD` log | **PASS** | Dispatches trigger with rejected file detail log. |
| 19 | Final document approval creates `READY_FOR_HANDOVER` log | **PASS** | Status sync inserts log. |
| 20 | Completed/Cancelled updates log status | **PASS** | Status update writes custom dispatch trail. |
| 21 | Shipment detail notifications panel displays logs | **PASS** | Outbound trails list SENT / SIMULATED badges with timestamps. |
| 22 | Check page console for errors | **PASS** | Zero uncaught JavaScript exceptions. |
