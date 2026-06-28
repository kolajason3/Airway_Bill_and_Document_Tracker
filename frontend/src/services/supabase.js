import { createClient } from '@supabase/supabase-js';

// Read configuration from Vite environment variables (real Supabase credentials)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are valid and populated (key must look like a real JWT)
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseUrl !== '' &&
  supabaseAnonKey.startsWith('eyJ');

// =========================================================================
// MOCK SEED DATA FOR LOCAL STORAGE
// =========================================================================
const defaultStaff = [
  { id: 'd1111111-1111-1111-1111-111111111111', name: 'Akshaya', role: 'Employee', email: 'ammu.n2428@gmail.com', phone: '+91-98765-43210', password: 'akshaya123', approved: true, logged_in: false },
  { id: 'd2222222-2222-2222-2222-222222222222', name: 'Rasul khan', role: 'Administrator', email: 'mohammedrasulkhan09@gmail.com', phone: '+91-99887-76655', password: 'rasul123', approved: true, logged_in: false },
  { id: 'd3333333-3333-3333-3333-333333333333', name: 'Jason', role: 'Administrator', email: 'kolajason3@gmail.com', phone: '+91-91234-56789', password: 'jason123', approved: true, logged_in: false }
];

const defaultCustomers = [
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Lufthansa Cargo Service', type: 'IMPORTER', company_name: 'Lufthansa Cargo AG', email: 'kolajason3@gmail.com', phone: '+49-69-696-0' },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Apex Pharma Logistics', type: 'EXPORTER', company_name: 'Apex Pharmaceuticals', email: 'mohammedrasulkhan09@gmail.com', phone: '+971-4-888-8888' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Global Electronics Dispatch', type: 'AGENT', company_name: 'Global Electronics Corp', email: 'ammu.n2428@gmail.com', phone: '+31-20-500-1234' }
];

const defaultShipments = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    customer_id: 'c0000000-0000-0000-0000-000000000002',
    client_email: 'kolajason3@gmail.com',
    awb_number: '157-12345670',
    origin_airport: 'HYD',
    destination_airport: 'DXB',
    pickup_city: 'Hyderabad',
    cargo_type: 'Vitamins',
    package_count: 3,
    actual_weight: 45.0,
    length_cm: 120.0,
    width_cm: 80.0,
    height_cm: 60.0,
    volumetric_weight: 96.0,
    chargeable_weight: 96.0,
    payment_status: 'PAID',
    status: 'PENDING_DOCUMENTS',
    priority_flag: false,
    assigned_owner: 'Akshaya',
    notes: 'Refrigerate if stored overnight.',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    customer_id: 'c0000000-0000-0000-0000-000000000001',
    client_email: 'kolajason3@gmail.com',
    awb_number: '157-12345671',
    origin_airport: 'DEL',
    destination_airport: 'SIN',
    pickup_city: 'Delhi',
    cargo_type: 'Heavy Machinery parts',
    package_count: 1,
    actual_weight: 400.0,
    length_cm: 10.0,
    width_cm: 10.0,
    height_cm: 10.0,
    volumetric_weight: 0.17,
    chargeable_weight: 400.0,
    payment_status: 'PAID',
    status: 'READY_FOR_HANDOVER',
    priority_flag: true,
    assigned_owner: 'Jason',
    notes: 'Urgent replacement gear.',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    customer_id: 'c0000000-0000-0000-0000-000000000003',
    client_email: 'kolajason3@gmail.com',
    awb_number: '157-12345672',
    origin_airport: 'HYD',
    destination_airport: 'DEL',
    pickup_city: 'Hyderabad',
    cargo_type: 'Electronics',
    package_count: 5,
    actual_weight: 150.0,
    length_cm: 50.0,
    width_cm: 50.0,
    height_cm: 40.0,
    volumetric_weight: 16.67,
    chargeable_weight: 150.0,
    payment_status: 'UNPAID',
    status: 'ON_HOLD',
    priority_flag: false,
    assigned_owner: 'Akshaya',
    notes: 'Fragile electronic chips.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    customer_id: 'c0000000-0000-0000-0000-000000000002',
    client_email: 'kolajason3@gmail.com',
    awb_number: '157-12345673',
    origin_airport: 'DEL',
    destination_airport: 'HYD',
    pickup_city: 'Delhi',
    cargo_type: 'Pharma products',
    package_count: 10,
    actual_weight: 300.0,
    length_cm: 60.0,
    width_cm: 60.0,
    height_cm: 60.0,
    volumetric_weight: 36.0,
    chargeable_weight: 300.0,
    payment_status: 'PAID',
    status: 'COMPLETED',
    priority_flag: false,
    assigned_owner: 'Jason',
    notes: 'Completed and delivered.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    customer_id: 'c0000000-0000-0000-0000-000000000001',
    client_email: 'kolajason3@gmail.com',
    awb_number: '157-12345674',
    origin_airport: 'SIN',
    destination_airport: 'HYD',
    pickup_city: 'Singapore',
    cargo_type: 'Exotic flowers',
    package_count: 2,
    actual_weight: 20.0,
    length_cm: 40.0,
    width_cm: 30.0,
    height_cm: 20.0,
    volumetric_weight: 4.0,
    chargeable_weight: 20.0,
    payment_status: 'UNPAID',
    status: 'CANCELLED',
    priority_flag: false,
    assigned_owner: 'Unassigned',
    notes: 'Cancelled order by agent.',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 3600000).toISOString()
  }
];

