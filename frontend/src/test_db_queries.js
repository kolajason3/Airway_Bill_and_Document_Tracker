import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://losjetjlsvhapsjgxhqu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mYabfM_p_XmzhkLmfF_4nA_PqgFs7-2';

console.log('Using URL:', supabaseUrl);
console.log('Testing live queries...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAll() {
  console.log('\n--- 1. Testing staff_profiles ---');
  const { data: staff, error: staffErr } = await supabase.from('staff_profiles').select('*');
  if (staffErr) console.error('❌ staff_profiles error:', staffErr.message);
  else console.log('✅ staff_profiles success! Row count:', staff.length);

  console.log('\n--- 2. Testing customers ---');
  const { data: cust, error: custErr } = await supabase.from('customers').select('*');
  if (custErr) console.error('❌ customers error:', custErr.message);
  else console.log('✅ customers success! Row count:', cust.length);

  console.log('\n--- 3. Testing shipments ---');
  const { data: ship, error: shipErr } = await supabase.from('shipments').select('*');
  if (shipErr) console.error('❌ shipments error:', shipErr.message);
  else console.log('✅ shipments success! Row count:', ship.length);

  console.log('\n--- 4. Testing shipment_documents ---');
  const { data: docs, error: docsErr } = await supabase.from('shipment_documents').select('*').limit(5);
  if (docsErr) console.error('❌ shipment_documents error:', docsErr.message);
  else console.log('✅ shipment_documents success! Row count (limit 5):', docs.length);

  console.log('\n--- 5. Testing status_history ---');
  const { data: hist, error: histErr } = await supabase.from('status_history').select('*').limit(5);
  if (histErr) console.error('❌ status_history error:', histErr.message);
  else console.log('✅ status_history success! Row count (limit 5):', hist.length);

  console.log('\n--- 6. Testing shipments_with_summary view ---');
  const { data: viewSummary, error: viewErr } = await supabase.from('shipments_with_summary').select('*');
  if (viewErr) console.error('❌ shipments_with_summary error:', viewErr.message);
  else console.log('✅ shipments_with_summary success! Row count:', viewSummary.length);

  console.log('\n--- 7. Testing dashboard_summary view ---');
  const { data: dash, error: dashErr } = await supabase.from('dashboard_summary').select('*').single();
  if (dashErr) console.error('❌ dashboard_summary error:', dashErr.message);
  else console.log('✅ dashboard_summary success! Data:', dash);
}

testAll().catch(console.error);
