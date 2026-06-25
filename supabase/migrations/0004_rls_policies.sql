-- ORBEM Solutions Private Limited
-- Migration 0004: RLS Policies

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
