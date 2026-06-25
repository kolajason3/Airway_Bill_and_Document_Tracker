-- ORBEM Solutions Private Limited
-- Migration 0003: Views

CREATE OR REPLACE VIEW shipments_with_summary AS
SELECT
  s.*,
  c.name AS customer_name,
  c.type AS customer_type,
  (SELECT COUNT(*) FROM shipment_documents sd
   WHERE sd.shipment_id = s.id AND sd.status != 'APPROVED') AS missing_document_count
FROM shipments s
LEFT JOIN customers c ON c.id = s.customer_id;

CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  COUNT(*) AS total_shipments,
  COUNT(*) FILTER (WHERE status = 'PENDING_DOCUMENTS') AS pending_documents,
  COUNT(*) FILTER (WHERE status = 'READY_FOR_HANDOVER') AS ready_for_handover,
  COUNT(*) FILTER (WHERE status = 'ON_HOLD') AS on_hold,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
  COUNT(*) FILTER (WHERE priority_flag = TRUE) AS priority_count
FROM shipments;
