import React, { useState } from 'react';
import LiveMap from '../components/map/LiveMap';
import DisruptionSimulator from '../components/simulator/DisruptionSimulator';
import ShipmentSidePanel from '../components/map/ShipmentSidePanel';

const MapPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <LiveMap onSelectShipment={setSelectedId} />
      </div>

      {/* Map controls — top right */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MapControls />
      </div>

      {/* Disruption simulator — bottom right */}
      <div style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000 }}>
        <DisruptionSimulator />
      </div>

      {/* Side panel */}
      {selectedId && (
        <ShipmentSidePanel shipmentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
};

const MapControls: React.FC = () => (
  <div style={{
    background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)',
    border: '1px solid #1e293b', borderRadius: '16px',
    padding: '16px', minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }}>
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
      Map Controls
    </div>
    <Toggle label="Show Routes" defaultChecked />
    <Toggle label="Show Disruptions" defaultChecked />
    <Toggle label="At-Risk Only" />
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
      <select style={{
        width: '100%', background: '#1e293b', border: '1px solid #334155',
        color: '#e2e8f0', fontSize: '12px', borderRadius: '8px', padding: '8px',
        outline: 'none', cursor: 'pointer',
      }}>
        {['All Cities', 'Mumbai', 'Delhi', 'Chennai', 'Bangalore', 'Hyderabad'].map(c => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  </div>
);

const Toggle: React.FC<{ label: string; defaultChecked?: boolean }> = ({ label, defaultChecked }) => {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{label}</span>
      <div
        onClick={() => setOn(!on)}
        style={{
          width: '36px', height: '20px', borderRadius: '999px',
          background: on ? '#3b82f6' : '#334155',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '2px',
          left: on ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
};

export default MapPage;
