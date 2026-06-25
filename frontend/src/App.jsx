import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { PlaneTakeoff, LayoutDashboard, FileText, ShieldAlert, LogOut, Shield, User } from 'lucide-react';
import PortalGateway from './components/PortalGateway';
import Dashboard from './components/Dashboard';
import ShipmentForm from './components/ShipmentForm';
import ShipmentDetail from './components/ShipmentDetail';
import { supabase } from './services/supabase';

// Sidebar + Header Layout wrapper
function Layout({ activePortal, activeUser, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/shipments/new') {
      return 'Airway Bill Entry Portal (Intake)';
    }
    if (path.startsWith('/shipments/edit/')) {
      return 'Edit Cargo Airway Bill';
    }
    if (path.startsWith('/shipments/')) {
      return 'AWB Compliance & Document Audit';
    }
    return activePortal === 'admin' 
      ? 'Admin Control Panel (Master Overrides)' 
      : 'Air Cargo Operations Dashboard';
  };

  const isSupabaseCloud = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL';

  return (
    <div className="flex h-screen bg-[#0b0f19] text-white font-body overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#151d30] border-r border-[#222f47] flex flex-col p-6 flex-shrink-0">
        
        {/* Company Branding */}
        <div className="flex items-center gap-3 mb-8 select-none">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center border border-accent-blue/20">
            <PlaneTakeoff size={22} />
          </div>
          <div>
            <h1 className="font-header font-bold text-base tracking-wide text-white leading-tight">ORBEM Solutions</h1>
            <p className="text-[10px] text-accent-blue font-semibold uppercase tracking-wider mt-0.5">Control Tower</p>
          </div>
        </div>

        {/* User Session card in Sidebar */}
        <div className="bg-[#0b0f19] border border-[#222f47] rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${activePortal === 'admin' ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {activePortal === 'admin' ? <Shield size={18} /> : <User size={18} />}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xs font-bold text-white truncate">{activeUser?.name}</h3>
              <p className="text-[9px] text-text-muted font-medium truncate mt-0.5">{activeUser?.role}</p>
            </div>
          </div>
          
          {activePortal === 'employee' && activeUser && (
            <div className="text-[9px] text-text-muted border-t border-[#222f47]/50 pt-2 space-y-1">
              <p className="truncate"><strong>ID:</strong> {activeUser.id}</p>
              <p className="truncate"><strong>Mob:</strong> {activeUser.phone || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          <Link 
            to="/"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
              location.pathname === '/'
                ? 'bg-accent-blue/10 text-accent-blue border-r-4 border-accent-blue'
                : 'text-text-muted hover:bg-bg-card-hover hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard Registry
          </Link>

          <Link 
            to="/shipments/new"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left ${
              location.pathname === '/shipments/new'
                ? 'bg-accent-blue/10 text-accent-blue border-r-4 border-accent-blue'
                : 'text-text-muted hover:bg-bg-card-hover hover:text-white'
            }`}
          >
            <FileText size={18} />
            Register Shipment
          </Link>
        </nav>

        {/* Logout / Switch Gateway Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-left mt-auto border border-dashed border-red-500/20"
        >
          <LogOut size={18} />
          Gateway Sign Out
        </button>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-[76px] border-b border-[#222f47] flex items-center justify-between px-8 flex-shrink-0 font-body">
          <h2 className="text-lg font-header font-bold text-white tracking-wide">{getHeaderTitle()}</h2>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-text-muted">
                {isSupabaseCloud ? 'Supabase Cloud Connected' : 'Local Sandbox Active'}
              </span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${activePortal === 'admin' ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activePortal === 'admin' ? 'bg-accent-blue' : 'bg-emerald-500'}`}></span>
              {activePortal === 'admin' ? 'Master Access' : 'Operations Portal'}
            </div>
          </div>
        </header>

        {/* Content View Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0b0f19]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  const [activePortal, setActivePortal] = useState(() => sessionStorage.getItem('activePortal') || 'gateway');
  const [activeUser, setActiveUser] = useState(() => {
    const saved = sessionStorage.getItem('activeUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (portal, user) => {
    setActivePortal(portal);
    setActiveUser(user);
    sessionStorage.setItem('activePortal', portal);
    sessionStorage.setItem('activeUser', JSON.stringify(user));
  };

  const handleLogout = async () => {
    if (activePortal === 'employee' && activeUser) {
      try {
        await supabase
          .from('staff_profiles')
          .update({ logged_in: false })
          .eq('id', activeUser.id);
      } catch (err) {
        console.error('Logout state sync failed:', err);
      }
    }
    setActivePortal('gateway');
    setActiveUser(null);
    sessionStorage.removeItem('activePortal');
    sessionStorage.removeItem('activeUser');
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={
        activePortal === 'gateway' 
          ? <PortalGateway onLogin={handleLogin} /> 
          : (
            <Layout activePortal={activePortal} activeUser={activeUser} onLogout={handleLogout}>
              <Dashboard activePortal={activePortal} activeUser={activeUser} />
            </Layout>
          )
      } />
      
      <Route path="/shipments/new" element={
        activePortal === 'gateway'
          ? <Navigate to="/" replace />
          : (
            <Layout activePortal={activePortal} activeUser={activeUser} onLogout={handleLogout}>
              <ShipmentForm activePortal={activePortal} activeUser={activeUser} />
            </Layout>
          )
      } />

      <Route path="/shipments/edit/:id" element={
        activePortal === 'gateway'
          ? <Navigate to="/" replace />
          : (
            <Layout activePortal={activePortal} activeUser={activeUser} onLogout={handleLogout}>
              <ShipmentForm activePortal={activePortal} activeUser={activeUser} />
            </Layout>
          )
      } />

      <Route path="/shipments/:id" element={
        activePortal === 'gateway'
          ? <Navigate to="/" replace />
          : (
            <Layout activePortal={activePortal} activeUser={activeUser} onLogout={handleLogout}>
              <ShipmentDetail activePortal={activePortal} activeUser={activeUser} />
            </Layout>
          )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
