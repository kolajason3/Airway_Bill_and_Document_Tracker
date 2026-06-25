-- ORBEM Solutions Private Limited
-- Migration 0002: Functions & Triggers

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
