import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Database, PlaneTakeoff, Info, ArrowLeft, Loader2, Save } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function ShipmentForm({ activePortal, activeUser }) {
  const navigate = useNavigate();
  const { id: editShipmentId } = useParams();
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [awb, setAwb] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [customCargoType, setCustomCargoType] = useState('');
  const cargoOptions = ['Pharmaceuticals', 'Electronics', 'Heavy Machinery', 'Perishables', 'General Cargo', 'Chemicals'];
  const [packages, setPackages] = useState('1');
  const [weight, setWeight] = useState('10');
  
  // Dimensions
  const [length, setLength] = useState('10');
  const [width, setWidth] = useState('10');
  const [height, setHeight] = useState('10');
  
  const [priorityFlag, setPriorityFlag] = useState(false);
  const [assignedOwner, setAssignedOwner] = useState('Unassigned');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live client-side weight calculator
  const [liveVolumetric, setLiveVolumetric] = useState(0);
  const [liveChargeable, setLiveChargeable] = useState(0);

  useEffect(() => {
    // 1. Fetch Customers
    supabase.from('customers').select('*').then(({ data }) => {
      if (data) {
        setCustomers(data);
        if (data.length > 0 && !editShipmentId) {
          setSelectedCustomerId(data[0].id);
        }
      }
    });

    // 2. Fetch Staff for assignment dropdown
    supabase.from('staff_profiles').select('name').then(({ data }) => {
      if (data) {
        setStaff(data);
      }
    });

    // 3. Edit Mode Pre-fill
    if (editShipmentId) {
      setLoading(true);
      supabase.from('shipments')
        .select('*')
        .eq('id', editShipmentId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setAwb(data.awb_number);
            setOrigin(data.origin_airport);
            setDestination(data.destination_airport);
            setPickupCity(data.pickup_city || '');
            const isStandard = cargoOptions.includes(data.cargo_type);
            if (isStandard || !data.cargo_type) {
              setCargoType(data.cargo_type || '');
              setCustomCargoType('');
            } else {
              setCargoType('Other');
              setCustomCargoType(data.cargo_type);
            }
            setPackages(data.package_count.toString());
            setWeight(data.actual_weight.toString());
            setLength(data.length_cm.toString());
            setWidth(data.width_cm.toString());
            setHeight(data.height_cm.toString());
            setSelectedCustomerId(data.customer_id || '');
            setPriorityFlag(data.priority_flag || false);
            setAssignedOwner(data.assigned_owner || 'Unassigned');
            setNotes(data.notes || '');
            setPaymentStatus(data.payment_status || 'UNPAID');
          }
          setLoading(false);
        });
    }
  }, [editShipmentId]);

  // Recalculate live weight preview whenever dimension inputs or actual weight changes
  useEffect(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const actW = parseFloat(weight) || 0;

    const volW = (l * w * h) / 6000;
    setLiveVolumetric(parseFloat(volW.toFixed(2)));
    setLiveChargeable(parseFloat(Math.max(actW, volW).toFixed(2)));
  }, [length, width, height, weight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!awb || !origin || !destination || !length || !width || !height || !weight) {
      setError('Please fill out all required fields.');
      return;
    }

    const packageCount = parseInt(packages);
    const actualWeight = parseFloat(weight);
    const lengthCm = parseFloat(length);
    const widthCm = parseFloat(width);
    const heightCm = parseFloat(height);

    if (packageCount <= 0 || isNaN(packageCount)) {
      setError('Package count must be greater than 0.');
      return;
    }
    if (actualWeight <= 0 || isNaN(actualWeight)) {
      setError('Gross actual weight must be greater than 0 kg.');
      return;
    }
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0 || isNaN(lengthCm) || isNaN(widthCm) || isNaN(heightCm)) {
      setError('All package dimensions (L/W/H) must be greater than 0 cm.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customer_id: selectedCustomerId || null,
        awb_number: awb.trim(),
        origin_airport: origin.trim().toUpperCase(),
        destination_airport: destination.trim().toUpperCase(),
        pickup_city: pickupCity.trim() || null,
        cargo_type: (cargoType === 'Other' ? customCargoType.trim() : cargoType.trim()) || null,
        package_count: packageCount,
        actual_weight: actualWeight,
        length_cm: lengthCm,
        width_cm: widthCm,
        height_cm: heightCm,
        priority_flag: priorityFlag,
        payment_status: paymentStatus,
        assigned_owner: assignedOwner,
        notes: notes.trim() || null
      };

      if (editShipmentId) {
        // --- EDIT MODE ---
        // Fetch current status to check transition
        const { data: current } = await supabase.from('shipments').select('status').eq('id', editShipmentId).single();

        const { error: updateErr } = await supabase
          .from('shipments')
          .update(payload)
          .eq('id', editShipmentId);

        if (updateErr) throw updateErr;

        // Log edit event in status history
        await supabase.from('status_history').insert({
          shipment_id: editShipmentId,
          previous_status: current?.status || null,
          new_status: current?.status || null,
          action_taken: 'Consignment Metadata Edited',
          action_by: activeUser?.name || 'Administrator',
          notes: `Updated package dimensions to ${lengthCm}x${widthCm}x${heightCm} cm. Actual weight: ${actualWeight} kg.`
        });

      } else {
        // --- NEW INTAKE MODE ---
        // 1. Check if AWB is unique
        const { data: existing } = await supabase.from('shipments').select('id').eq('awb_number', awb.trim()).single();
        if (existing) {
          setError(`AWB Number ${awb} already exists in database.`);
          setLoading(false);
          return;
        }

        // 2. Insert new shipment (trigger calculate_weights + init_documents will run)
        const { error: insertErr } = await supabase
          .from('shipments')
          .insert({
            ...payload,
            status: 'PENDING_DOCUMENTS'
          });

        if (insertErr) throw insertErr;
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to save consignment records to database. Check connection or unique constraints.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-white transition-colors duration-150"
      >
        <ArrowLeft size={16} /> Cancel and Back
      </button>

      <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
        <h2 className="text-xl font-header font-bold flex items-center gap-2 mb-6 border-b border-[#222f47] pb-4">
          <PlaneTakeoff className="text-accent-blue" size={22} />
          {editShipmentId ? 'Edit Consignment Details' : 'Airway Bill Intake Portal (New Cargo)'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 mb-6 flex items-center gap-2">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Inputs Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Customer + AWB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Linked Customer Profile</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    disabled={editShipmentId}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200 disabled:opacity-50"
                  >
                    <option value="">Unlinked Guest Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Airway Bill Number *</label>
                  <input 
                    type="text"
                    placeholder="e.g. 157-12345672"
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                    disabled={editShipmentId}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white placeholder-text-muted outline-none focus:border-accent-blue transition-colors duration-200 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Route airports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Origin Airport Code (IATA) *</label>
                  <input 
                    type="text"
                    maxLength={10}
                    placeholder="HYD"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white placeholder-text-muted outline-none focus:border-accent-blue transition-colors duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Destination Airport Code (IATA) *</label>
                  <input 
                    type="text"
                    maxLength={10}
                    placeholder="DXB"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white placeholder-text-muted outline-none focus:border-accent-blue transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Pickup City + Cargo Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pickup City</label>
                  <input 
                    type="text"
                    placeholder="Hyderabad"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white placeholder-[#4b5563] outline-none focus:border-accent-blue transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Cargo Content Type</label>
                  <select
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
                  >
                    <option value="">Select Cargo Type...</option>
                    {cargoOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Other">Other / Custom Type</option>
                  </select>

                  {cargoType === 'Other' && (
                    <input 
                      type="text"
                      placeholder="Specify custom cargo type (e.g. Exotic Flowers)"
                      value={customCargoType}
                      onChange={(e) => setCustomCargoType(e.target.value)}
                      className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white placeholder-[#4b5563] outline-none focus:border-accent-blue transition-colors duration-200 mt-2 animate-fade-in"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Package Count *</label>
                  <input 
                    type="number"
                    min={1}
                    value={packages}
                    onChange={(e) => setPackages(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Actual Gross Weight (kg) *</label>
                  <input 
                    type="number"
                    step="any"
                    min={0.01}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-sm w-full text-white outline-none focus:border-accent-blue transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Package Dimensions (L / W / H) */}
              <div className="bg-[#0b0f19] border border-[#222f47] p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent-blue flex items-center gap-1.5 border-b border-[#222f47]/50 pb-2">
                  Package Volumetric Dimensions (Mandatory)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Length (cm) *</span>
                    <input 
                      type="number" 
                      step="any"
                      min={0.1}
                      value={length} 
                      onChange={(e) => setLength(e.target.value)}
                      className="bg-[#151d30] border border-[#222f47] rounded-lg px-3 py-2 text-sm w-full text-white outline-none focus:border-accent-blue"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Width (cm) *</span>
                    <input 
                      type="number" 
                      step="any"
                      min={0.1}
                      value={width} 
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-[#151d30] border border-[#222f47] rounded-lg px-3 py-2 text-sm w-full text-white outline-none focus:border-accent-blue"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Height (cm) *</span>
                    <input 
                      type="number" 
                      step="any"
                      min={0.1}
                      value={height} 
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-[#151d30] border border-[#222f47] rounded-lg px-3 py-2 text-sm w-full text-white outline-none focus:border-accent-blue"
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Information & Cosmetic Preview Panel */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Live Volumetric Calculation Preview Panel */}
              <div className="bg-[#151d30] border border-accent-blue/20 rounded-2xl p-5 space-y-4 hover:border-accent-blue/40 transition-all duration-300 shadow-lg shadow-accent-blue/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent-blue flex items-center gap-1.5 border-b border-[#222f47]/50 pb-2">
                  <Database size={15} /> Database Weight Formula Preview
                </h4>
                
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-[#0b0f19] p-3 rounded-xl border border-[#222f47]">
                    <span className="text-text-muted">Gross Weight:</span>
                    <strong className="text-white text-sm">{weight || 0} kg</strong>
                  </div>
                  
                  <div className="flex justify-between items-center bg-[#0b0f19] p-3 rounded-xl border border-[#222f47]">
                    <div>
                      <span className="text-text-muted block">Volumetric Weight:</span>
                      <span className="text-[9px] text-text-muted mt-0.5">(L * W * H) / 6000</span>
                    </div>
                    <strong className="text-white text-sm">{liveVolumetric} kg</strong>
                  </div>

                  <div className="flex justify-between items-center bg-[#0b0f19] p-3.5 rounded-xl border border-accent-blue/30 bg-accent-blue/5">
                    <div>
                      <span className="text-accent-blue font-bold block">Chargeable Weight:</span>
                      <span className="text-[9px] text-text-muted">GREATEST(Gross, Volumetric)</span>
                    </div>
                    <strong className="text-emerald-400 text-lg">{liveChargeable} kg</strong>
                  </div>
                </div>
                <div className="p-3 bg-[#0b0f19] rounded-xl border border-[#222f47] text-[10px] text-text-muted flex gap-2">
                  <Info size={14} className="text-accent-blue flex-shrink-0 mt-0.5" />
                  <span>The final volumetric weight is automatically calculated and locked in Postgres on submission.</span>
                </div>
              </div>

              {/* Assignment & Notes */}
              <div className="bg-[#151d30] border border-[#222f47] p-5 rounded-2xl space-y-4">
                
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Priority Cargo Flag</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={priorityFlag}
                      onChange={(e) => setPriorityFlag(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#0b0f19] rounded-full peer peer-focus:ring-2 peer-focus:ring-accent-blue peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

                <div className="space-y-2 border-t border-[#222f47]/50 pt-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted block">Intake Payment Status *</label>
                  <div className="flex gap-4 mt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="payment_status" 
                        value="PAID"
                        checked={paymentStatus === 'PAID'}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-4 h-4 text-accent-blue bg-[#0b0f19] border-[#222f47] focus:ring-accent-blue"
                      />
                      <span className="text-xs font-semibold text-white">Paid</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="payment_status" 
                        value="UNPAID"
                        checked={paymentStatus === 'UNPAID'}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-4 h-4 text-accent-blue bg-[#0b0f19] border-[#222f47] focus:ring-accent-blue"
                      />
                      <span className="text-xs font-semibold text-white">Unpaid</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#222f47]/50 pt-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Assigned Controller Owner</label>
                  <select
                    value={assignedOwner}
                    onChange={(e) => setAssignedOwner(e.target.value)}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-2 text-sm w-full text-white outline-none focus:border-accent-blue"
                  >
                    <option value="Unassigned">Unassigned (Queue)</option>
                    {staff.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 border-t border-[#222f47]/50 pt-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Consignment Notes</label>
                  <textarea 
                    placeholder="Enter special handling instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="bg-[#0b0f19] border border-[#222f47] rounded-xl px-4 py-3 text-xs w-full text-white placeholder-text-muted outline-none focus:border-accent-blue resize-none"
                  ></textarea>
                </div>
              </div>

            </div>

          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 border-t border-[#222f47] pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-transparent hover:bg-white/[0.02] border border-[#222f47] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent-blue hover:bg-accent-blue-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors duration-150 disabled:opacity-50 shadow-lg shadow-accent-blue/15"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : editShipmentId ? (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              ) : (
                'Submit Intake Metadata'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
