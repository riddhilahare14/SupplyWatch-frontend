import React, { useState } from 'react';
import { useSupplyStore } from '../store/useSupplyStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isMockMode } from '../api/client';
import { MOCK_REROUTES } from '../mocks/mockData';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Check, X, DollarSign, Ruler, Clock, Shield } from 'lucide-react';


const AlertsPage: React.FC = () => {
  const { pendingReroutes, setPendingReroutes, decideReroute, shipments } = useSupplyStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [rejectInput, setRejectInput] = useState('');
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  useQuery({
    queryKey: ['reroutes-page'],
    queryFn: async () => {
      const data = isMockMode ? MOCK_REROUTES : (await apiClient.get('/reroutes')).data;
      setPendingReroutes(data);
      return data;
    },
    staleTime: 30_000,
  });

  const selected = pendingReroutes.find(r => r.id === selectedId);
  const selectedShipment = selected ? shipments.find(s => s.id === selected.shipment_id) : null;

  const approve = async (id: string) => {
    setSubmitting(id);
    try {
      if (!isMockMode) await apiClient.post(`/reroutes/${id}/approve`);
      decideReroute(id, 'approved');
      if (selectedId === id) setSelectedId(null);
    } finally { setSubmitting(null); }
  };

  const reject = async (id: string) => {
    if (!rejectInput && showRejectFor !== id) { setShowRejectFor(id); return; }
    setSubmitting(id);
    try {
      if (!isMockMode) await apiClient.post(`/reroutes/${id}/reject`, { reason: rejectInput });
      decideReroute(id, 'rejected');
      setShowRejectFor(null); setRejectInput('');
      if (selectedId === id) setSelectedId(null);
    } finally { setSubmitting(null); }
  };

  const sections = [
    { title: 'Requires Action', color: '#ef4444', icon: <AlertTriangle size={13} color="#ef4444" />, items: pendingReroutes.filter(r => r.status === 'pending') },
    { title: 'Auto-Resolved',   color: '#22c55e', icon: <CheckCircle size={13} color="#22c55e" />, items: pendingReroutes.filter(r => r.status === 'auto_executed') },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left feed */}
      <div style={{ width: '420px', borderRight: '1px solid #1e293b', overflowY: 'auto', flexShrink: 0, background: 'rgba(15,23,42,0.5)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>Alert Inbox</h2>
          <span style={{ padding: '3px 10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '999px', fontSize: '10px', color: '#60a5fa', fontWeight: 700 }}>LIVE</span>
        </div>

        {sections.map(sec => (
          <div key={sec.title}>
            <div style={{ padding: '10px 24px', background: `${sec.color}08`, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {sec.icon}
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>{sec.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#334155', fontFamily: 'monospace' }}>{sec.items.length}</span>
            </div>

            {sec.items.length === 0 && (
              <div style={{ padding: '16px 24px', fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>No alerts here.</div>
            )}

            {sec.items.map(r => (
              <div key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={{
                  padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid #0f172a',
                  borderLeft: selectedId === r.id ? '3px solid #3b82f6' : '3px solid transparent',
                  background: selectedId === r.id ? 'rgba(59,130,246,0.06)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0', fontSize: '13px' }}>{r.shipment_id}</span>
                  <span style={{ fontSize: '11px', color: '#475569' }}>{formatDistanceToNow(parseISO(r.created_at))} ago</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{r.reason}</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Chip label="Detour" value={`+${r.detour_pct}%`} color="#f59e0b" />
                  <Chip label="Cost" value={`+${r.cost_delta_pct}%`} color="#ef4444" />
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                      background: r.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                      color: r.status === 'pending' ? '#f59e0b' : '#22c55e',
                      border: `1px solid ${r.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                      textTransform: 'uppercase',
                    }}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                    <button disabled={submitting === r.id} onClick={() => approve(r.id)}
                      style={{ flex: 1, padding: '8px', background: '#166534', border: '1px solid #22c55e', color: '#4ade80', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                      <Check size={13} style={{ display: 'inline', marginRight: '4px' }} />Approve
                    </button>
                    <button disabled={submitting === r.id} onClick={() => reject(r.id)}
                      style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                      <X size={13} style={{ display: 'inline', marginRight: '4px' }} />Reject
                    </button>
                  </div>
                )}

                {showRejectFor === r.id && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <input value={rejectInput} onChange={e => setRejectInput(e.target.value)} placeholder="Reason for rejection…"
                      style={{ flex: 1, padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px', outline: 'none' }} />
                    <button onClick={() => reject(r.id)}
                      style={{ padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Right detail panel */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#020617' }}>
        {selected ? (
          <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#f1f5f9' }}>Reroute Proposal</h2>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase',
                    background: selected.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                    color: selected.status === 'pending' ? '#f59e0b' : '#22c55e',
                    border: `1px solid ${selected.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  }}>
                    {selected.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                  Shipment: <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700 }}>{selected.shipment_id}</span>
                  {selectedShipment && ` · ${selectedShipment.carrier_name}`}
                </p>
              </div>
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button disabled={submitting === selected.id} onClick={() => approve(selected.id)}
                    style={{ padding: '12px 24px', background: '#166534', border: '1px solid #22c55e', color: '#4ade80', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    ✓ Approve
                  </button>
                  <button disabled={submitting === selected.id} onClick={() => { setShowRejectFor(selected.id); }}
                    style={{ padding: '12px 24px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>

            {/* Reason */}
            <div style={{ padding: '20px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderLeft: '3px solid #3b82f6', borderRadius: '12px', marginBottom: '28px' }}>
              <p style={{ margin: 0, color: '#93c5fd', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic' }}>"{selected.reason}"</p>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              <BigMetric icon={<DollarSign size={20} />} label="Cost Delta" value={`+${selected.cost_delta_pct}%`} color="#ef4444" />
              <BigMetric icon={<Ruler size={20} />} label="Detour" value={`+${selected.detour_pct}%`} color="#f59e0b" />
              <BigMetric icon={<Clock size={20} />} label="New ETA" value={selected.new_eta ? format(parseISO(selected.new_eta), 'HH:mm') : '—'} />
              <BigMetric icon={<Shield size={20} />} label="SLA Recovery" value={`${((selected.sla_recovery_prob ?? 0) * 100).toFixed(0)}%`} color="#22c55e" />
            </div>

            {/* Route comparison */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Route Comparison</div>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <RouteBox label="Current Route" color="#334155" />
                <span style={{ color: '#1e293b', fontSize: '24px' }}>→</span>
                <RouteBox label="Proposed Route" color="#1d4ed8" highlighted />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1e293b', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', border: '2px dashed #1e293b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>←</div>
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 500 }}>Select an alert to view reroute details</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Chip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color }}>{value}</span>
  </div>
);

const BigMetric: React.FC<{ icon: React.ReactNode; label: string; value: string; color?: string }> = ({ icon, label, value, color = '#e2e8f0' }) => (
  <div style={{ padding: '16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', marginBottom: '8px' }}>
      {icon}<span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    </div>
    <div style={{ fontSize: '22px', fontFamily: 'monospace', fontWeight: 800, color }}>{value}</div>
  </div>
);

const RouteBox: React.FC<{ label: string; color: string; highlighted?: boolean }> = ({ label, color, highlighted }) => (
  <div style={{
    flex: 1, height: '120px', background: '#1e293b', borderRadius: '12px',
    border: `2px solid ${highlighted ? '#3b82f6' : '#334155'}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(#4a90e2 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
    <div style={{ width: '60%', height: '3px', background: color, borderRadius: '4px', transform: highlighted ? 'rotate(-8deg)' : 'none' }} />
    <span style={{ fontSize: '11px', color: highlighted ? '#60a5fa' : '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
  </div>
);

export default AlertsPage;
