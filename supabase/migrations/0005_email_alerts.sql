CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    channel VARCHAR(20) DEFAULT 'EMAIL',
    recipient_email VARCHAR(255),
    subject VARCHAR(255),
    status_snapshot shipment_status_enum,
    send_status VARCHAR(20), -- SENT | FAILED | SIMULATED | SKIPPED_NO_EMAIL
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_notification_log ON notification_log FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION trigger_customer_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload_body JSONB;
BEGIN
  payload_body := jsonb_build_object('shipment_id', NEW.id);
  
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'UNPAID' AND NEW.payment_status = 'PAID') THEN
    payload_body := payload_body || jsonb_build_object('event', 'PAYMENT_CONFIRMED');
  END IF;

  PERFORM net.http_post(
    url := 'https://losjetjlsvhapsjgxhqu.functions.supabase.co/send-status-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pldGpsc3ZoYXBzamd4aHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzczODEsImV4cCI6MjA5Nzg1MzM4MX0.L08jGH0ZVa_4hEst23zHaJBT895jplCDKUZqWOr-eVw'
    ),
    body := payload_body
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_email_on_create
AFTER INSERT ON shipments
FOR EACH ROW EXECUTE FUNCTION trigger_customer_email_notification();

CREATE TRIGGER trg_email_on_status_change
AFTER UPDATE OF status ON shipments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trigger_customer_email_notification();

CREATE TRIGGER trg_email_on_payment_change
AFTER UPDATE OF payment_status ON shipments
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION trigger_customer_email_notification();
