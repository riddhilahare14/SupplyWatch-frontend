import React from 'react';
import { useSupplyStore } from '../../store/useSupplyStore';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Shipment } from '../../types';

interface ShipmentsTableProps {
  filters: {
    search: string;
    status: string;
    risk: string;
    city: string;
  };
}

const ShipmentsTable: React.FC<ShipmentsTableProps> = ({ filters }) => {
  const shipments = useSupplyStore(state => state.shipments);
  const liveRisks = useSupplyStore(state => state.riskScores);

  const filteredShipments = shipments.filter(s => {
    const risk = liveRisks[s.id]?.risk_score ?? s.risk_score;
    const matchesSearch = s.id.toLowerCase().includes(filters.search.toLowerCase()) || 
                         s.carrier_name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'All' || s.status === filters.status.toLowerCase();
    const matchesRisk = filters.risk === 'All' || 
                        (filters.risk === 'High' && risk > 0.7) ||
                        (filters.risk === 'Medium' && risk > 0.4 && risk <= 0.7) ||
                        (filters.risk === 'Low' && risk <= 0.4);
    const matchesCity = filters.city === 'All' || s.origin_hub?.city === filters.city || s.dest_hub?.city === filters.city;

    return matchesSearch && matchesStatus && matchesRisk && matchesCity;
  }).sort((a, b) => {
    const riskA = liveRisks[a.id]?.risk_score ?? a.risk_score;
    const riskB = liveRisks[b.id]?.risk_score ?? b.risk_score;
    return riskB - riskA;
  });

  return (
    <div className="overflow-auto flex-1 custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-slate-800/90 backdrop-blur z-10 border-b border-slate-700">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipment ID</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carrier</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ETA</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</th>
            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {filteredShipments.map((s) => (
            <ShipmentRow key={s.id} shipment={s} risk={liveRisks[s.id]?.risk_score ?? s.risk_score} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ShipmentRow: React.FC<{ shipment: Shipment; risk: number }> = ({ shipment: s, risk }) => {
  const isLate = new Date(s.current_eta) > new Date(s.sla_deadline);
  
  const getRiskColor = (r: number) => {
    if (r > 0.7) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (r > 0.4) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-green-400 bg-green-400/10 border-green-400/20';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit': return <Clock size={14} className="text-blue-400" />;
      case 'delivered': return <CheckCircle size={14} className="text-green-400" />;
      case 'delayed': return <AlertCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <tr className="hover:bg-slate-800/30 transition-colors group cursor-pointer">
      <td className="px-6 py-4">
        <span className="text-sm font-mono font-bold text-slate-200">{s.id}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-300">{s.origin_hub?.city} → {s.dest_hub?.city}</span>
          <span className="text-[10px] text-slate-500">{s.origin_hub?.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-400">
        {s.carrier_name}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className={`text-sm font-mono font-bold ${isLate ? 'text-red-400' : 'text-slate-300'}`}>
            {format(parseISO(s.current_eta), 'HH:mm')}
          </span>
          <span className="text-[10px] text-slate-500">SLA: {format(parseISO(s.sla_deadline), 'HH:mm')}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(s.status)}
          <span className="text-xs capitalize text-slate-300">{s.status.replace('_', ' ')}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-bold ${getRiskColor(risk)}`}>
          {risk > 0.7 && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          {(risk * 100).toFixed(0)}% {risk > 0.7 ? 'HIGH' : risk > 0.4 ? 'MED' : 'LOW'}
        </div>
      </td>
      <td className="px-6 py-4">
        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
          <ArrowUpRight size={18} />
        </button>
      </td>
    </tr>
  );
};

export default ShipmentsTable;
