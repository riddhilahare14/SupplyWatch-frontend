import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Bell, LayoutGrid, LifeBuoy, LogOut, Search, Settings, Truck } from 'lucide-react';
import { useFleetSimulation } from '../hooks/useFleetSimulation';

const formatEta = (etaMin: number) =>
  new Date(Date.now() + etaMin * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const AdminDashboard: React.FC = () => {
  const { fleet } = useFleetSimulation();
  const [alertVisible, setAlertVisible] = React.useState(true);
  const [optimizeState, setOptimizeState] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [opsMessage, setOpsMessage] = React.useState('All systems stable.');
  const [activeNav, setActiveNav] = React.useState('overview');

  const navItems = [
    { id: 'overview', icon: LayoutGrid },
    { id: 'fleet', icon: Truck },
    { id: 'analytics', icon: BarChart2 },
    { id: 'support', icon: LifeBuoy },
    { id: 'settings', icon: Settings },
  ];

  const handleOptimize = () => {
    if (optimizeState === 'running') return;
    setOptimizeState('running');
    setOpsMessage('Optimization queued for 14 active routes.');
    setTimeout(() => setOptimizeState('done'), 1200);
  };

  const handleDismiss = () => {
    setAlertVisible(false);
    setOpsMessage('Alert dismissed. Monitoring continues.');
  };

  const totalDelay = fleet.reduce((sum, t) => sum + t.delayMin, 0);
  const criticalDelays = fleet.filter((t) => t.status === 'Delayed').length;
  const liveShipments = 470 + fleet.length * 2;
  const costImpact = (6.8 + totalDelay * 0.12).toFixed(1);
  const efficiency = Math.max(90, 96 - totalDelay * 0.18).toFixed(1);

  const recent = fleet.slice(0, 3).map((truck, index) => ({
    id: `SHP-${9000 + index}-B`,
    route: `${truck.from} - ${truck.to}`,
    eta: formatEta(truck.etaMin),
    status: truck.status === 'Delayed' ? 'Delayed' : truck.status === 'Rerouted' ? 'Delayed' : 'In Transit',
  }));

  return (
    <div className="sw-app">
      <div className="sw-shell">
        <aside className="sw-sidebar">
          <div className="sw-logo">SW</div>
          <nav className="sw-nav">
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`sw-nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
                role="button"
                aria-label={item.id}
              >
                <item.icon size={20} />
              </div>
            ))}
          </nav>
          <div className="sw-nav-item"><LogOut size={18} /></div>
        </aside>

        <div className="sw-main">
          <header className="sw-topbar">
            <div className="sw-brand">
              <h1>Supply Watch</h1>
              <span>Premium Management</span>
            </div>

            <div className="sw-search">
              <Search size={16} className="sw-search-icon" />
              <input placeholder="Search shipments, fleet ID, or routes..." />
            </div>

            <div className="sw-top-actions">
              <div className="sw-pill">{optimizeState === 'running' ? 'Optimizing' : 'Live'}</div>
              <Link to="/user" className="sw-btn ghost">Switch to User</Link>
              <Bell size={18} />
              <div className="sw-avatar">
                <div className="sw-avatar-circle">RM</div>
                Rajiv Malhotra
              </div>
            </div>
          </header>

          <div className="sw-content">
            <div className="sw-welcome">
              <div>
                <h2>Welcome back, Rajiv</h2>
                <p>Network health is currently at 94%. Your attention is needed on the Mumbai-Pune corridor.</p>
              </div>
              {alertVisible ? (
                <div className="sw-alert">
                  <div>
                    <strong>2 critical route disruptions detected</strong>
                    <div><span>Monsoon conditions in the Arabian Sea have impacted maritime routes. R-402 and R-405 require review.</span></div>
                  </div>
                  <div className="sw-alert-actions">
                    <button className="sw-btn primary" onClick={handleOptimize} disabled={optimizeState === 'running'}>
                      {optimizeState === 'running' ? 'Optimizing...' : 'Optimize Now'}
                    </button>
                    <button className="sw-btn ghost" onClick={handleDismiss}>Dismiss</button>
                  </div>
                </div>
              ) : (
                <div className="sw-alert" style={{ background: '#f3f5f9' }}>
                  <div>
                    <strong>Monitoring active</strong>
                    <div><span>No critical disruptions in the last 30 minutes.</span></div>
                  </div>
                </div>
              )}
            </div>

            <section className="sw-stats">
              <div className="sw-stat-card">
                <h3>Active</h3>
                <strong>{liveShipments}</strong>
                <span>Live shipments globally</span>
              </div>
              <div className="sw-stat-card">
                <h3>Delayed</h3>
                <strong>{Math.max(criticalDelays + 10, 12)}</strong>
                <span>Critical delays pending</span>
              </div>
              <div className="sw-stat-card">
                <h3>Cost Impact</h3>
                <strong>INR {costImpact}M</strong>
                <span>Projected monthly loss</span>
              </div>
              <div className="sw-stat-card">
                <h3>Efficiency</h3>
                <strong>{efficiency}%</strong>
                <span>Network performance</span>
              </div>
            </section>

            <section className="sw-grid">
              <div className="sw-card">
                <div className="sw-card-header">
                  <h3 className="sw-card-title">Recent Shipments</h3>
                  <span className="sw-link">View All Shipments</span>
                </div>
                <div className="sw-shipments">
                  {recent.map((shipment) => (
                    <div key={shipment.id} className="sw-shipment-item">
                      <div className="sw-shipment-id">{shipment.id}</div>
                      <div>
                        <div className="sw-shipment-route">{shipment.route}</div>
                        <div className="sw-shipment-route">ETA {shipment.eta}</div>
                      </div>
                      <div className={`sw-status-pill ${shipment.status.toLowerCase().replace(' ', '-')}`}>
                        {shipment.status}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div className="sw-card-header">
                    <h3 className="sw-card-title">Live Fleet - Pune Routes</h3>
                    <span className="sw-link">Auto-refreshing</span>
                  </div>
                  <div className="sw-live-row" style={{ fontWeight: 700, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>
                    <div>Truck</div>
                    <div>Route</div>
                    <div>ETA</div>
                    <div>Speed</div>
                    <div>Progress</div>
                  </div>
                  {fleet.map((truck) => (
                    <div key={truck.id} className="sw-live-row">
                      <div>{truck.id}</div>
                      <div>{truck.from} - {truck.to}</div>
                      <div>{formatEta(truck.etaMin)}</div>
                      <div>{truck.speedKmh.toFixed(1)} km/h</div>
                      <div>
                        <div className="sw-progress">
                          <span style={{ width: `${Math.min(truck.progress * 100, 100)}%` }} />
                          <div className="sw-progress-dot" style={{ left: `${Math.min(truck.progress * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sw-card">
                <div className="sw-card-header">
                  <h3 className="sw-card-title">Operations</h3>
                  <span className="sw-link">Tools</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>{opsMessage}</div>
                <div className="sw-ops">
                  <div className="sw-ops-card">
                    <h4>Optimize routes</h4>
                    <p>AI-driven path calculation for 14 active vessels.</p>
                    <button className="sw-btn primary" onClick={handleOptimize} disabled={optimizeState === 'running'}>
                      {optimizeState === 'running' ? 'Optimizing...' : 'Optimize Now'}
                    </button>
                  </div>
                  <div className="sw-ops-card">
                    <h4>View Analytics</h4>
                    <p>Review disruption logs and corridor health trends.</p>
                    <button className="sw-btn ghost" onClick={() => setOpsMessage('Analytics opened for Mumbai-Pune corridor.')}>Open Analytics</button>
                  </div>
                  <div className="sw-ops-card">
                    <h4>Fleet Notes</h4>
                    <p>Monsoon watch issued for Pune West freight lanes.</p>
                    <button className="sw-btn ghost" onClick={() => setOpsMessage('Fleet notes updated. Next review at 18:30.')}>See Notes</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
