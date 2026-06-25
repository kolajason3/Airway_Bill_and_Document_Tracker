-- ORBEM Solutions Private Limited
-- Seed Data

-- 1. Seed Staff Profiles
INSERT INTO staff_profiles (id, name, role, email, phone, logged_in) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Akshaya', 'Employee', 'akshaya@orbem.com', '+91-98765-43210', false),
  ('d2222222-2222-2222-2222-222222222222', 'Rasul khan', 'Administrator', 'rasulkhan@orbem.com', '+91-99887-76655', false),
  ('d3333333-3333-3333-3333-333333333333', 'Jason', 'Employee', 'jason@orbem.com', '+91-91234-56789', false)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, phone = EXCLUDED.phone;

-- 2. Seed Customers
INSERT INTO customers (id, name, type, company_name, phone, email) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Lufthansa Cargo Service', 'IMPORTER', 'Lufthansa Cargo AG', '+49-69-696-0', 'cargo-fra@lufthansa.com'),
  ('c0000000-0000-0000-0000-000000000002', 'Apex Pharma Logistics', 'EXPORTER', 'Apex Pharmaceuticals', '+971-4-888-8888', 'shipping@apexpharma.com'),
  ('c0000000-0000-0000-0000-000000000003', 'Global Electronics Dispatch', 'AGENT', 'Global Electronics Corp', '+31-20-500-1234', 'dispatch@globalelec.com')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Shipments (Note: Triggers calculate weights and init 5 documents on insert)
-- Shipment 1: PENDING_DOCUMENTS (Volumetric Weight is authorative: 120x80x60/6000 = 96.0 kg > 45.0 kg actual)
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, payment_status, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '157-12345670', 'HYD', 'DXB', 'Hyderabad', 'Vitamins', 3, 45.00, 120.00, 80.00, 60.00, 'PAID', 'PENDING_DOCUMENTS', false, 'Akshaya', 'Refrigerate if stored overnight.')
ON CONFLICT (awb_number) DO NOTHING;

-- Shipment 2: READY_FOR_HANDOVER (Actual Weight is authorative: 400.0 kg > 10x10x10/6000 volumetric)
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, payment_status, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '157-12345671', 'DEL', 'SIN', 'Delhi', 'Heavy Machinery parts', 1, 400.00, 10.00, 10.00, 10.00, 'PAID', 'PENDING_DOCUMENTS', true, 'Jason', 'Urgent replacement gear.')
ON CONFLICT (awb_number) DO NOTHING;

-- Shipment 3: ON_HOLD (Has rejected document + reason)
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, payment_status, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '157-12345672', 'HYD', 'DEL', 'Hyderabad', 'Electronics', 5, 150.00, 50.00, 50.00, 40.00, 'UNPAID', 'PENDING_DOCUMENTS', false, 'Akshaya', 'Fragile electronic chips.')
ON CONFLICT (awb_number) DO NOTHING;

-- Shipment 4: COMPLETED
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, payment_status, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', '157-12345673', 'DEL', 'HYD', 'Delhi', 'Pharma products', 10, 300.00, 60.00, 60.00, 60.00, 'PAID', 'PENDING_DOCUMENTS', false, 'Jason', 'Completed and delivered.')
ON CONFLICT (awb_number) DO NOTHING;

-- Shipment 5: CANCELLED
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, payment_status, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', '157-12345674', 'SIN', 'HYD', 'Singapore', 'Exotic flowers', 2, 20.00, 40.00, 30.00, 20.00, 'UNPAID', 'PENDING_DOCUMENTS', false, 'Unassigned', 'Cancelled order by agent.')
ON CONFLICT (awb_number) DO NOTHING;


-- 4. Update documents statuses to match desired operational states
-- Shipment 1 (PENDING_DOCUMENTS): 2 uploaded and pending review, 3 missing
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345670/awb.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000001' AND document_type = 'AWB_NUMBER';
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345670/invoice.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000001' AND document_type = 'COMMERCIAL_INVOICE';

-- Shipment 2 (READY_FOR_HANDOVER): All 5 documents are APPROVED
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345671/awb.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000002';

-- Shipment 3 (ON_HOLD): One document is REJECTED
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345672/awb.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'AWB_NUMBER';
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345672/invoice.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'COMMERCIAL_INVOICE';
UPDATE shipment_documents SET status = 'REJECTED', file_reference = 'https://mock.supabase.co/157-12345672/packing.pdf', rejection_reason = 'Packing list has illegible text and lacks clear itemized weight distribution.' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'PACKING_LIST';

-- Shipment 4 (COMPLETED): Update documents to approved, then manually toggle to COMPLETED terminal state
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345673/all.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE shipments SET status = 'COMPLETED' WHERE id = 'a0000000-0000-0000-0000-000000000004';

-- Shipment 5 (CANCELLED): Manually toggle to CANCELLED terminal state
UPDATE shipments SET status = 'CANCELLED' WHERE id = 'a0000000-0000-0000-0000-000000000005';
