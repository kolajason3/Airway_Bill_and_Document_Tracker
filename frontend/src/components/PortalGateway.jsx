import React, { useState, useRef, useEffect } from 'react';
import { PlaneTakeoff, Shield, User, FileSearch, ArrowRight, AlertCircle, Info, CheckCircle2, XCircle, Clock, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../services/supabase';

// Card configuration data
const CARDS = {
  admin: {
    id: 'admin',
    label: 'Admin',
    fullLabel: 'Admin Control Center',
    desc: 'Full administrative override control. Verify AWB checklists, force status overrides, and monitor employee activity logs.',
    Icon: Shield,
    accentClass: 'accent-blue',
    bgAccent: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    pillBg: 'bg-accent-blue/10 hover:bg-accent-blue/20 border-accent-blue/25 text-accent-blue',
    btnClass: 'bg-accent-blue hover:bg-accent-blue-hover',
    borderHover: 'hover:border-accent-blue/30',
    glowColor: 'shadow-accent-blue/8',
  },
  employee: {
    id: 'employee',
    label: 'Employee',
    fullLabel: 'Employee Operations',
    desc: 'Register new airway bills, upload required documents, toggle checklist files, and manage audit updates.',
    Icon: User,
    accentClass: 'emerald',
    bgAccent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pillBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25 text-emerald-400',
    btnClass: 'bg-emerald-500 hover:bg-emerald-600',
    borderHover: 'hover:border-emerald-500/30',
    glowColor: 'shadow-emerald-500/8',
  },
  tracking: {
    id: 'tracking',
    label: 'Track AWB',
    fullLabel: 'Exporter / Customer Tracking',
    desc: 'Read-only status dashboard. Check document upload statuses, checkoff progress, and handover approvals in real-time.',
    Icon: FileSearch,
    accentClass: 'amber',
    bgAccent: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    pillBg: 'bg-accent-amber/10 hover:bg-accent-amber/20 border-accent-amber/25 text-accent-amber',
    btnClass: 'bg-[#0b0f19] hover:bg-[#1e293b] border border-[#222f47]',
    borderHover: 'hover:border-accent-amber/30',
    glowColor: 'shadow-accent-amber/8',
  },
};

export default function PortalGateway({ onLogin }) {
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [searchAwb, setSearchAwb] = useState('');
  
  const [adminError, setAdminError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Which card is currently expanded (null = show all 3)
  const [activeCard, setActiveCard] = useState(null);
  // Animation phase: 'idle' | 'expanding' | 'expanded' | 'collapsing'
  const [phase, setPhase] = useState('idle');

  const inputRef = useRef(null);

  // Focus the input field when a card expands
  useEffect(() => {
    if (phase === 'expanded' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [phase, activeCard]);

  const selectCard = (cardId) => {
    if (activeCard === cardId) return;
    setPhase('expanding');
    setActiveCard(cardId);
    // Clear errors when switching
    setAdminError('');
    setEmployeeError('');
    setSearchError('');
    setSearchResult(null);
    setTimeout(() => setPhase('expanded'), 400);
  };

  const collapseAll = () => {
    setPhase('collapsing');
    setTimeout(() => {
      setActiveCard(null);
      setPhase('idle');
    }, 350);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminPasscode === 'admin123' || adminPasscode.toLowerCase() === 'admin') {
      onLogin('admin', { id: 'admin-id', name: 'Administrator', role: 'Administrator', email: 'admin@orbem.com', phone: 'Master Control Phone' });
    } else {
      setAdminError('Invalid admin passcode. Try: admin123');
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setEmployeeError('');
    
    const emailToSearch = employeeEmail.trim().toLowerCase();
    if (!emailToSearch) {
      setEmployeeError('Please enter your employee email.');
      return;
    }

    try {
      // Query staff profiles table by email
      const { data: profile, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('email', emailToSearch)
        .single();

      if (error) {
        setEmployeeError('Profile not found. Try: akshaya@orbem.com or jason@orbem.com');
        return;
      }

      if (profile) {
        // Set logged_in status to true in the database
        await supabase
          .from('staff_profiles')
          .update({ logged_in: true })
          .eq('id', profile.id);

        onLogin('employee', { ...profile, logged_in: true });
      } else {
        setEmployeeError('Profile not found. Try: akshaya@orbem.com or jason@orbem.com');
      }
    } catch (err) {
      console.error(err);
      setEmployeeError('An error occurred during verification.');
    }
  };

  const handleSearchAwb = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    const queryTerm = searchAwb.trim();
    if (!queryTerm) return;

    try {
      // Try exact match first
      let { data, error } = await supabase
        .from('shipments')
        .select('*, customer:customers(*), shipment_documents(*)')
        .eq('awb_number', queryTerm)
        .maybeSingle();

      // If exact match fails, do a flexible normalized match
      if (!data) {
        const cleanQuery = queryTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        // Fetch all shipments to do the in-memory comparison (safe for typical volume in a prototype)
        const { data: allShipments } = await supabase
          .from('shipments')
          .select('*, customer:customers(*), shipment_documents(*)');

        if (allShipments) {
          data = allShipments.find(s => {
            const cleanAwb = s.awb_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return cleanAwb === cleanQuery;
          }) || null;
        }
      }

      if (!data) {
        setSearchError('No shipment found with this AWB number. Try: 157-12345672');
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error querying database.');
    }
  };

  const getCompletionPercent = (s) => {
    if (!s.shipment_documents || s.shipment_documents.length === 0) return 0;
    const approvedCount = s.shipment_documents.filter(d => d.status === 'APPROVED').length;
    return Math.round((approvedCount / 5) * 100);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY_FOR_HANDOVER':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'ON_HOLD':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      case 'PENDING_DOCUMENTS':
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  const formatDocType = (type) => {
    return type.replace(/_/g, ' ');
  };

  // ---- Minimized pill for inactive cards ----
  const renderMinPill = (cardId, index) => {
    const cfg = CARDS[cardId];
    const { Icon } = cfg;
    return (
      <button
        key={cardId}
        onClick={() => selectCard(cardId)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold
          animate-slide-down-fade backdrop-blur-sm cursor-pointer select-none
          ${cfg.pillBg}
          hover:scale-105 active:scale-95
          transition-transform duration-200
        `}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <Icon size={14} />
        <span className="hidden sm:inline">{cfg.label}</span>
      </button>
    );
  };

  // ---- Expanded card content ----
  const renderExpandedContent = () => {
    if (!activeCard) return null;
    const cfg = CARDS[activeCard];

    return (
      <div className={`
        w-full max-w-lg mx-auto
        transition-all duration-500 ease-out
        ${phase === 'expanding' ? 'opacity-0 translate-y-6 scale-95' : ''}
        ${phase === 'expanded' ? 'opacity-100 translate-y-0 scale-100' : ''}
        ${phase === 'collapsing' ? 'opacity-0 -translate-y-4 scale-95' : ''}
      `}>
        <div className={`bg-[#151d30] border border-[#222f47] rounded-3xl p-8 shadow-2xl ${cfg.glowColor} ${cfg.borderHover} transition-all duration-300`}>
          
          {/* Card Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${cfg.bgAccent} border flex items-center justify-center transition-transform duration-500 hover:rotate-6`}>
                <cfg.Icon size={28} />
              </div>
              <div>
                <h2 className="text-xl font-header font-bold">{cfg.fullLabel}</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-1 max-w-sm">{cfg.desc}</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#222f47] to-transparent mb-6" />

          {/* Card-specific form */}
          {activeCard === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Admin Passcode</label>
                <input 
                  ref={inputRef}
                  type="password"
                  placeholder="Enter admin passcode"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminError('');
                  }}
                  className="w-full bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3.5 text-sm text-white placeholder-text-muted outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20 transition-all duration-200"
                />
              </div>
              {adminError && (
                <div className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={13} />
                  <span>{adminError}</span>
                </div>
              )}
              <div className="bg-[#0b0f19] border border-[#222f47] p-3 rounded-xl text-[11px] text-text-muted flex items-start gap-2">
                <Info size={15} className="text-accent-blue flex-shrink-0 mt-0.5" />
                <span>Demo passcode is <strong className="text-white">admin123</strong></span>
              </div>
              <button 
                type="submit"
                className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-accent-blue/20 active:scale-[0.98]"
              >
                Enter Admin Portal <ArrowRight size={16} />
              </button>
            </form>
          )}

          {activeCard === 'employee' && (
            <form onSubmit={handleEmployeeSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Employee Email</label>
                <input 
                  ref={inputRef}
                  type="email"
                  placeholder="e.g. akshaya@orbem.com"
                  value={employeeEmail}
                  onChange={(e) => {
                    setEmployeeEmail(e.target.value);
                    setEmployeeError('');
                  }}
                  className="w-full bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3.5 text-sm text-white placeholder-text-muted outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
              {employeeError && (
                <div className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={13} />
                  <span>{employeeError}</span>
                </div>
              )}
              <div className="bg-[#0b0f19] border border-[#222f47] p-3 rounded-xl text-[11px] text-text-muted flex items-start gap-2">
                <Info size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Try: <strong className="text-white">akshaya@orbem.com</strong> or <strong className="text-white">jason@orbem.com</strong></span>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                Sign In as Staff <ArrowRight size={16} />
              </button>
            </form>
          )}

          {activeCard === 'tracking' && (
            <div className="space-y-5 animate-fade-in">
              <form onSubmit={handleSearchAwb} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Airway Bill Number</label>
                  <input 
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. 157-12345672"
                    value={searchAwb}
                    onChange={(e) => {
                      setSearchAwb(e.target.value);
                      setSearchError('');
                    }}
                    className="w-full bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3.5 text-sm text-white placeholder-text-muted outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber/20 transition-all duration-200"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#0b0f19] hover:bg-[#1e293b] border border-[#222f47] text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:border-accent-amber/40 active:scale-[0.98]"
                >
                  <FileSearch size={16} /> Verify AWB Status
                </button>
              </form>

              {searchError && (
                <div className="text-red-400 text-xs flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={13} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Detailed search results card */}
              {searchResult && (
                <div className="bg-[#0b0f19] border border-[#222f47] rounded-2xl p-5 space-y-4 text-xs animate-fade-in">
                  <div className="flex justify-between items-center border-b border-[#222f47] pb-3">
                    <span className="font-bold font-header text-white text-sm">{searchResult.awb_number}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(searchResult.status)}`}>
                      {searchResult.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold mb-0.5">Customer</span>
                      <strong className="text-white font-medium">{searchResult.customer?.company_name || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold mb-0.5">Route</span>
                      <strong className="text-white font-medium">{searchResult.origin_airport} &rarr; {searchResult.destination_airport}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold mb-0.5">Packages</span>
                      <strong className="text-white font-medium">{searchResult.package_count} Pcs</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[9px] uppercase tracking-wider font-bold mb-0.5">Chargeable Wt</span>
                      <strong className="text-white font-medium">{searchResult.chargeable_weight} kg</strong>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#222f47] pt-3">
                    <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">
                      <span>Document Audits</span>
                      <span className="text-accent-blue">{getCompletionPercent(searchResult)}%</span>
                    </div>
                    <div className="w-full bg-[#151d30] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${searchResult.status === 'READY_FOR_HANDOVER' ? 'bg-emerald-500' : 'bg-accent-blue'}`}
                        style={{ width: `${getCompletionPercent(searchResult)}%` }}
                      ></div>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 mt-2">
                      {searchResult.shipment_documents?.map((d) => (
                        <div key={d.id} className="bg-[#151d30] p-2.5 rounded-lg border border-[#222f47]/50 flex flex-col gap-1 hover:border-[#222f47] transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white uppercase text-[9px] tracking-wide">{formatDocType(d.document_type)}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              d.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                              d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                          {d.status === 'REJECTED' && d.rejection_reason && (
                            <p className="text-[9px] text-red-400 bg-red-500/5 p-1.5 rounded border border-red-500/10 leading-tight">
                              Reason: {d.rejection_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- Initial 3-card selector grid ----
  const cardOrder = Object.keys(CARDS);

  const renderCardSelector = (cardId) => {
    const cfg = CARDS[cardId];
    const { Icon } = cfg;
    const staggerIndex = cardOrder.indexOf(cardId);
    return (
      <button
        key={cardId}
        onClick={() => selectCard(cardId)}
        className={`
          group bg-[#151d30] border border-[#222f47] rounded-3xl p-7
          flex flex-col items-center text-center
          ${cfg.borderHover} shadow-xl cursor-pointer select-none
          hover:shadow-2xl hover:-translate-y-2 active:scale-[0.97]
          animate-slide-up
          transition-[transform,box-shadow,border-color] duration-500
        `}
        style={{ animationDelay: `${staggerIndex * 0.12}s` }}
      >
        <div className={`
          w-16 h-16 rounded-2xl ${cfg.bgAccent} border
          flex items-center justify-center mb-5
          transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
        `}>
          <Icon size={30} />
        </div>
        <h2 className="text-lg font-header font-bold mb-2 transition-colors">{cfg.fullLabel}</h2>
        <p className="text-xs text-text-muted leading-relaxed mb-5 max-w-[240px]">{cfg.desc}</p>
        <div className={`
          inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold
          ${cfg.pillBg} border
          transition-all duration-300 group-hover:gap-3
        `}>
          <span>Open</span>
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </button>
    );
  };

  // Build the inactive card list (for the top-right pills)
  const inactiveCards = activeCard
    ? Object.keys(CARDS).filter(k => k !== activeCard)
    : [];

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center p-6 relative overflow-hidden font-body text-white">
      
      {/* Background glowing orbs — animate position when card is active */}
      <div className={`
        absolute w-[500px] h-[500px] bg-accent-blue/5 rounded-full filter blur-[120px] pointer-events-none
        transition-all duration-[1200ms] ease-out
        ${activeCard ? 'top-0 left-0 opacity-60' : 'top-1/4 left-1/4 opacity-100'}
      `} />
      <div className={`
        absolute w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none
        transition-all duration-[1200ms] ease-out
        ${activeCard ? 'bottom-0 right-0 opacity-60' : 'bottom-1/4 right-1/4 opacity-100'}
      `} />

      {/* Top bar with logo + minimized pills */}
      <div className={`
        w-full max-w-6xl flex items-center justify-between z-20 mb-8
        transition-all duration-500
        ${activeCard ? 'pt-4' : 'pt-8 lg:pt-16'}
      `}>
        {/* Logo — always visible */}
        <div className="flex items-center gap-3 select-none">
          <div className={`
            rounded-2xl bg-accent-blue/15 text-accent-blue flex items-center justify-center border border-accent-blue/20
            transition-all duration-500
            ${activeCard ? 'w-10 h-10 shadow-md shadow-accent-blue/10' : 'w-12 h-12 shadow-lg shadow-accent-blue/10'}
          `}>
            <PlaneTakeoff size={activeCard ? 20 : 26} />
          </div>
          <div>
            <h1 className={`font-header font-bold tracking-wide leading-tight transition-all duration-500 ${activeCard ? 'text-lg' : 'text-2xl'}`}>
              ORBEM Solutions
            </h1>
            <p className={`text-accent-blue font-bold uppercase tracking-widest transition-all duration-500 ${activeCard ? 'text-[9px]' : 'text-xs'} mt-0.5`}>
              Control Tower Gateway
            </p>
          </div>
        </div>

        {/* Minimized portal pills — top right, only visible when a card is expanded */}
        <div className={`
          flex items-center gap-2
          transition-all duration-500
          ${activeCard ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}
        `}>
          {inactiveCards.map((cardId, i) => renderMinPill(cardId, i))}

          {/* Back to grid button */}
          <button
            onClick={collapseAll}
            className="
              flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#222f47]
              text-[11px] font-bold text-text-muted
              hover:bg-white/5 hover:text-white hover:border-[#3a4a6b]
              transition-all duration-300 active:scale-95
            "
            title="Show all portals"
          >
            <X size={13} />
            <span className="hidden sm:inline">All Portals</span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className={`
        flex-1 w-full max-w-6xl z-10 flex items-start justify-center
        transition-all duration-500
        ${!activeCard ? 'pt-4 lg:pt-10' : 'pt-2'}
      `}>

        {/* 3-column grid — visible when no card is selected */}
        {!activeCard && (
          <div className={`
            grid grid-cols-1 lg:grid-cols-3 gap-8 w-full
            transition-all duration-500
            ${phase === 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
          `}>
            {Object.keys(CARDS).map(cardId => renderCardSelector(cardId))}
          </div>
        )}

        {/* Expanded card — visible when a card is selected */}
        {activeCard && renderExpandedContent()}

      </div>

      {/* Footer copyright */}
      <div className={`
        text-center text-[10px] text-text-muted z-10 select-none
        transition-all duration-500
        ${activeCard ? 'mt-6 opacity-60' : 'mt-12 opacity-100'}
      `}>
        &copy; {new Date().getFullYear()} ORBEM Solutions Private Limited. All rights reserved.
      </div>
    </div>
  );
}
