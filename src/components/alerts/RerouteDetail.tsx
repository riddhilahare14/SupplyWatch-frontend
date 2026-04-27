import React, { useState } from 'react';
import { useSupplyStore } from '../../store/useSupplyStore';
import { apiClient, isMockMode } from '../../api/client';
import { format, parseISO } from 'date-fns';
import { Check, X, ArrowRight, Shield, DollarSign, Ruler, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface RerouteDetailProps {
  rerouteId: string;
}

const RerouteDetail: React.FC<RerouteDetailProps> = ({ rerouteId }) => {
  const { pendingReroutes, decideReroute, shipments } = useSupplyStore();
  const reroute = pendingReroutes.find(r => r.id === rerouteId);
  const shipment = shipments.find(s => s.id === reroute?.shipment_id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!reroute) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (!isMockMode) {
        await apiClient.post(`/reroutes/${reroute.id}/approve`);
      }
      decideReroute(reroute.id, 'approved');
    } catch (e) {
      console.error('Failed to approve reroute', e);
      // In a real app, revert state or show toast error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      setShowRejectInput(true);
      return;
    }
    setIsSubmitting(true);
    try {
      if (!isMockMode) {
        await apiClient.post(`/reroutes/${reroute.id}/reject`, { reason: rejectReason });
      }
      decideReroute(reroute.id, 'rejected');
    } catch (e) {
      console.error('Failed to reject reroute', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-white">Reroute Proposal</h2>
            <span className={clsx("text-xs font-bold px-3 py-1 rounded-full uppercase border", 
              reroute.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
            )}>
              {reroute.status}
            </span>
          </div>
          <p className="text-slate-400 font-medium">Shipment ID: <span className="text-blue-400 font-mono">{reroute.shipment_id}</span> • {shipment?.carrier_name}</p>
        </div>

        <div className="flex gap-4">
          {reroute.status === 'pending' && (
            <>
              <button 
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
              >
                <Check size={20} />
                Approve Reroute
              </button>
              <button 
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold transition-all border border-slate-700 disabled:opacity-50"
              >
                <X size={20} />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {showRejectInput && reroute.status === 'pending' && (
        <div className="mb-8 p-4 bg-slate-900 border border-slate-700 rounded-xl animate-in slide-in-from-top-4">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rejection Reason</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Higher priority for cost over time..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            <button 
              onClick={handleReject}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Assessment</h3>
          <div className="flex items-end gap-2 mb-6">
            <span className="text-5xl font-mono font-bold text-red-400">{(reroute.sla_recovery_prob ?? 0 * 100).toFixed(0)}%</span>
            <span className="text-sm text-slate-500 mb-1 font-medium">SLA RECOVERY PROBABILITY</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1 bg-blue-500/5">
            "{reroute.reason}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard icon={<DollarSign size={20} />} label="Cost Delta" value={`+${reroute.cost_delta_pct}%`} color="text-red-400" />
          <MetricCard icon={<Ruler size={20} />} label="Extra Distance" value={`+${reroute.detour_pct}%`} color="text-amber-400" />
          <MetricCard icon={<Clock size={20} />} label="New ETA" value={reroute.new_eta ? format(parseISO(reroute.new_eta), 'HH:mm') : 'N/A'} />
          <MetricCard icon={<Shield size={20} />} label="Security" value="High" color="text-green-400" />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden p-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Route Comparison</h3>
        <div className="flex items-center gap-12 justify-center">
          <div className="flex flex-col items-center gap-3">
             <div className="w-48 h-32 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4a90e2_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="w-32 h-1 bg-slate-600 rounded-full" />
             </div>
             <span className="text-xs font-bold text-slate-500 uppercase">Original Path</span>
          </div>
          <ArrowRight className="text-slate-700" size={32} />
          <div className="flex flex-col items-center gap-3">
             <div className="w-48 h-32 bg-slate-800 rounded-xl border border-blue-500/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4a90e2_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="w-32 h-1 bg-blue-500 rounded-full rotate-[-10deg]" />
             </div>
             <span className="text-xs font-bold text-blue-400 uppercase">Proposed Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({ icon, label, value, color = "text-slate-200" }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
    <div className="flex items-center gap-2 mb-2 text-slate-500">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className={clsx("text-xl font-mono font-bold", color)}>{value}</span>
  </div>
);

export default RerouteDetail;
