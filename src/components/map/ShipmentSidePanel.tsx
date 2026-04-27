import React from 'react';
import { useSupplyStore } from '../../store/useSupplyStore';
import { X, Truck, Navigation, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props { shipmentId: string; onClose: () => void; }

const getRiskColor = (r: number) => r > 0.7 ? '#ef4444' : r > 0.4 ? '#f59e0b' : '#22c55e';

const ShipmentSidePanel: React.FC<Props> = ({ shipmentId, onClose }) => {
  const { shipments, shipmentPositions, riskScores } = useSupplyStore();
  const s = shipments.find(x => x.id === shipmentId);
  const pos = shipmentPositions[shipmentId];
  const liveRisk = riskScores[shipmentId]?.risk_score ?? s?.risk_score ?? 0;
  const riskColor = getRiskColor(liveRisk);

  if (!s) return null;

  const isLate = new Date(s.current_eta) > new Date(s.sla_deadline);

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, height: '100%', width: '380px',
      background: '#0f172a', borderLeft: '1px solid #1e293b',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      animation: 'slideIn 0.25s ease-out',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#1e293b', borderRadius: '10px', color: riskColor }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{s.id}</div>
            <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>{s.carrier_name}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Risk Card */}
        <div style={{
          padding: '16px', borderRadius: '12px', marginBottom: '20px',
          background: liveRisk > 0.7 ? 'rgba(239,68,68,0.08)' : 'rgba(30,41,59,0.6)',
          border: `1px solid ${liveRisk > 0.7 ? 'rgba(239,68,68,0.25)' : '#1e293b'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Risk Score</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: riskColor, fontFamily: 'monospace' }}>
              {(liveRisk * 100).toFixed(0)}%
            </div>
          </div>
          {liveRisk > 0.7 ? <AlertTriangle size={28} color="#ef4444" /> : <ShieldCheck size={28} color="#22c55e" />}
        </div>

        {/* ETA vs SLA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <InfoBox label="Current ETA" value={format(parseISO(s.current_eta), 'HH:mm, dd MMM')} valueColor={isLate ? '#ef4444' : '#f1f5f9'} />
          <InfoBox label="SLA Deadline" value={format(parseISO(s.sla_deadline), 'HH:mm, dd MMM')} />
        </div>

        {/* Route */}
        <div style={{ marginBottom: '20px', padding: '16px', background: '#1e293b', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Route</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
              <div style={{ width: '1px', height: '24px', background: '#334155' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.origin_hub?.city ?? 'Origin'}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{s.origin_hub?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{s.dest_hub?.city ?? 'Destination'}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{s.dest_hub?.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live telemetry */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Live Telemetry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InfoBox label="Speed" value={`${(pos?.speed_kmh ?? s.speed_kmh ?? 0).toFixed(1)} km/h`} icon={<Clock size={14} />} />
            <InfoBox label="Status" value={s.status.replace('_', ' ')} valueColor={s.status === 'delayed' ? '#f87171' : '#86efac'} />
          </div>
        </div>

        {/* Recent events placeholder */}
        <div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Recent Events</div>
          {['GPS Ping received', 'Route updated', 'Prediction scored'].map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', marginTop: '5px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>{ev}</div>
                <div style={{ fontSize: '10px', color: '#475569' }}>{i * 5 + 1} min ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', gap: '12px' }}>
        <button style={{
          flex: 1, padding: '12px', background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
        }}>
          Track Real-time
        </button>
        <button style={{
          padding: '12px 16px', background: '#1e293b', color: '#94a3b8',
          border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer',
        }}>
          <Navigation size={18} />
        </button>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
    </div>
  );
};

const InfoBox: React.FC<{ label: string; value: string; valueColor?: string; icon?: React.ReactNode }> = ({ label, value, valueColor = '#e2e8f0', icon }) => (
  <div style={{ padding: '12px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {icon}{label}
    </div>
    <div style={{ fontSize: '13px', fontWeight: 600, color: valueColor }}>{value}</div>
  </div>
);

export default ShipmentSidePanel;
