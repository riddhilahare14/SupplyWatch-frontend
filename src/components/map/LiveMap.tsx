import React from 'react';
import { MapContainer, TileLayer, ZoomControl, Polygon, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSupplyStore } from '../../store/useSupplyStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isMockMode } from '../../api/client';
import { generateMockShipments, MOCK_DISRUPTIONS } from '../../mocks/mockData';

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const getRiskColor = (risk: number) =>
  risk > 0.7 ? '#ef4444' : risk > 0.4 ? '#f59e0b' : '#22c55e';

const makeTruckIcon = (risk: number) => {
  const color = getRiskColor(risk);
  const pulse = risk > 0.7 ? 'animation:riskPulse 1.5s infinite;' : '';
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#0f172a;border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;color:${color};${pulse}cursor:pointer;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.035-2.544A1 1 0 0 0 17.025 10H15v8"/>
        <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
      </svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface LiveMapProps {
  onSelectShipment: (id: string) => void;
}

const LiveMap: React.FC<LiveMapProps> = ({ onSelectShipment }) => {
  const { shipmentPositions, activeDisruptions, setShipments, setDisruptions, shipments, riskScores } = useSupplyStore();

  useQuery({
    queryKey: ['shipments-init'],
    queryFn: async () => {
      const data = isMockMode ? generateMockShipments(80) : (await apiClient.get('/shipments?limit=80&status=in_transit')).data.items;
      setShipments(data);
      return data;
    },
    staleTime: Infinity,
  });

  useQuery({
    queryKey: ['disruptions-init'],
    queryFn: async () => {
      const data = isMockMode ? MOCK_DISRUPTIONS : (await apiClient.get('/disruptions')).data;
      setDisruptions(data);
      return data;
    },
    staleTime: 60_000,
  });

  // severity → colour
  const disruptionColor = (sev: number) =>
    sev >= 5 ? '#ef4444' : sev >= 3 ? '#f97316' : '#eab308';

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      zoomControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      <ZoomControl position="bottomleft" />

      {/* Disruption polygons */}
      {activeDisruptions.map(d => {
        if (!d.polygon) return null;
        const color = disruptionColor(d.severity);
        return (
          <Polygon
            key={d.id}
            positions={d.polygon.coordinates[0].map(c => [c[1], c[0]] as [number, number])}
            pathOptions={{ fillColor: color, fillOpacity: 0.35, color, weight: 2 }}
          >
            <Popup>
              <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', minWidth: '160px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.name.replace(/_/g, ' ').toUpperCase()}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Type: {d.type}</div>
                <div style={{ fontSize: '12px', color: color, fontWeight: 600 }}>Severity: {d.severity}/5</div>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {/* Ship route lines + markers */}
      {shipments.map(s => {
        const pos = shipmentPositions[s.id];
        const liveRisk = riskScores[s.id]?.risk_score ?? s.risk_score;
        const lat = pos?.lat ?? s.lat;
        const lng = pos?.lng ?? s.lng;
        if (!lat || !lng) return null;

        return (
          <React.Fragment key={s.id}>
            {s.route_geometry && (
              <Polyline
                positions={s.route_geometry.coordinates.map(c => [c[1], c[0]] as [number, number])}
                pathOptions={{ color: liveRisk > 0.7 ? '#ef4444' : '#3b82f6', weight: 2, dashArray: '5 8', opacity: 0.5 }}
              />
            )}
            <Marker
              position={[lat, lng]}
              icon={makeTruckIcon(liveRisk)}
              eventHandlers={{ click: () => onSelectShipment(s.id) }}
            >
              <Popup>
                <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>{s.id}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {s.origin_hub?.city ?? '—'} → {s.dest_hub?.city ?? '—'}
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Risk:</span>
                    <span style={{ color: getRiskColor(liveRisk), fontWeight: 700 }}>{(liveRisk * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Speed: {(pos?.speed_kmh ?? s.speed_kmh ?? 0).toFixed(1)} km/h
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default LiveMap;
