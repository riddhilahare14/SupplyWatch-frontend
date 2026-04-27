import React, { useState } from 'react';
import { useSupplyStore } from '../store/useSupplyStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isMockMode } from '../api/client';
import { generateMockShipments } from '../mocks/mockData';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, AlertCircle, CheckCircle, Clock, Search, X } from 'lucide-react';
import type { Shipment } from '../types';

const getRiskColor = (r: number) => r > 0.7 ? '#ef4444' : r > 0.4 ? '#f59e0b' : '#22c55e';
const getRiskLabel = (r: number) => r > 0.7 ? 'HIGH' : r > 0.4 ? 'MED' : 'LOW';

const ShipmentsPage: React.FC = () => {
  const { shipments, setShipments, riskScores } = useSupplyStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [risk, setRisk] = useState('All');
  const [city, setCity] = useState('All');

  useQuery({
    queryKey: ['shipments-page'],
    queryFn: async () => {
      const data = isMockMode
        ? generateMockShipments(200)
        : (await apiClient.get('/shipments?limit=200')).data.items;
      setShipments(data);
      return data;
    },
    staleTime: 30_000,
  });

  const filtered = shipments.filter(s => {
    const r = riskScores[s.id]?.risk_score ?? s.risk_score;
    const q = search.toLowerCase();
    return (
      (!q || s.id.toLowerCase().includes(q) || (s.carrier_name ?? '').toLowerCase().includes(q)) &&
      (status === 'All' || s.status === status.toLowerCase().replace(' ', '_')) &&
      (risk === 'All' || (risk === 'High' && r > 0.7) || (risk === 'Medium' && r >= 0.4 && r <= 0.7) || (risk === 'Low' && r < 0.4)) &&
      (city === 'All' || s.origin_hub?.city === city || s.dest_hub?.city === city)
    );
  }).sort((a, b) => {
    const ra = riskScores[a.id]?.risk_score ?? a.risk_score;
    const rb = riskScores[b.id]?.risk_score ?? b.risk_score;
    return rb - ra;
  });

  const isFiltered = search || status !== 'All' || risk !== 'All' || city !== 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 32px', gap: '20px', overflow: 'hidden' }}>
      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f1f5f9' }}>Fleet Monitoring</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>Real-time status and risk analysis — {filtered.length} shipments</p>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center',
        background: '#0f172a', border: '1px solid #1e293b',
        borderRadius: '14px', padding: '12px 16px',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search shipment ID or carrier…"
            style={{
              width: '100%', padding: '8px 12px 8px 36px', background: '#1e293b',
              border: '1px solid #334155', borderRadius: '10px', color: '#e2e8f0',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        {[
          { label: 'Status', val: status, set: setStatus, opts: ['All', 'In Transit', 'Delayed', 'Delivered'] },
          { label: 'Risk', val: risk, set: setRisk, opts: ['All', 'High', 'Medium', 'Low'] },
          { label: 'City', val: city, set: setCity, opts: ['All', 'Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Hyderabad'] },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{f.label}:</span>
            <select value={f.val} onChange={e => f.set(e.target.value)}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: '12px', borderRadius: '8px', padding: '7px 10px', outline: 'none', cursor: 'pointer' }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {isFiltered && (
          <button onClick={() => { setSearch(''); setStatus('All'); setRisk('All'); setCity('All'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
            <X size={14} /> CLEAR
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
              <tr>
                {['Shipment ID', 'Route', 'Carrier', 'ETA', 'Status', 'Risk Score', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((s, i) => (
                <ShipRow key={s.id} s={s} risk={riskScores[s.id]?.risk_score ?? s.risk_score} odd={i % 2 === 0} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ShipRow: React.FC<{ s: Shipment; risk: number; odd: boolean }> = ({ s, risk, odd }) => {
  const isLate = new Date(s.current_eta) > new Date(s.sla_deadline);
  const riskColor = getRiskColor(risk);

  return (
    <tr style={{ background: odd ? 'rgba(30,41,59,0.2)' : 'transparent', borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}>
      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0', fontSize: '13px' }}>{s.id}</span>
      </td>
      <td style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>{s.origin_hub?.city ?? '—'} → {s.dest_hub?.city ?? '—'}</div>
        <div style={{ fontSize: '11px', color: '#475569' }}>{s.origin_hub?.name}</div>
      </td>
      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b' }}>{s.carrier_name}</td>
      <td style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: isLate ? '#ef4444' : '#e2e8f0', fontFamily: 'monospace' }}>
          {format(parseISO(s.current_eta), 'HH:mm')}
        </div>
        <div style={{ fontSize: '11px', color: '#475569' }}>SLA: {format(parseISO(s.sla_deadline), 'HH:mm')}</div>
      </td>
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {s.status === 'in_transit' && <Clock size={13} color="#60a5fa" />}
          {s.status === 'delivered' && <CheckCircle size={13} color="#22c55e" />}
          {s.status === 'delayed' && <AlertCircle size={13} color="#ef4444" />}
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{s.status.replace('_', ' ')}</span>
        </div>
      </td>
      <td style={{ padding: '14px 20px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '999px',
          background: `${riskColor}15`, border: `1px solid ${riskColor}35`,
          fontSize: '11px', fontWeight: 700, color: riskColor,
        }}>
          {risk > 0.7 && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: riskColor, animation: 'riskPulse 1.5s infinite' }} />}
          {(risk * 100).toFixed(0)}% {getRiskLabel(risk)}
        </div>
      </td>
      <td style={{ padding: '14px 20px' }}>
        <button style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
          <ArrowUpRight size={16} color="#475569" />
        </button>
      </td>
    </tr>
  );
};

export default ShipmentsPage;
