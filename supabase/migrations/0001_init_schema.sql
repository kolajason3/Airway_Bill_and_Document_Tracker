-- ORBEM Solutions Private Limited
-- Migration 0001: Init Schema

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

-- Enums
CREATE TYPE customer_type_enum AS ENUM ('EXPORTER','IMPORTER','AGENT','LOGISTICS_PARTNER');
CREATE TYPE shipment_status_enum AS ENUM ('PENDING_DOCUMENTS','READY_FOR_HANDOVER','ON_HOLD','COMPLETED','CANCELLED');
CREATE TYPE doc_type_enum AS ENUM ('AWB_NUMBER','COMMERCIAL_INVOICE','PACKING_LIST','ID_PROOF','CARGO_DECLARATION');
CREATE TYPE doc_status_enum AS ENUM ('PENDING','APPROVED','REJECTED');

-- Tables
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
    client_email VARCHAR(255),
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