const defaultDocuments = [
  // Shipment 1: PENDING_DOCUMENTS (2 approved, 3 pending)
  { id: 'd-1-1', shipment_id: 'a0000000-0000-0000-0000-000000000001', document_type: 'AWB_NUMBER', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345670/awb.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-1-2', shipment_id: 'a0000000-0000-0000-0000-000000000001', document_type: 'COMMERCIAL_INVOICE', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345670/invoice.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-1-3', shipment_id: 'a0000000-0000-0000-0000-000000000001', document_type: 'PACKING_LIST', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-1-4', shipment_id: 'a0000000-0000-0000-0000-000000000001', document_type: 'ID_PROOF', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-1-5', shipment_id: 'a0000000-0000-0000-0000-000000000001', document_type: 'CARGO_DECLARATION', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },

  // Shipment 2: READY_FOR_HANDOVER (All approved)
  { id: 'd-2-1', shipment_id: 'a0000000-0000-0000-0000-000000000002', document_type: 'AWB_NUMBER', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345671/awb.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-2-2', shipment_id: 'a0000000-0000-0000-0000-000000000002', document_type: 'COMMERCIAL_INVOICE', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345671/invoice.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-2-3', shipment_id: 'a0000000-0000-0000-0000-000000000002', document_type: 'PACKING_LIST', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345671/packing.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-2-4', shipment_id: 'a0000000-0000-0000-0000-000000000002', document_type: 'ID_PROOF', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345671/id.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-2-5', shipment_id: 'a0000000-0000-0000-0000-000000000002', document_type: 'CARGO_DECLARATION', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345671/declaration.pdf', rejection_reason: null, updated_at: new Date().toISOString() },

  // Shipment 3: ON_HOLD (One rejected with reason)
  { id: 'd-3-1', shipment_id: 'a0000000-0000-0000-0000-000000000003', document_type: 'AWB_NUMBER', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345672/awb.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-3-2', shipment_id: 'a0000000-0000-0000-0000-000000000003', document_type: 'COMMERCIAL_INVOICE', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345672/invoice.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-3-3', shipment_id: 'a0000000-0000-0000-0000-000000000003', document_type: 'PACKING_LIST', status: 'REJECTED', file_reference: 'https://mock.supabase.co/157-12345672/packing.pdf', rejection_reason: 'Packing list has blurry text and lacks clear itemized weight distribution.', updated_at: new Date().toISOString() },
  { id: 'd-3-4', shipment_id: 'a0000000-0000-0000-0000-000000000003', document_type: 'ID_PROOF', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-3-5', shipment_id: 'a0000000-0000-0000-0000-000000000003', document_type: 'CARGO_DECLARATION', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },

  // Shipment 4: COMPLETED (All approved)
  { id: 'd-4-1', shipment_id: 'a0000000-0000-0000-0000-000000000004', document_type: 'AWB_NUMBER', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345673/awb.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-4-2', shipment_id: 'a0000000-0000-0000-0000-000000000004', document_type: 'COMMERCIAL_INVOICE', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345673/invoice.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-4-3', shipment_id: 'a0000000-0000-0000-0000-000000000004', document_type: 'PACKING_LIST', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345673/packing.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-4-4', shipment_id: 'a0000000-0000-0000-0000-000000000004', document_type: 'ID_PROOF', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345673/id.pdf', rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-4-5', shipment_id: 'a0000000-0000-0000-0000-000000000004', document_type: 'CARGO_DECLARATION', status: 'APPROVED', file_reference: 'https://mock.supabase.co/157-12345673/declaration.pdf', rejection_reason: null, updated_at: new Date().toISOString() },

  // Shipment 5: CANCELLED (All pending)
  { id: 'd-5-1', shipment_id: 'a0000000-0000-0000-0000-000000000005', document_type: 'AWB_NUMBER', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-5-2', shipment_id: 'a0000000-0000-0000-0000-000000000005', document_type: 'COMMERCIAL_INVOICE', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-5-3', shipment_id: 'a0000000-0000-0000-0000-000000000005', document_type: 'PACKING_LIST', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-5-4', shipment_id: 'a0000000-0000-0000-0000-000000000005', document_type: 'ID_PROOF', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() },
  { id: 'd-5-5', shipment_id: 'a0000000-0000-0000-0000-000000000005', document_type: 'CARGO_DECLARATION', status: 'PENDING', file_reference: null, rejection_reason: null, updated_at: new Date().toISOString() }
];

const defaultLogs = [
  { id: 'log-1', shipment_id: 'a0000000-0000-0000-0000-000000000001', previous_status: null, new_status: 'PENDING_DOCUMENTS', action_taken: 'SHIPMENT_CREATED', action_by: 'system', notes: 'Consignment registered in system.', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'log-2', shipment_id: 'a0000000-0000-0000-0000-000000000002', previous_status: null, new_status: 'READY_FOR_HANDOVER', action_taken: 'SHIPMENT_CREATED', action_by: 'system', notes: 'All document verifications cleared.', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'log-3', shipment_id: 'a0000000-0000-0000-0000-000000000003', previous_status: null, new_status: 'ON_HOLD', action_taken: 'SHIPMENT_CREATED', action_by: 'system', notes: 'Shipment flagged due to rejected document.', created_at: new Date(Date.now() - 2 * 3600000).toISOString() }
];

const defaultAlerts = [
  { id: 'alert-1', shipment_id: 'a0000000-0000-0000-0000-000000000003', alert_type: 'DOCUMENT_REJECTED', message: 'A document was rejected — shipment placed on hold.', is_read: false, created_at: new Date().toISOString() }
];

const defaultNotifications = [
  { id: 'n-1', shipment_id: 'a0000000-0000-0000-0000-000000000001', channel: 'EMAIL', recipient_email: 'kolajason3@gmail.com', subject: 'Shipment 157-12345670 Registered — Documents Pending', status_snapshot: 'PENDING_DOCUMENTS', send_status: 'SENT', error_message: null, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'n-2', shipment_id: 'a0000000-0000-0000-0000-000000000002', channel: 'EMAIL', recipient_email: 'kolajason3@gmail.com', subject: 'Shipment 157-12345671 — Ready for Airline Handover', status_snapshot: 'READY_FOR_HANDOVER', send_status: 'SENT', error_message: null, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'n-3', shipment_id: 'a0000000-0000-0000-0000-000000000003', channel: 'EMAIL', recipient_email: 'kolajason3@gmail.com', subject: 'Action Needed: Shipment 157-12345672 On Hold', status_snapshot: 'ON_HOLD', send_status: 'SENT', error_message: null, created_at: new Date(Date.now() - 2 * 3600000).toISOString() }
];

const initLocalStorage = () => {
  const existingStaff = localStorage.getItem('sb_staff_profiles');
  if (!existingStaff || !existingStaff.includes('kolajason3@gmail.com') || !existingStaff.includes('password')) {
    localStorage.setItem('sb_staff_profiles', JSON.stringify(defaultStaff));
  }
  const existingCustomers = localStorage.getItem('sb_customers');
  if (!existingCustomers || !existingCustomers.includes('mohammedrasulkhan09@gmail.com')) {
    localStorage.setItem('sb_customers', JSON.stringify(defaultCustomers));
  }
  if (!localStorage.getItem('sb_shipments')) {
    localStorage.setItem('sb_shipments', JSON.stringify(defaultShipments));
  }
  if (!localStorage.getItem('sb_shipment_documents')) {
    localStorage.setItem('sb_shipment_documents', JSON.stringify(defaultDocuments));
  }
  if (!localStorage.getItem('sb_status_history')) {
    localStorage.setItem('sb_status_history', JSON.stringify(defaultLogs));
  }
  if (!localStorage.getItem('sb_alerts')) {
    localStorage.setItem('sb_alerts', JSON.stringify(defaultAlerts));
  }
  if (!localStorage.getItem('sb_whatsapp_logs')) {
    localStorage.setItem('sb_whatsapp_logs', JSON.stringify([]));
  }
  if (!localStorage.getItem('sb_notification_log')) {
    localStorage.setItem('sb_notification_log', JSON.stringify(defaultNotifications));
  }
};

initLocalStorage();

// =========================================================================
// LOCAL STORAGE MOCK CLIENT IMPLEMENTATION
// =========================================================================
class MockSupabaseClient {
  constructor() {
    this.storage = {
      from: (bucket) => ({
        upload: async (path, file) => {
          const mockUrl = `https://losjetjlsvhapsjgxhqu.supabase.co/storage/v1/object/public/${bucket}/${path}`;
          return { data: { path, publicUrl: mockUrl }, error: null };
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: `https://losjetjlsvhapsjgxhqu.supabase.co/storage/v1/object/public/document-vault/${path}` } };
        },
        remove: async (paths) => {
          return { data: paths, error: null };
        }
      })
    };
  }

  from(table) {
    const getData = () => JSON.parse(localStorage.getItem(`sb_${table}`) || '[]');
    const saveData = (data) => localStorage.setItem(`sb_${table}`, JSON.stringify(data));

    return {
      select: (fields = '*') => {
        let list = getData();

        // Emulate views
        if (table === 'dashboard_summary') {
          const shipments = JSON.parse(localStorage.getItem('sb_shipments') || '[]');
          const summary = {
            total_shipments: shipments.length,
            pending_documents: shipments.filter(s => s.status === 'PENDING_DOCUMENTS').length,
            ready_for_handover: shipments.filter(s => s.status === 'READY_FOR_HANDOVER').length,
            on_hold: shipments.filter(s => s.status === 'ON_HOLD').length,
            completed: shipments.filter(s => s.status === 'COMPLETED').length,
            priority_count: shipments.filter(s => s.priority_flag === true).length
          };
          return {
            single: async () => ({ data: summary, error: null }),
            maybeSingle: async () => ({ data: summary, error: null }),
            then: async (resolve) => resolve({ data: [summary], error: null })
          };
        }

        if (table === 'shipments_with_summary') {
          const shipments = JSON.parse(localStorage.getItem('sb_shipments') || '[]');
          const customers = JSON.parse(localStorage.getItem('sb_customers') || '[]');
          const docs = JSON.parse(localStorage.getItem('sb_shipment_documents') || '[]');

          list = shipments.map(s => {
            const cust = customers.find(c => c.id === s.customer_id);
            const missingCount = docs.filter(d => d.shipment_id === s.id && d.status !== 'APPROVED').length;
            return {
              ...s,
              customer_name: cust ? cust.name : 'Unknown',
              customer_type: cust ? cust.type : null,
              missing_document_count: missingCount
            };
          });
        }

        // Emulate joins inside details
        if (table === 'shipments') {
          const customers = JSON.parse(localStorage.getItem('sb_customers') || '[]');
          const docs = JSON.parse(localStorage.getItem('sb_shipment_documents') || '[]');
          const history = JSON.parse(localStorage.getItem('sb_status_history') || '[]');

          list = list.map(s => {
            const cust = customers.find(c => c.id === s.customer_id) || null;
            const shDocs = docs.filter(d => d.shipment_id === s.id);
            const shHist = history.filter(h => h.shipment_id === s.id);
            const notifications = JSON.parse(localStorage.getItem('sb_notification_log') || '[]');
            const shNotif = notifications.filter(n => n.shipment_id === s.id);
            return {
              ...s,
              customer: cust,
              shipment_documents: shDocs,
              status_history: shHist,
              notification_log: shNotif
            };
          });
        }

        return {
          eq: (column, value) => {
            let filtered = list.filter(item => item[column] === value);
            return {
              single: async () => ({ data: filtered[0] || null, error: null }),
              maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
              then: async (resolve) => resolve({ data: filtered, error: null })
            };
          },
          order: (column, { ascending = false } = {}) => {
            const sorted = [...list].sort((a, b) => {
              if (a[column] < b[column]) return ascending ? -1 : 1;
              if (a[column] > b[column]) return ascending ? 1 : -1;
              return 0;
            });
            return {
              then: async (resolve) => resolve({ data: sorted, error: null })
            };
          },
          then: async (resolve) => resolve({ data: list, error: null })
        };
      },

      insert: (rows) => {
        const list = getData();
        const newRows = Array.isArray(rows) 
          ? rows.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }))
          : [{ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...rows }];

        // Simulation of database trigger: trg_calculate_weights + trg_init_documents
        if (table === 'shipments') {
          newRows.forEach(sh => {
            const lengthVal = parseFloat(sh.length_cm) || 0;
            const widthVal = parseFloat(sh.width_cm) || 0;
            const heightVal = parseFloat(sh.height_cm) || 0;
            const actualWeightVal = parseFloat(sh.actual_weight) || 0;

            sh.volumetric_weight = (lengthVal * widthVal * heightVal) / 6000;
            sh.chargeable_weight = Math.max(actualWeightVal, sh.volumetric_weight);
            sh.status = sh.status || 'PENDING_DOCUMENTS';
            sh.updated_at = new Date().toISOString();

            // Spawn 5 document rows
            const docs = JSON.parse(localStorage.getItem('sb_shipment_documents') || '[]');
            const types = ['AWB_NUMBER', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'ID_PROOF', 'CARGO_DECLARATION'];
            types.forEach(t => {
              docs.push({
                id: crypto.randomUUID(),
                shipment_id: sh.id,
                document_type: t,
                file_reference: null,
                status: 'PENDING',
                rejection_reason: null,
                updated_at: new Date().toISOString()
              });
            });
            localStorage.setItem('sb_shipment_documents', JSON.stringify(docs));

            // Log history
            const logs = JSON.parse(localStorage.getItem('sb_status_history') || '[]');
            logs.push({
              id: crypto.randomUUID(),
              shipment_id: sh.id,
              previous_status: null,
              new_status: sh.status,
              action_taken: 'SHIPMENT_CREATED',
              action_by: sh.assigned_owner || 'system',
              notes: 'Airway bill registered. Document placeholders initialized.',
              created_at: new Date().toISOString()
            });
            localStorage.setItem('sb_status_history', JSON.stringify(logs));

            // Log mock notification
            const notifications = JSON.parse(localStorage.getItem('sb_notification_log') || '[]');
            const cust = JSON.parse(localStorage.getItem('sb_customers') || '[]').find(c => c.id === sh.customer_id);
            const paymentMsg = sh.payment_status === 'UNPAID' ? ' (Note: Payment is pending)' : '';
            notifications.push({
              id: crypto.randomUUID(),
              shipment_id: sh.id,
              channel: 'EMAIL',
              recipient_email: sh.client_email || (cust ? cust.email : null),
              subject: `Shipment ${sh.awb_number} Registered — Documents Pending${paymentMsg}`,
              status_snapshot: sh.status,
              send_status: (sh.client_email || (cust ? cust.email : null)) ? 'SENT' : 'SKIPPED_NO_EMAIL',
              error_message: null,
              created_at: new Date().toISOString()
            });
            localStorage.setItem('sb_notification_log', JSON.stringify(notifications));
          });
        }

        list.push(...newRows);
        saveData(list);

        return {
          select: () => ({
            single: async () => ({ data: newRows[0], error: null }),
            maybeSingle: async () => ({ data: newRows[0] || null, error: null }),
            then: async (resolve) => resolve({ data: newRows, error: null })
          }),
          then: async (resolve) => resolve({ data: newRows, error: null })
        };
      },

      update: (updates) => {
        return {
          eq: (column, value) => {
            const list = getData();
            let updatedRows = [];
            const updatedList = list.map(item => {
              if (item[column] === value) {
                const updated = { ...item, ...updates, updated_at: new Date().toISOString() };
                
                // Trigger emulator for weight recalculations
                if (table === 'shipments') {
                  const lengthVal = parseFloat(updated.length_cm) || 0;
                  const widthVal = parseFloat(updated.width_cm) || 0;
                  const heightVal = parseFloat(updated.height_cm) || 0;
                  const actualWeightVal = parseFloat(updated.actual_weight) || 0;
                  updated.volumetric_weight = (lengthVal * widthVal * heightVal) / 6000;
                  updated.chargeable_weight = Math.max(actualWeightVal, updated.volumetric_weight);

                  // Trigger mock notification if status changed!
                  if (item.status !== updated.status) {
                    const notifications = JSON.parse(localStorage.getItem('sb_notification_log') || '[]');
                    const cust = JSON.parse(localStorage.getItem('sb_customers') || '[]').find(c => c.id === updated.customer_id);
                    let subject = `Update for Shipment ${updated.awb_number}`;
                    if (updated.status === 'READY_FOR_HANDOVER') {
                      subject = `Shipment ${updated.awb_number} — Ready for Airline Handover`;
                    } else if (updated.status === 'ON_HOLD') {
                      subject = `Action Needed: Shipment ${updated.awb_number} On Hold`;
                    } else if (updated.status === 'COMPLETED') {
                      subject = `Shipment ${updated.awb_number} Completed`;
                    } else if (updated.status === 'CANCELLED') {
                      subject = `Shipment ${updated.awb_number} Cancelled`;
                    } else if (updated.status === 'PENDING_DOCUMENTS') {
                      subject = `Shipment ${updated.awb_number} Registered — Documents Pending`;
                    }
                    notifications.push({
                      id: crypto.randomUUID(),
                      shipment_id: updated.id,
                      channel: 'EMAIL',
                      recipient_email: updated.client_email || (cust ? cust.email : null),
                      subject,
                      status_snapshot: updated.status,
                      send_status: (updated.client_email || (cust ? cust.email : null)) ? 'SENT' : 'SKIPPED_NO_EMAIL',
                      error_message: null,
                      created_at: new Date().toISOString()
                    });
                    localStorage.setItem('sb_notification_log', JSON.stringify(notifications));
                  }

                  // Trigger mock notification if payment status changed to PAID!
                  if (item.payment_status !== updated.payment_status && updated.payment_status === 'PAID') {
                    const notifications = JSON.parse(localStorage.getItem('sb_notification_log') || '[]');
                    const cust = JSON.parse(localStorage.getItem('sb_customers') || '[]').find(c => c.id === updated.customer_id);
                    notifications.push({
                      id: crypto.randomUUID(),
                      shipment_id: updated.id,
                      channel: 'EMAIL',
                      recipient_email: updated.client_email || (cust ? cust.email : null),
                      subject: `Payment Confirmed: Shipment ${updated.awb_number}`,
                      status_snapshot: updated.status,
                      send_status: (updated.client_email || (cust ? cust.email : null)) ? 'SENT' : 'SKIPPED_NO_EMAIL',
                      error_message: null,
                      created_at: new Date().toISOString()
                    });
                    localStorage.setItem('sb_notification_log', JSON.stringify(notifications));
                  }
                }

                updatedRows.push(updated);
                return updated;
              }
              return item;
            });

            saveData(updatedList);

            // Simulation of database trigger: trg_sync_status
            if (table === 'shipment_documents' && updatedRows.length > 0) {
              const doc = updatedRows[0];
              const shipments = JSON.parse(localStorage.getItem('sb_shipments') || '[]');
              const sh = shipments.find(s => s.id === doc.shipment_id);

              if (sh && sh.status !== 'COMPLETED' && sh.status !== 'CANCELLED') {
                const docs = JSON.parse(localStorage.getItem('sb_shipment_documents') || '[]');
                const shDocs = docs.filter(d => d.shipment_id === sh.id);

                const rejectedCount = shDocs.filter(d => d.status === 'REJECTED').length;
                const approvedCount = shDocs.filter(d => d.status === 'APPROVED').length;

                let newStatus = sh.status;
                if (rejectedCount > 0) {
                  newStatus = 'ON_HOLD';
                } else if (approvedCount === 5) {
                  newStatus = 'READY_FOR_HANDOVER';
                } else {
                  newStatus = 'PENDING_DOCUMENTS';
                }

                if (newStatus !== sh.status) {
                  const oldStatus = sh.status;
                  sh.status = newStatus;
                  sh.updated_at = new Date().toISOString();
                  localStorage.setItem('sb_shipments', JSON.stringify(shipments));

                  // Insert history log
                  const logs = JSON.parse(localStorage.getItem('sb_status_history') || '[]');
                  logs.push({
                    id: crypto.randomUUID(),
                    shipment_id: sh.id,
                    previous_status: oldStatus,
                    new_status: newStatus,
                    action_taken: 'AUTO_STATUS_SYNC',
                    action_by: 'system',
                    notes: 'Trigger recalculated compliance checklist status.',
                    created_at: new Date().toISOString()
                  });
                  localStorage.setItem('sb_status_history', JSON.stringify(logs));

                  // Trigger status change notification email log
                  const notifications = JSON.parse(localStorage.getItem('sb_notification_log') || '[]');
                  const cust = JSON.parse(localStorage.getItem('sb_customers') || '[]').find(c => c.id === sh.customer_id);
                  let subject = `Update for Shipment ${sh.awb_number}`;
                  if (newStatus === 'READY_FOR_HANDOVER') {
                    subject = `Shipment ${sh.awb_number} — Ready for Airline Handover`;
                  } else if (newStatus === 'ON_HOLD') {
                    subject = `Action Needed: Shipment ${sh.awb_number} On Hold`;
                  } else if (newStatus === 'COMPLETED') {
                    subject = `Shipment ${sh.awb_number} Completed`;
                  } else if (newStatus === 'CANCELLED') {
                    subject = `Shipment ${sh.awb_number} Cancelled`;
                  } else if (newStatus === 'PENDING_DOCUMENTS') {
                    subject = `Shipment ${sh.awb_number} Registered — Documents Pending`;
                  }
                  notifications.push({
                    id: crypto.randomUUID(),
                    shipment_id: sh.id,
                    channel: 'EMAIL',
                    recipient_email: sh.client_email || (cust ? cust.email : null),
                    subject,
                    status_snapshot: newStatus,
                    send_status: (sh.client_email || (cust ? cust.email : null)) ? 'SENT' : 'SKIPPED_NO_EMAIL',
                    error_message: null,
                    created_at: new Date().toISOString()
                  });
                  localStorage.setItem('sb_notification_log', JSON.stringify(notifications));

                  // Alert creation
                  if (newStatus === 'ON_HOLD') {
                    const alerts = JSON.parse(localStorage.getItem('sb_alerts') || '[]');
                    alerts.push({
                      id: crypto.randomUUID(),
                      shipment_id: sh.id,
                      alert_type: 'DOCUMENT_REJECTED',
                      message: 'A document was rejected — shipment placed on hold.',
                      is_read: false,
                      created_at: new Date().toISOString()
                    });
                    localStorage.setItem('sb_alerts', JSON.stringify(alerts));
                  }
                }
              }
            }

            return {
              select: () => ({
                single: async () => ({ data: updatedRows[0] || null, error: null }),
                maybeSingle: async () => ({ data: updatedRows[0] || null, error: null }),
                then: async (resolve) => resolve({ data: updatedRows, error: null })
              }),
              then: async (resolve) => resolve({ data: updatedRows, error: null })
            };
          }
        };
      },

      delete: () => {
        return {
          eq: (column, value) => {
            const list = getData();
            const filtered = list.filter(item => item[column] !== value);
            saveData(filtered);
            return {
              then: async (resolve) => resolve({ data: { count: list.length - filtered.length }, error: null })
            };
          }
        };
      }
    };
  }
}

// Export client
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient();

console.log(
  isConfigured 
    ? '⚡ Connected to Supabase Cloud Instance.' 
    : '📦 Initialized configuration-free Supabase Local Storage Mock Adapter.'
);
