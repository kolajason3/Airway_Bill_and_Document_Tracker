import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, CheckCircle2, AlertTriangle, FileText, Check, Clock, Upload, Trash2, Eye, ExternalLink, Ban, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function ShipmentDetail({ activePortal, activeUser }) {
  const navigate = useNavigate();
  const { id: shipmentId } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // Reject modal state
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = activePortal === 'admin';
  const isAssigned = shipment 
    ? (!shipment.assigned_owner || shipment.assigned_owner === 'Unassigned' || shipment.assigned_owner === activeUser?.name)
    : false;
  const canModify = isAdmin || isAssigned;

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch shipment details with customer, docs, history, and notifications
      const { data, error: shipmentErr } = await supabase
        .from('shipments')
        .select('*, customer:customers(*), shipment_documents(*), status_history(*), notification_log(*)')
        .eq('id', shipmentId)
        .single();

      if (shipmentErr) throw shipmentErr;

      // Pre-generate signed URLs for documents that have a file_reference
      if (data && data.shipment_documents) {
        const docsWithSignedUrls = await Promise.all(data.shipment_documents.map(async (doc) => {
          if (doc.file_reference) {
            let path = doc.file_reference;
            if (path.includes('shipment-documents/')) {
              path = path.split('shipment-documents/')[1];
            } else if (path.includes('document-vault/')) {
              path = path.split('document-vault/')[1];
            }
            try {
              const { data: signedData, error: signedErr } = await supabase.storage
                .from('shipment-documents')
                .createSignedUrl(path, 60); // 60 seconds expiration
              
              if (!signedErr && signedData) {
                return { ...doc, signedViewUrl: signedData.signedUrl };
              }
            } catch (err) {
              console.error('Error generating signed URL:', err);
            }
          }
          return doc;
        }));
        data.shipment_documents = docsWithSignedUrls;
      }

      setShipment(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load shipment details, documents, or logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentData();
  }, [shipmentId]);

  const handleFileUpload = async (docId, file, docType) => {
    if (!canModify) {
      setError('Access Denied: You do not have permission to upload files for this shipment.');
      return;
    }
    if (!file || !shipment) return;
    
    try {
      setError('');
      setActionSuccess('');
      setUploadingDocId(docId);

      const fileName = `${shipment.id}/${docType}.pdf`;

      // Upload file to Supabase Storage bucket
      const { error: uploadErr } = await supabase.storage
        .from('shipment-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const publicUrl = supabase.storage.from('shipment-documents').getPublicUrl(fileName).data.publicUrl;

      // Update document table
      const { error: dbErr } = await supabase
        .from('shipment_documents')
        .update({
          file_reference: publicUrl,
          file_name: file.name,
          status: 'PENDING',
          rejection_reason: null
        })
        .eq('id', docId);

      if (dbErr) throw dbErr;

      // Log in history
      await supabase.from('status_history').insert({
        shipment_id: shipmentId,
        previous_status: shipment.status,
        new_status: shipment.status, // will auto recalc in next query anyway
        action_taken: `Uploaded ${formatDocLabel(docType)}`,
        action_by: activeUser?.name || 'Operations Agent',
        notes: `File successfully saved to vault. Filename: ${file.name}`
      });

      setActionSuccess(`${formatDocLabel(docType)} uploaded successfully.`);
      await fetchShipmentData();

    } catch (err) {
      console.error(err);
      setError('File upload failed. Ensure the storage bucket exists.');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleDeleteFile = async (docId, docType) => {
    if (!canModify) {
      setError('Access Denied: You do not have permission to delete files for this shipment.');
      return;
    }
    if (!window.confirm(`Are you sure you want to clear the uploaded file for ${formatDocLabel(docType)}?`)) {
      return;
    }

    try {
      setError('');
      setActionSuccess('');

      const { error: dbErr } = await supabase
        .from('shipment_documents')
        .update({
          file_reference: null,
          file_name: null,
          status: 'PENDING',
          rejection_reason: null
        })
        .eq('id', docId);

      if (dbErr) throw dbErr;

      // Log history
      await supabase.from('status_history').insert({
        shipment_id: shipmentId,
        previous_status: shipment.status,
        new_status: shipment.status,
        action_taken: `Cleared ${formatDocLabel(docType)}`,
        action_by: activeUser?.name || 'Operations Agent',
        notes: 'User deleted the file reference.'
      });

      setActionSuccess(`Cleared file for ${formatDocLabel(docType)}.`);
      await fetchShipmentData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete document file reference.');
    }
  };

  const handleApproveDoc = async (docId, docType) => {
    if (!canModify) {
      setError('Access Denied: You do not have permission to approve documents.');
      return;
    }
    try {
      setError('');
      setActionSuccess('');

      const { error: dbErr } = await supabase
        .from('shipment_documents')
        .update({
          status: 'APPROVED',
          rejection_reason: null
        })
        .eq('id', docId);

      if (dbErr) throw dbErr;

      // Log history
      await supabase.from('status_history').insert({
        shipment_id: shipmentId,
        previous_status: shipment.status,
        new_status: shipment.status,
        action_taken: `Approved ${formatDocLabel(docType)}`,
        action_by: activeUser?.name || 'Compliance Officer',
        notes: 'Document passed requirements audit.'
      });

      setActionSuccess(`Approved ${formatDocLabel(docType)}.`);
      await fetchShipmentData();
    } catch (err) {
      console.error(err);
      setError('Failed to approve document.');
    }
  };

  const handleRejectDocSubmit = async (e) => {
    e.preventDefault();
    if (!canModify) {
      setError('Access Denied: You do not have permission to reject documents.');
      return;
    }
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }

    try {
      setError('');
      setActionSuccess('');

      const doc = shipment.shipment_documents.find(d => d.id === rejectingDocId);
      const docType = doc ? doc.document_type : 'Document';

      const { error: dbErr } = await supabase
        .from('shipment_documents')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', rejectingDocId);

      if (dbErr) throw dbErr;

      // Log history
      await supabase.from('status_history').insert({
        shipment_id: shipmentId,
        previous_status: shipment.status,
        new_status: 'ON_HOLD', // trigger forces this
        action_taken: `Rejected ${formatDocLabel(docType)}`,
        action_by: activeUser?.name || 'Compliance Officer',
        notes: `Rejected with reason: ${rejectionReason.trim()}`
      });

      setActionSuccess(`Rejected ${formatDocLabel(docType)} and placed shipment ON_HOLD.`);
      setRejectingDocId(null);
      setRejectionReason('');
      await fetchShipmentData();
    } catch (err) {
      console.error(err);
      setError('Failed to reject document. Verify constraints.');
    }
  };

  const handleTerminalStateUpdate = async (targetStatus) => {
    if (!canModify) {
      setError('Access Denied: You do not have permission to transition this shipment status.');
      return;
    }
    if (!window.confirm(`Are you sure you want to transition this shipment to terminal state: ${targetStatus}?`)) {
      return;
    }

    try {
      setError('');
      setActionSuccess('');

      const { error: dbErr } = await supabase
        .from('shipments')
        .update({ status: targetStatus })
        .eq('id', shipmentId);

      if (dbErr) throw dbErr;

      // Manual insert of status log since triggers bypass terminal transitions
      await supabase.from('status_history').insert({
        shipment_id: shipmentId,
        previous_status: shipment.status,
        new_status: targetStatus,
        action_taken: targetStatus === 'COMPLETED' ? 'SHIPMENT_COMPLETED' : 'SHIPMENT_CANCELLED',
        action_by: activeUser?.name || 'Operations Director',
        notes: targetStatus === 'COMPLETED' 
          ? 'Consignment completed all review stages, and cargo was successfully loaded onto flights.' 
          : 'Shipment was manually cancelled by operations.'
      });

      setActionSuccess(`Shipment status manually set to "${targetStatus}".`);
      await fetchShipmentData();
    } catch (err) {
      console.error(err);
      setError(`Failed to set status to ${targetStatus}.`);
    }
  };



  const formatDocLabel = (type) => {
    switch (type) {
      case 'AWB_NUMBER': return 'Airway Bill Copy';
      case 'COMMERCIAL_INVOICE': return 'Commercial Invoice';
      case 'PACKING_LIST': return 'Packing List';
      case 'ID_PROOF': return 'ID Proof';
      case 'CARGO_DECLARATION': return 'Cargo Declaration';
      default: return type.replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-3"></div>
        Loading compliance records...
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-bg-card border border-[#222f47] p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-header font-bold text-white">Consignment Not Found</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            {error || "The airway bill or shipment profile you are looking for does not exist, or you lack the permission to view it."}
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-[#151d30] border border-[#222f47] hover:bg-[#222f47] text-white py-3 rounded-xl text-xs font-bold transition-all duration-150"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  if (!shipment) return null;

  const totalDocs = shipment.shipment_documents || [];
  const submittedDocsCount = totalDocs.filter(d => d.file_reference !== null && d.file_reference !== '').length;
  const docProgress = Math.round((submittedDocsCount / 5) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header Back & Terminal Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted hover:text-white transition-colors duration-150"
        >
          <ArrowLeft size={16} /> Back to Registry
        </button>

        {activePortal !== 'exporter' && canModify && shipment.status !== 'COMPLETED' && shipment.status !== 'CANCELLED' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleTerminalStateUpdate('COMPLETED')}
              className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150"
            >
              Mark Completed
            </button>
            <button
              onClick={() => handleTerminalStateUpdate('CANCELLED')}
              className="bg-transparent hover:bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150"
            >
              Cancel Shipment
            </button>
          </div>
        )}
      </div>

      {/* Warning/Alert Banner if ON_HOLD */}
      {shipment.status === 'ON_HOLD' && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
          <ShieldAlert className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-red-400 text-sm">Cargo Custody Hold Triggered</h4>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              This shipment was placed on hold due to rejected document verification audits. Please review the checklist on the right, correct the errors, and submit fresh files.
            </p>
          </div>
        </div>
      )}

      {/* Security Read-Only Warning Banner */}
      {!canModify && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-amber-500 text-sm">Security Policy: Read-Only Access</h4>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              This consignment is assigned to controller <strong className="text-white">{shipment.assigned_owner || 'another operator'}</strong>. Since you are not the assigned owner or an administrator, your access is restricted to read-only.
            </p>
          </div>
        </div>
      )}

      {/* Detail Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Shipment & Customer info */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Shipment Parameters */}
          <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
            <h2 className="text-xs font-header font-bold text-text-muted flex items-center gap-2 mb-4 border-b border-[#222f47] pb-3 uppercase tracking-wider">
              Consignment Parameters
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">AWB Number</span>
                <span className="font-header font-bold text-xl text-white tracking-wide">{shipment.awb_number}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Client Email</span>
                  <span className="text-white font-medium break-all">{shipment.client_email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Customer Company</span>
                  <span className="text-white font-medium">{shipment.customer?.company_name || 'Walk-in Exporter'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Origin airport</span>
                  <strong className="text-white uppercase font-bold text-sm">{shipment.origin_airport}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Destination airport</span>
                  <strong className="text-white uppercase font-bold text-sm">{shipment.destination_airport}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Pickup City</span>
                  <span className="text-white font-medium">{shipment.pickup_city || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Cargo Content</span>
                  <span className="text-white font-medium">{shipment.cargo_type || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Gross Weight</span>
                  <span className="text-white font-medium">{shipment.actual_weight} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Volumetric Weight</span>
                  <span className="text-white font-medium">{shipment.volumetric_weight} kg</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Chargeable weight</span>
                  <strong className="text-emerald-400 font-bold text-base">{shipment.chargeable_weight} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Owner assigned</span>
                  <span className="text-accent-blue font-semibold">{shipment.assigned_owner || 'Queue'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#222f47] pt-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1.5">Cargo Status Badge</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    shipment.status === 'READY_FOR_HANDOVER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    shipment.status === 'ON_HOLD' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    shipment.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    shipment.status === 'CANCELLED' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1.5">Payment Status</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    shipment.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                  }`}>
                    {shipment.payment_status || 'UNPAID'}
                  </span>
                </div>
              </div>
            </div>
          </div>



        </div>

        {/* Right Column: Document checklist & Timeline logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Document Checklist Repository */}
          <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
            <h2 className="text-xs font-header font-bold text-text-muted flex items-center gap-2 mb-4 border-b border-[#222f47] pb-3 uppercase tracking-wider">
              Document Checklist Repository
            </h2>

            {/* Checklist Progress */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-text-muted">Compliance Audits Rate</span>
                <span className="font-bold text-accent-blue">{docProgress}% Complete</span>
              </div>
              <div className="w-full bg-[#0b0f19] h-2 rounded-full overflow-hidden border border-[#222f47]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${docProgress === 100 ? 'bg-emerald-500' : 'bg-accent-blue'}`}
                  style={{ width: `${docProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Rejection Form Box inline */}
            {rejectingDocId && (
              <form onSubmit={handleRejectDocSubmit} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl mb-6 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Reject Document Audit Notice
                </h4>
                <textarea
                  placeholder="Explain why this document was rejected (Required)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0b0f19] border border-red-500/20 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
                  required
                ></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">
                    Log Rejection
                  </button>
                  <button type="button" onClick={() => setRejectingDocId(null)} className="bg-transparent hover:bg-white/5 border border-[#222f47] px-3 py-1.5 rounded-lg text-[10px] font-bold text-text-muted">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Documents Slots */}
            <div className="space-y-4">
              {totalDocs.map((doc) => {
                const isUploaded = doc.file_reference !== null && doc.file_reference !== '';
                return (
                  <div 
                    key={doc.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl gap-4 ${
                      doc.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-500/5' :
                      doc.status === 'REJECTED' ? 'border-red-500/20 bg-red-500/5' :
                      'border-[#222f47] bg-[#0b0f19]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-[#151d30] text-text-muted'
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          {formatDocLabel(doc.document_type)}
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                            doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {doc.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-text-muted mt-0.5 leading-normal">
                          {isUploaded ? 'File copy uploaded.' : 'Recheck pending upload.'}
                          {doc.status === 'REJECTED' && doc.rejection_reason && (
                            <span className="block text-red-400 font-medium mt-1 font-mono text-[9px]">Reason: {doc.rejection_reason}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {isUploaded ? (
                        <>
                          <a 
                            href={doc.signedViewUrl || doc.file_reference} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#151d30] border border-[#222f47] hover:bg-[#222f47] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={12} /> View
                          </a>

                          {activePortal !== 'exporter' && canModify && (
                            <>
                              {doc.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleApproveDoc(doc.id, doc.document_type)}
                                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                >
                                  Approve
                                </button>
                              )}
                              {doc.status !== 'REJECTED' && (
                                <button
                                  onClick={() => {
                                    setRejectingDocId(doc.id);
                                    setRejectionReason('');
                                  }}
                                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {activePortal !== 'exporter' && canModify ? (
                            <div className="relative">
                              <input 
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                disabled={uploadingDocId !== null}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(doc.id, e.target.files[0], doc.document_type);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <button
                                disabled={uploadingDocId !== null}
                                className="bg-accent-blue hover:bg-accent-blue-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                {uploadingDocId === doc.id ? (
                                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : (
                                  <Upload size={12} />
                                )}
                                Upload
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider px-2.5 py-1 bg-white/5 rounded-md border border-white/10">
                              Locked
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Email Notifications Panel */}
          <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
            <h2 className="text-xs font-header font-bold text-text-muted flex items-center gap-2 mb-4 border-b border-[#222f47] pb-3 uppercase tracking-wider">
              <Mail className="text-accent-blue" size={14} /> Email Dispatch Trail
            </h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {!shipment.notification_log || shipment.notification_log.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-4">No email alerts sent yet.</div>
              ) : (
                shipment.notification_log
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((log) => (
                    <div key={log.id} className="bg-[#0b0f19] border border-[#222f47] p-3 rounded-xl text-xs space-y-1.5 animate-fade-in">
                      <div className="flex justify-between items-center text-[8px] font-bold text-text-muted uppercase tracking-wider">
                        <span>Channel: {log.channel}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-white font-medium text-[11px] leading-tight">{log.subject}</p>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold flex-shrink-0 uppercase ${
                          log.send_status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.send_status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                          log.send_status === 'SKIPPED_NO_EMAIL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {log.send_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted">Recipient: <strong className="text-white font-medium">{log.recipient_email || 'N/A'}</strong></p>
                      {log.error_message && (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-[9px] text-red-400 font-mono break-all leading-relaxed">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-bg-card border border-[#222f47] rounded-2xl p-6">
            <h2 className="text-xs font-header font-bold text-text-muted flex items-center gap-2 mb-6 border-b border-[#222f47] pb-3 uppercase tracking-wider">
              AWB Compliance Audit Trail
            </h2>

            <div className="relative pl-6 border-l border-[#222f47] space-y-6">
              {shipment.status_history?.length === 0 ? (
                <div className="text-xs text-text-muted text-center py-4">No audit events generated.</div>
              ) : (
                shipment.status_history?.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map((log) => (
                  <div key={log.id} className="relative animate-fade-in">
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-[#151d30] ${
                      log.action_taken.includes('APPROVED') || log.action_taken.includes('COMPLETED') ? 'bg-emerald-500' :
                      log.action_taken.includes('Uploaded') ? 'bg-accent-blue' :
                      log.action_taken.includes('REJECTED') || log.action_taken.includes('ON_HOLD') ? 'bg-red-500' : 'bg-amber-500'
                    }`}></span>

                    <div className="bg-[#0b0f19] border border-[#222f47] rounded-xl p-3.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[9px] text-text-muted font-bold tracking-wider uppercase">
                        <span>{log.action_taken}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-white text-xs mt-1">Performed by: <strong className="text-emerald-400">{log.action_by}</strong></h4>
                      {log.notes && <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{log.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
