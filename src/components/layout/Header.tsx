import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isMockMode } from '../../api/client';
import { useSupplyStore } from '../../store/useSupplyStore';
import type { Metrics } from '../../types';

const MOCK_METRICS: Metrics = {
  total_shipments: 2500,
  in_transit: 512,
  at_risk: 18,
  auto_rerouted_today: 42,
  pending_approvals: 5,
  avg_risk_score: 0.32,
  kafka_lag: 0,
};

const Header: React.FC = () => {
  const wsStatus = useSupplyStore(state => state.wsStatus);

  const { data: metrics = MOCK_METRICS } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      if (isMockMode) return MOCK_METRICS;
      const res = await apiClient.get('/metrics');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const wsColor = { connected: '#22c55e', disconnected: '#ef4444', reconnecting: '#f59e0b' }[wsStatus];

  return (
    <header style={{
      position: 'fixed', top: 0, left: '64px', right: 0, height: '64px',
      background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e293b', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '20px', fontWeight: 800,
          background: 'linear-gradient(90deg, #60a5fa, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SupplyWatch
        </span>
        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', paddingTop: '2px' }}>
          Dispatcher Dashboard
        </span>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Metrics strip */}
        <div style={{ display: 'flex', gap: '24px', paddingRight: '24px', borderRight: '1px solid #1e293b' }}>
          <Metric label="Total" value={metrics.total_shipments} />
          <Metric label="In Transit" value={metrics.in_transit} />
          <Metric label="At Risk" value={metrics.at_risk} color="#f87171" />
          <Metric label="Auto-Rerouted" value={metrics.auto_rerouted_today} color="#4ade80" />
          <Metric label="Pending" value={metrics.pending_approvals} color="#fb923c" />
        </div>

        {/* WS status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', background: '#1e293b',
          borderRadius: '999px', border: '1px solid #334155',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wsColor }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            WS {wsStatus}
          </span>
        </div>
      </div>
    </header>
  );
};

const Metric: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color = '#e2e8f0' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

export default Header;
