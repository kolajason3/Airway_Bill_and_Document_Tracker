import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileSearch, AlertTriangle, Search, Filter, Plus, CheckCircle2, XCircle, Clock, Edit, ListCollapse, Users, Download, ArrowRight, Ban, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function Dashboard({ activePortal, activeUser }) {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [globalLogs, setGlobalLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const [analytics, setAnalytics] = useState({
    total_shipments: 0,
    pending_documents: 0,
    ready_for_handover: 0,
    on_hold: 0,
    completed: 0,
    priority_count: 0
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch summary from dashboard_summary view
      const { data: summaryRes, error: summaryErr } = await supabase
        .from('dashboard_summary')
        .select('*')
        .single();

      if (!summaryErr && summaryRes) {
        setAnalytics(summaryRes);
      }

      // Fetch shipments from shipments_with_summary view
      const { data: shipmentsData, error: shipmentsErr } = await supabase
        .from('shipments_with_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (shipmentsErr) throw shipmentsErr;
      setShipments(shipmentsData || []);

      // Fetch logs and staff if Admin
      if (activePortal === 'admin') {
        const { data: staffData } = await supabase
          .from('staff_profiles')
          .select('*')
          .order('name', { ascending: true });
        
        setStaffList(staffData || []);

        const { data: logsData } = await supabase
          .from('status_history')
          .select('*')
          .order('created_at', { ascending: false });

        setGlobalLogs(logsData || []);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch cargo records from Supabase database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShipment = async (shipmentId, awbNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete shipment with AWB ${awbNumber}?`)) {
      return;
    }
    try {
      setError('');
      setLoading(true);
      const { error: delErr } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (delErr) throw delErr;

      // Clean up related documents, history, and alerts
      await supabase.from('shipment_documents').delete().eq('shipment_id', shipmentId);
      await supabase.from('status_history').delete().eq('shipment_id', shipmentId);
      await supabase.from('alerts').delete().eq('shipment_id', shipmentId);

      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete shipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activePortal]);

  // Apply filters client-side for dynamic reactivity
  useEffect(() => {
    let result = shipments;
    
    if (statusFilter) {
      result = result.filter(s => s.status === statusFilter);
    }
    
    if (priorityFilter === 'priority') {
      result = result.filter(s => s.priority_flag === true);
    }

    if (ownerFilter) {
      result = result.filter(s => s.assigned_owner === ownerFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const cleanQuery = q.replace(/[^a-zA-Z0-9]/g, '');
      result = result.filter(s => {
        const cleanAwb = s.awb_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const matchesAwb = s.awb_number.toLowerCase().includes(q) || (cleanQuery && cleanAwb.includes(cleanQuery));
        return (
          matchesAwb ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          s.origin_airport.toLowerCase().includes(q) ||
          s.destination_airport.toLowerCase().includes(q) ||
          (s.assigned_owner && s.assigned_owner.toLowerCase().includes(q))
        );
      });
    }
    setFilteredShipments(result);
  }, [search, statusFilter, priorityFilter, ownerFilter, shipments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY_FOR_HANDOVER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Ready Handover
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle size={12} /> On Hold
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <Ban size={12} /> Cancelled
          </span>
        );
      case 'PENDING_DOCUMENTS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Pending Docs
          </span>
        );
    }
  };

  const getOwnerOptions = () => {
    const owners = shipments.map(s => s.assigned_owner).filter(Boolean);
    return [...new Set(owners)];
  };

  const handleExportCSV = () => {
    if (filteredShipments.length === 0) return;
    
    const headers = ['AWB Number', 'Customer Name', 'Customer Type', 'Route', 'Package Count', 'Actual Weight', 'Chargeable Weight', 'Status', 'Owner', 'Priority', 'Notes', 'Created At'];
    
    const rows = filteredShipments.map(s => [
      s.awb_number,
      s.customer_name || 'N/A',
      s.customer_type || 'N/A',
      `${s.origin_airport} -> ${s.destination_airport}`,
      s.package_count,
      s.actual_weight,
      s.chargeable_weight,
      s.status,
      s.assigned_owner || 'Unassigned',
      s.priority_flag ? 'Yes' : 'No',
      (s.notes || '').replace(/"/g, '""'),
      new Date(s.created_at).toLocaleString()
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `awb_cargo_tracker_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Analytics Summary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-card border border-border-color rounded-2xl p-5 flex items-center gap-5 hover:border-accent-blue/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
            <Package size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-header font-bold">{analytics.total_shipments}</h3>
            <p className="text-text-muted text-xs font-medium tracking-wide uppercase mt-0.5">Total Shipments</p>
          </div>
        </div>

        <div className="bg-bg-card border border-border-color rounded-2xl p-5 flex items-center gap-5 hover:border-amber-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <FileSearch size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-header font-bold">{analytics.pending_documents}</h3>
            <p className="text-text-muted text-xs font-medium tracking-wide uppercase mt-0.5">Pending Docs</p>
          </div>
        </div>

        <div className="bg-bg-card border border-border-color rounded-2xl p-5 flex items-center gap-5 hover:border-red-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-header font-bold">{analytics.on_hold}</h3>
            <p className="text-text-muted text-xs font-medium tracking-wide uppercase mt-0.5">Gate Holds</p>
          </div>
        </div>

        <div className="bg-bg-card border border-border-color rounded-2xl p-5 flex items-center gap-5 hover:border-emerald-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-header font-bold">{analytics.ready_for_handover}</h3>
            <p className="text-text-muted text-xs font-medium tracking-wide uppercase mt-0.5">Ready Handover</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
          <Ban size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Shipment Status Board */}
      <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-header font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></span>
            Operational Cargo Registry
          </h2>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              disabled={filteredShipments.length === 0}
              className="bg-[#151d30] border border-[#222f47] hover:bg-bg-card-hover text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors duration-200 disabled:opacity-50"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={() => navigate('/shipments/new')}
              className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors duration-200"
            >
              <Plus size={16} /> Intake Shipment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by AWB, Customer, Route, Owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0b0f19] border border-[#222f47] rounded-xl pl-10 pr-4 py-2.5 text-sm w-full text-white placeholder-text-muted outline-none focus:border-accent-blue transition-colors duration-200"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-2.5 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_DOCUMENTS">Pending Documents</option>
              <option value="READY_FOR_HANDOVER">Ready for Handover</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-2.5 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
            >
              <option value="">All Priorities</option>
              <option value="priority">Priority Only</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-2.5 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
            >
              <option value="">All Owners</option>
              {getOwnerOptions().map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-text-muted">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-3"></div>
              Loading database records...
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-16 text-text-muted border border-dashed border-[#222f47] rounded-xl">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">No shipments matched filter criteria.</p>
              <p className="text-xs mt-1">Try resetting the filters or register a new shipment profile.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222f47] text-text-muted text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-4">AWB Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Route</th>
                  <th className="pb-3">Chargeable Weight</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Missing Paperwork</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222f47]/50 text-sm">
                {filteredShipments.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="py-4 pl-4 font-header font-bold tracking-wide text-white">
                        <span className="flex items-center gap-1.5">
                          {s.priority_flag && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Priority Shipment"></span>}
                          {s.awb_number}
                        </span>
                      </td>
                      <td className="py-4 text-text-muted font-medium">
                        <div>
                          <p className="text-white font-semibold">{s.customer_name || 'Guest Exporter'}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{s.customer_type || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-text-muted uppercase">{s.origin_airport} &rarr; {s.destination_airport}</td>
                      <td className="py-4 text-white font-medium">{s.chargeable_weight} kg</td>
                      <td className="py-4">{getStatusBadge(s.status)}</td>
                      <td className="py-4 text-center pl-6">
                        {s.missing_document_count > 0 ? (
                          <span className="inline-flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold h-6 px-2 rounded-lg">
                            {s.missing_document_count} Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold h-6 px-2 rounded-lg">
                            0 Clear
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-text-muted font-medium">{s.assigned_owner || 'Unassigned'}</td>
                      <td className="py-4 pr-4 text-right">
                        <div className="inline-flex items-center gap-3 justify-end">
                          <button 
                            onClick={() => navigate(`/shipments/${s.id}`)}
                            className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                          >
                            Audit Documents &rarr;
                          </button>
                          
                          {/* Edit parameters */}
                          <button 
                            onClick={() => navigate(`/shipments/edit/${s.id}`)}
                            title="Edit Cargo Parameters"
                            className="text-text-muted hover:text-white p-2 hover:bg-[#151d30] rounded-lg transition-colors border border-transparent hover:border-[#222f47]"
                          >
                            <Edit size={14} />
                          </button>

                          {activePortal === 'admin' && s.status === 'CANCELLED' && (
                            <button 
                              onClick={() => handleDeleteShipment(s.id, s.awb_number)}
                              title="Delete Cancelled Shipment"
                              className="text-red-500 hover:text-white p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Active Employee Directory (Admin Only) */}
      {activePortal === 'admin' && (
        <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
          <h3 className="font-header font-semibold text-sm border-b border-[#222f47] pb-3 mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            Active Operations Staff Monitor (Live Database Status)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffList.map((s) => (
              <div key={s.id} className="bg-bg-main border border-[#222f47] p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1 overflow-hidden pr-2">
                  <h4 className="font-bold text-white text-xs truncate">{s.name}</h4>
                  <p className="text-[10px] text-text-muted truncate">{s.role}</p>
                  <p className="text-[9px] text-text-muted truncate">Mob: {s.phone || 'N/A'}</p>
                </div>
                <div className="flex-shrink-0">
                  {s.logged_in ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-text-muted border border-white/10">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Administrative Audit Logs Viewer */}
      {activePortal === 'admin' && (
        <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center justify-between w-full text-left font-header font-semibold text-sm border-b border-[#222f47] pb-3 text-text-muted hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ListCollapse size={16} className="text-accent-blue" />
              Global Operations Audit Trail (Admin Master Log)
            </span>
            <span className="text-xs text-accent-blue font-bold">
              {showLogs ? 'Collapse Logs' : 'Expand Logs'}
            </span>
          </button>

          {showLogs && (
            <div className="mt-4 max-h-72 overflow-y-auto space-y-3.5 text-xs pr-2">
              {globalLogs.length === 0 ? (
                <p className="text-text-muted text-center py-4">No audit actions recorded.</p>
              ) : (
                globalLogs.map((log) => (
                  <div key={log.id} className="bg-bg-main border border-[#222f47] rounded-xl p-3.5 space-y-1.5 animate-fade-in">
                    <div className="flex justify-between items-center text-[10px] text-text-muted font-bold tracking-wider">
                      <span>{log.action_taken.toUpperCase()}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white font-medium">
                      <span>User: <strong className="text-emerald-400">{log.action_by}</strong></span>
                      <span>Status: <strong className="text-amber-400 font-mono">{log.new_status}</strong></span>
                    </div>
                    {log.notes && <p className="text-text-muted leading-relaxed mt-1">{log.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
