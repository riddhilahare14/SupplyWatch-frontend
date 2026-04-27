import type { Shipment, Disruption, Reroute, Hub } from '../types';

const MOCK_HUBS: Hub[] = [
  { id: 'h1', name: 'Mumbai North Hub', city: 'Mumbai', lat: 19.12, lng: 72.85 },
  { id: 'h2', name: 'Delhi Central Hub', city: 'Delhi', lat: 28.61, lng: 77.20 },
  { id: 'h3', name: 'Chennai Port Hub', city: 'Chennai', lat: 13.08, lng: 80.27 },
];

export const generateMockShipments = (count: number): Shipment[] => {
  const shipments: Shipment[] = [];
  const statuses: Shipment['status'][] = ['in_transit', 'delivered', 'delayed'];
  
  for (let i = 0; i < count; i++) {
    const origin = MOCK_HUBS[Math.floor(Math.random() * MOCK_HUBS.length)];
    const dest = MOCK_HUBS[Math.floor(Math.random() * MOCK_HUBS.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const risk = Math.random();
    
    shipments.push({
      id: `SHP-${1000 + i}`,
      carrier_id: `CAR-${Math.floor(Math.random() * 5)}`,
      carrier_name: ['SpeedFreight', 'TransLogic', 'BharatHaul', 'QuickShip', 'DesiRoute'][Math.floor(Math.random() * 5)],
      origin_hub_id: origin.id,
      dest_hub_id: dest.id,
      origin_hub: origin,
      dest_hub: dest,
      sla_deadline: new Date(Date.now() + 86400000).toISOString(),
      status: status,
      current_eta: new Date(Date.now() + 90000000).toISOString(),
      risk_score: risk,
      lat: origin.lat + (Math.random() - 0.5) * 5,
      lng: origin.lng + (Math.random() - 0.5) * 5,
      speed_kmh: status === 'in_transit' ? 40 + Math.random() * 40 : 0,
      contents: 'General Cargo',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      route_geometry: {
        type: 'LineString',
        coordinates: [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat]
        ]
      }
    });
  }
  return shipments;
};

export const MOCK_DISRUPTIONS: Disruption[] = [
  {
    id: 'd1',
    name: 'Storm Mumbai',
    type: 'storm',
    severity: 4,
    active: true,
    started_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 172800000).toISOString(),
    polygon: {
      type: 'Polygon',
      coordinates: [[[72.7, 18.9], [73.0, 18.9], [73.0, 19.2], [72.7, 19.2], [72.7, 18.9]]]
    }
  }
];

export const MOCK_REROUTES: Reroute[] = [
  {
    id: 'r1',
    shipment_id: 'SHP-1001',
    status: 'pending',
    reason: 'Heavy storm predicted on primary route.',
    detour_pct: 12,
    cost_delta_pct: 5,
    new_eta: new Date(Date.now() + 95000000).toISOString(),
    sla_recovery_prob: 0.85,
    created_at: new Date().toISOString(),
    old_route: { type: 'LineString', coordinates: [[72.8, 19.0], [77.2, 28.6]] },
    new_route: { type: 'LineString', coordinates: [[72.8, 19.0], [73.5, 20.0], [77.2, 28.6]] }
  }
];
