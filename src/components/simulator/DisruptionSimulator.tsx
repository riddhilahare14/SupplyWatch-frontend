import React, { useState } from 'react';
import { apiClient, isMockMode } from '../../api/client';
import { useSupplyStore } from '../../store/useSupplyStore';

const DISRUPTIONS = [
  { key: 'storm_mumbai',        icon: '🌩', label: 'Storm Mumbai',       hint: 'Severity 4 – Large polygon over Mumbai' },
  { key: 'close_nh48',          icon: '🚧', label: 'Close NH48',          hint: 'Severity 3 – Corridor on NH48 highway' },
  { key: 'shutdown_chennai_port', icon: '⚓', label: 'Shutdown Chennai',  hint: 'Severity 5 – Chennai port closure' },
];

const DisruptionSimulator: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const addDisruption = useSupplyStore(s => s.addDisruption);

  const simulate = async (key: string, label: string) => {
    setLoading(key);
    try {
      if (!isMockMode) {
        await apiClient.post('/disruptions/simulate', { name: key });
      } else {
        await new Promise(r => setTimeout(r, 800));
        addDisruption({
          id: `sim-${Date.now()}`, name: label, type: 'storm',
          severity: 4, active: true, started_at: new Date().toISOString(), ends_at: null,
          polygon: { type: 'Polygon', coordinates: [[[72.7,18.9],[73.1,18.9],[73.1,19.3],[72.7,19.3],[72.7,18.9]]] },
        });
      }
      setToast(`✓ ${label} activated`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast('✗ Failed to simulate');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '24px', zIndex: 9999,
          background: toast.startsWith('✓') ? '#166534' : '#7f1d1d',
          border: `1px solid ${toast.startsWith('✓') ? '#22c55e' : '#ef4444'}`,
          color: '#f0fdf4', padding: '10px 16px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'none',
        }}>
          {toast}
        </div>
      )}

      <div style={{
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
        border: '1px solid #1e293b', borderRadius: '16px',
        padding: collapsed ? '12px 16px' : '16px',
        minWidth: '230px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Demo Controls
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            {collapsed ? 'EXPAND' : 'HIDE'}
          </button>
        </div>

        {!collapsed && DISRUPTIONS.map(d => (
          <button
            key={d.key}
            disabled={loading === d.key}
            onClick={() => simulate(d.key, d.label)}
            title={d.hint}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
              background: loading === d.key ? '#1e293b' : 'rgba(30,41,59,0.6)',
              border: '1px solid #334155', color: '#cbd5e1',
              cursor: loading === d.key ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 500, textAlign: 'left',
              transition: 'all 0.2s', opacity: loading === d.key ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: '16px' }}>{d.icon}</span>
            <span style={{ flex: 1 }}>{d.label}</span>
            {loading === d.key
              ? <span style={{ fontSize: '12px', color: '#64748b' }}>…</span>
              : <span style={{ fontSize: '10px', color: '#475569' }}>▶</span>
            }
          </button>
        ))}
      </div>
    </>
  );
};

export default DisruptionSimulator;
