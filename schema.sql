-- ORBEM Solutions Private Limited
-- Airway Bill & Document Tracker (AWB-DT)
-- Unified database schema, functions, triggers, views, RLS, and seed data.

-- =========================================================================
-- 1. CLEANUP SCHEMA
-- =========================================================================
DROP VIEW IF EXISTS dashboard_summary CASCADE;
DROP VIEW IF EXISTS shipments_with_summary CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS shipment_documents CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;

DROP TYPE IF EXISTS customer_type_enum CASCADE;
DROP TYPE IF EXISTS shipment_status_enum CASCADE;
DROP TYPE IF EXISTS doc_type_enum CASCADE;
DROP TYPE IF EXISTS doc_status_enum CASCADE;

-- =========================================================================
-- 2. ENUMS & TYPE DEFINITIONS
-- =========================================================================
CREATE TYPE customer_type_enum AS ENUM ('EXPORTER','IMPORTER','AGENT','LOGISTICS_PARTNER');
CREATE TYPE shipment_status_enum AS ENUM ('PENDING_DOCUMENTS','READY_FOR_HANDOVER','ON_HOLD','COMPLETED','CANCELLED');
CREATE TYPE doc_type_enum AS ENUM ('AWB_NUMBER','COMMERCIAL_INVOICE','PACKING_LIST','ID_PROOF','CARGO_DECLARATION');
CREATE TYPE doc_status_enum AS ENUM ('PENDING','APPROVED','REJECTED');

-- =========================================================================
-- 3. TABLES
-- =========================================================================
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL CHECK (role IN ('Administrator', 'Employee', 'administrator', 'employee')),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    logged_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type customer_type_enum NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    awb_number VARCHAR(50) UNIQUE NOT NULL,
    origin_airport VARCHAR(10) NOT NULL,
    destination_airport VARCHAR(10) NOT NULL,
    pickup_city VARCHAR(100),
    cargo_type VARCHAR(100),
    package_count INT NOT NULL CHECK (package_count > 0),
    actual_weight NUMERIC(10,2) NOT NULL CHECK (actual_weight > 0),
    length_cm NUMERIC(10,2) NOT NULL CHECK (length_cm > 0),
    width_cm NUMERIC(10,2) NOT NULL CHECK (width_cm > 0),
    height_cm NUMERIC(10,2) NOT NULL CHECK (height_cm > 0),
    volumetric_weight NUMERIC(10,2),
    chargeable_weight NUMERIC(10,2),
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('PAID', 'UNPAID')),
    status shipment_status_enum DEFAULT 'PENDING_DOCUMENTS',
    priority_flag BOOLEAN DEFAULT FALSE,
    assigned_owner VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE shipment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    document_type doc_type_enum NOT NULL,
    file_reference VARCHAR(512),
    file_name VARCHAR(255),
    status doc_status_enum DEFAULT 'PENDING',
    rejection_reason TEXT,
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(shipment_id, document_type),
    CONSTRAINT chk_rejection_reason CHECK (status != 'REJECTED' OR rejection_reason IS NOT NULL)
);

CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    previous_status shipment_status_enum,
    new_status shipment_status_enum NOT NULL,
    action_taken VARCHAR(255),
    action_by VARCHAR(100) DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================================================================
-- 4. FUNCTIONS & TRIGGERS
-- =========================================================================
-- Auto-calculate weights on every insert/update
CREATE OR REPLACE FUNCTION calculate_shipment_weights()
RETURNS TRIGGER AS $$
BEGIN
  NEW.volumetric_weight := (NEW.length_cm * NEW.width_cm * NEW.height_cm) / 6000;
  NEW.chargeable_weight := GREATEST(NEW.actual_weight, NEW.volumetric_weight);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_weights
BEFORE INSERT OR UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION calculate_shipment_weights();

