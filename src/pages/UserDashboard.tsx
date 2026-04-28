import React from 'react';
import { Link } from 'react-router-dom';
import { useFleetSimulation } from '../hooks/useFleetSimulation';
import UserRouteMap from '../components/map/UserRouteMap';

const formatEta = (etaMin: number) =>
  new Date(Date.now() + etaMin * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const UserDashboard: React.FC = () => {
  const { fleet, events } = useFleetSimulation();
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [tracking, setTracking] = React.useState(true);
  const [mapMode, setMapMode] = React.useState<'Streets' | 'Satellite'>('Streets');
  const [zoomLevel, setZoomLevel] = React.useState(12);
  const [paused, setPaused] = React.useState(false);
  const [frozen, setFrozen] = React.useState<typeof fleet[number] | null>(null);

  React.useEffect(() => {
    if (!selectedId && fleet.length) {
      setSelectedId(fleet[0].id);
    }
  }, [fleet, selectedId]);

  const selected = fleet.find((t) => t.id === selectedId) ?? fleet[0];
  const activeTruck = paused && frozen ? frozen : selected;
  const updates = activeTruck ? events.filter((e) => e.truckId === activeTruck.id).slice(0, 6) : [];

  if (!activeTruck) {
    return <div className="sw-app" />;
  }

  const progressPct = Math.min(activeTruck.progress * 100, 100);

  const handleZoomIn = () => setZoomLevel((value) => Math.min(14, value + 1));
  const handleZoomOut = () => setZoomLevel((value) => Math.max(10, value - 1));
  const handleToggleTracking = () => setTracking((value) => !value);
  const handleToggleMode = () => setMapMode((value) => (value === 'Streets' ? 'Satellite' : 'Streets'));
  const handleTogglePause = () => {
    if (paused) {
      setPaused(false);
      setFrozen(null);
    } else {
      setPaused(true);
      setFrozen(activeTruck);
    }
  };

  return (
    <div className="sw-app sw-user-shell">
      <div className="sw-user-top">
        <div className="sw-user-title">
          <h2>Shipment Live View</h2>
          <span>Real-time route updates for Pune region dispatches.</span>
        </div>
        <div className="sw-user-selector">
          <div className="sw-pill">{paused ? 'Paused' : 'Realtime'}</div>
          <Link to="/admin" className="sw-btn ghost">Switch to Admin</Link>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {fleet.map((truck) => (
              <option key={truck.id} value={truck.id}>{truck.id} - {truck.from} to {truck.to}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="sw-user-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sw-map-card">
            <div className="sw-map-header">
              <div>
                <div className="sw-map-title">Route Map</div>
                <div className="sw-map-sub">Pune live corridor view</div>
              </div>
              <div className="sw-map-controls">
                <button className={`sw-chip ${tracking ? 'active' : ''}`} onClick={handleToggleTracking}>
                  {tracking ? 'Tracking On' : 'Tracking Off'}
                </button>
                <button className="sw-chip" onClick={handleToggleMode}>{mapMode}</button>
                <button className="sw-chip" onClick={handleZoomOut}>-</button>
                <button className="sw-chip" onClick={handleZoomIn}>+</button>
              </div>
            </div>
            <div className="sw-map-canvas">
              <UserRouteMap
                from={activeTruck.fromCoord}
                to={activeTruck.toCoord}
                progress={activeTruck.progress}
                tracking={tracking}
                zoomLevel={zoomLevel}
                mapMode={mapMode}
              />
              <div className="sw-map-label left">{activeTruck.from}</div>
              <div className="sw-map-label right">{activeTruck.to}</div>
            </div>
            <div className="sw-map-actions">
              <button className="sw-btn ghost" onClick={() => setSelectedId(activeTruck.id)}>Center on truck</button>
              <button className="sw-btn primary" onClick={handleTogglePause}>{paused ? 'Resume Updates' : 'Pause Updates'}</button>
            </div>
          </div>

          <div className="sw-route-card">
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.4px', color: '#6b7280', fontWeight: 700 }}>Active Route</div>
              <h3 style={{ margin: '6px 0 0', fontSize: '22px' }}>{activeTruck.from} to {activeTruck.to}</h3>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{activeTruck.corridor} corridor</div>
            </div>

            <div className="sw-route-line">
              <div className="sw-route-path">
                <div className="sw-route-progress" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="sw-route-marker" style={{ left: `${progressPct}%` }} />
            </div>

            <div className="sw-route-labels">
              <span>{activeTruck.from}</span>
              <span>{Math.round(progressPct)}% complete</span>
              <span>{activeTruck.to}</span>
            </div>

            <div className="sw-metrics-grid">
              <div className="sw-metric">
                <span>Current Speed</span>
                <strong>{activeTruck.speedKmh.toFixed(1)} km/h</strong>
              </div>
              <div className="sw-metric">
                <span>ETA</span>
                <strong>{formatEta(activeTruck.etaMin)}</strong>
              </div>
              <div className="sw-metric">
                <span>Status</span>
                <strong>{activeTruck.status}</strong>
              </div>
            </div>

            <div className="sw-metric">
              <span>Driver</span>
              <strong>{activeTruck.driver}</strong>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Last update {new Date(activeTruck.lastUpdate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sw-card">
            <div className="sw-card-header">
              <h3 className="sw-card-title">Live Updates</h3>
              <span className="sw-link">Streaming</span>
            </div>
            <div className="sw-update-list">
              {updates.length === 0 && (
                <div className="sw-update-item info">
                  <small>Awaiting signal</small>
                  <strong>Telemetry stream is initializing.</strong>
                  <span>Check back in a few seconds.</span>
                </div>
              )}
              {updates.map((update) => (
                <div key={update.id} className={`sw-update-item ${update.tone}`}>
                  <small>{update.time}</small>
                  <strong>{update.title}</strong>
                  <span>{update.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sw-card">
            <div className="sw-card-header">
              <h3 className="sw-card-title">Route Summary</h3>
              <span className="sw-link">Customer View</span>
            </div>
            <div className="sw-shipments" style={{ gap: '12px' }}>
              <div className="sw-shipment-item">
                <div className="sw-shipment-id">Shipment ID</div>
                <div className="sw-shipment-route">{activeTruck.id}</div>
              </div>
              <div className="sw-shipment-item">
                <div className="sw-shipment-id">Distance</div>
                <div className="sw-shipment-route">{activeTruck.distanceKm} km</div>
              </div>
              <div className="sw-shipment-item">
                <div className="sw-shipment-id">Delay Buffer</div>
                <div className="sw-shipment-route">{activeTruck.delayMin} min</div>
              </div>
              <div className="sw-shipment-item">
                <div className="sw-shipment-id">Status</div>
                <div className={`sw-status-pill ${activeTruck.status === 'Delayed' ? 'delayed' : 'in-transit'}`}>
                  {activeTruck.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
