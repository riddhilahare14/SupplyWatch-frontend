import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, Table, Bell, Shield } from 'lucide-react';
import { useSupplyStore } from '../../store/useSupplyStore';

const Sidebar: React.FC = () => {
  const pendingCount = useSupplyStore(state =>
    state.pendingReroutes.filter(r => r.status === 'pending').length
  );

  const navItems = [
    { to: '/map', icon: Map, label: 'Live Map' },
    { to: '/shipments', icon: Table, label: 'Shipments' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: pendingCount },
  ];

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh', width: '64px',
      background: '#0f172a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: '16px', zIndex: 50,
      borderRight: '1px solid #1e293b',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', color: '#3b82f6' }}>
        <Shield size={28} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            style={({ isActive }) => ({
              position: 'relative',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? '#fff' : '#64748b',
              background: isActive ? '#3b82f6' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              width: '48px',
              height: '48px',
            })}
          >
            <item.icon size={22} />
            {item.badge !== undefined && item.badge > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                background: '#ef4444', color: '#fff', fontSize: '9px',
                fontWeight: 700, height: '16px', width: '16px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '2px solid #0f172a',
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