-- On shipment creation: spawn 5 PENDING document rows + initial history entry
CREATE OR REPLACE FUNCTION init_shipment_documents()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shipment_documents (shipment_id, document_type, status) VALUES
    (NEW.id, 'AWB_NUMBER', 'PENDING'),
    (NEW.id, 'COMMERCIAL_INVOICE', 'PENDING'),
    (NEW.id, 'PACKING_LIST', 'PENDING'),
    (NEW.id, 'ID_PROOF', 'PENDING'),
    (NEW.id, 'CARGO_DECLARATION', 'PENDING');

  INSERT INTO status_history (shipment_id, previous_status, new_status, action_taken)
  VALUES (NEW.id, NULL, NEW.status, 'SHIPMENT_CREATED');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_documents
AFTER INSERT ON shipments
FOR EACH ROW EXECUTE FUNCTION init_shipment_documents();

-- Status automation engine: fires on every document status change
CREATE OR REPLACE FUNCTION sync_shipment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_shipment shipments%ROWTYPE;
  v_rejected_count INT;
  v_approved_count INT;
  v_new_status shipment_status_enum;
BEGIN
  SELECT * INTO v_shipment FROM shipments WHERE id = NEW.shipment_id;

  IF v_shipment.status IN ('COMPLETED','CANCELLED') THEN
    RETURN NEW; -- terminal states are manual-only
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status = 'REJECTED'),
    COUNT(*) FILTER (WHERE status = 'APPROVED')
  INTO v_rejected_count, v_approved_count
  FROM shipment_documents WHERE shipment_id = NEW.shipment_id;

  IF v_rejected_count > 0 THEN
    v_new_status := 'ON_HOLD';
  ELSIF v_approved_count = 5 THEN
    v_new_status := 'READY_FOR_HANDOVER';
  ELSE
    v_new_status := 'PENDING_DOCUMENTS';
  END IF;

  IF v_new_status IS DISTINCT FROM v_shipment.status THEN
    UPDATE shipments SET status = v_new_status, updated_at = now() WHERE id = NEW.shipment_id;

    INSERT INTO status_history (shipment_id, previous_status, new_status, action_taken)
    VALUES (NEW.shipment_id, v_shipment.status, v_new_status, 'AUTO_STATUS_SYNC');

    IF v_new_status = 'ON_HOLD' THEN
      INSERT INTO alerts (shipment_id, alert_type, message)
      VALUES (NEW.shipment_id, 'DOCUMENT_REJECTED', 'A document was rejected — shipment placed on hold.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_status
AFTER INSERT OR UPDATE ON shipment_documents
FOR EACH ROW EXECUTE FUNCTION sync_shipment_status();

-- =========================================================================
-- 5. VIEWS
-- =========================================================================
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

-- =========================================================================
-- 6. RLS POLICIES
-- =========================================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_customers ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_shipments ON shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_documents ON shipment_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_history ON status_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_alerts ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_staff ON staff_profiles FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- 7. SEED DATA
-- =========================================================================
-- Seed Staff Profiles
INSERT INTO staff_profiles (id, name, role, email, phone, logged_in) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Akshaya', 'Employee', 'akshaya@orbem.com', '+91-98765-43210', false),
  ('d2222222-2222-2222-2222-222222222222', 'Rasul khan', 'Administrator', 'rasulkhan@orbem.com', '+91-99887-76655', false),
  ('d3333333-3333-3333-3333-333333333333', 'Jason', 'Employee', 'jason@orbem.com', '+91-91234-56789', false)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, phone = EXCLUDED.phone;

-- Seed Customers
INSERT INTO customers (id, name, type, company_name, phone, email) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Lufthansa Cargo Service', 'IMPORTER', 'Lufthansa Cargo AG', '+49-69-696-0', 'cargo-fra@lufthansa.com'),
  ('c0000000-0000-0000-0000-000000000002', 'Apex Pharma Logistics', 'EXPORTER', 'Apex Pharmaceuticals', '+971-4-888-8888', 'shipping@apexpharma.com'),
  ('c0000000-0000-0000-0000-000000000003', 'Global Electronics Dispatch', 'AGENT', 'Global Electronics Corp', '+31-20-500-1234', 'dispatch@globalelec.com')
ON CONFLICT (id) DO NOTHING;

-- Seed Shipments (triggers calculate weight & spawn documents)
INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '157-12345670', 'HYD', 'DXB', 'Hyderabad', 'Vitamins', 3, 45.00, 120.00, 80.00, 60.00, 'PENDING_DOCUMENTS', false, 'Akshaya', 'Refrigerate if stored overnight.')
ON CONFLICT (awb_number) DO NOTHING;

INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '157-12345671', 'DEL', 'SIN', 'Delhi', 'Heavy Machinery parts', 1, 400.00, 10.00, 10.00, 10.00, 'PENDING_DOCUMENTS', true, 'Jason', 'Urgent replacement gear.')
ON CONFLICT (awb_number) DO NOTHING;

INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '157-12345672', 'HYD', 'DEL', 'Hyderabad', 'Electronics', 5, 150.00, 50.00, 50.00, 40.00, 'PENDING_DOCUMENTS', false, 'Akshaya', 'Fragile electronic chips.')
ON CONFLICT (awb_number) DO NOTHING;

INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', '157-12345673', 'DEL', 'HYD', 'Delhi', 'Pharma products', 10, 300.00, 60.00, 60.00, 60.00, 'PENDING_DOCUMENTS', false, 'Jason', 'Completed and delivered.')
ON CONFLICT (awb_number) DO NOTHING;

INSERT INTO shipments (id, customer_id, awb_number, origin_airport, destination_airport, pickup_city, cargo_type, package_count, actual_weight, length_cm, width_cm, height_cm, status, priority_flag, assigned_owner, notes) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', '157-12345674', 'SIN', 'HYD', 'Singapore', 'Exotic flowers', 2, 20.00, 40.00, 30.00, 20.00, 'PENDING_DOCUMENTS', false, 'Unassigned', 'Cancelled order by agent.')
ON CONFLICT (awb_number) DO NOTHING;

-- Seed document states
-- Shipment 1 (PENDING_DOCUMENTS)
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345670/awb.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000001' AND document_type = 'AWB_NUMBER';
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345670/invoice.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000001' AND document_type = 'COMMERCIAL_INVOICE';

-- Shipment 2 (READY_FOR_HANDOVER)
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345671/doc.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000002';

-- Shipment 3 (ON_HOLD)
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345672/awb.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'AWB_NUMBER';
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345672/invoice.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'COMMERCIAL_INVOICE';
UPDATE shipment_documents SET status = 'REJECTED', file_reference = 'https://mock.supabase.co/157-12345672/packing.pdf', rejection_reason = 'Packing list has blurry text and lacks clear itemized weight distribution.' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000003' AND document_type = 'PACKING_LIST';

-- Shipment 4 (COMPLETED)
UPDATE shipment_documents SET status = 'APPROVED', file_reference = 'https://mock.supabase.co/157-12345673/all.pdf' WHERE shipment_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE shipments SET status = 'COMPLETED' WHERE id = 'a0000000-0000-0000-0000-000000000004';

-- Shipment 5 (CANCELLED)
UPDATE shipments SET status = 'CANCELLED' WHERE id = 'a0000000-0000-0000-0000-000000000005';

-- =========================================================================
-- 8. STORAGE BUCKET & POLICIES (document-vault)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-vault', 'document-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Create public storage policies for document-vault
CREATE POLICY "Allow public select" ON storage.objects FOR SELECT USING (bucket_id = 'document-vault');
CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'document-vault');
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE USING (bucket_id = 'document-vault') WITH CHECK (bucket_id = 'document-vault');
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'document-vault');
