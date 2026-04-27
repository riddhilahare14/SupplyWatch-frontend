import type { LineString, Polygon } from 'geojson';

export interface Hub {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Carrier {
  id: string;
  name: string;
  ontime_rate: number;
  active: boolean;
}

export interface Shipment {
  id: string;
  carrier_id: string;
  carrier_name?: string;
  origin_hub_id: string;
  dest_hub_id: string;
  origin_hub?: Hub;
  dest_hub?: Hub;
  sla_deadline: string;       // ISO 8601
  status: 'in_transit' | 'delivered' | 'delayed';
  current_eta: string;        // ISO 8601
  risk_score: number;         // 0.0–1.0
  lat?: number;
  lng?: number;
  speed_kmh?: number;
  route_geometry?: LineString;
  contents?: string;
  created_at: string;
}

export interface Disruption {
  id: string;
  name: string;
  type: 'storm' | 'road_closure' | 'port_shutdown';
  polygon?: Polygon;
  polygon_geojson?: string;
  severity: 1 | 2 | 3 | 4 | 5;
  active: boolean;
  started_at: string | null;
  ends_at: string | null;
}

export interface Prediction {
  id: string;
  shipment_id: string;
  risk_score: number;
  predicted_eta: string | null;
  scored_at: string;
  model_version: string | null;
}

export interface Reroute {
  id: string;
  shipment_id: string;
  old_route: LineString | null;
  new_route: LineString | null;
  cost_delta_pct: number | null;
  detour_pct: number | null;
  new_eta: string | null;
  sla_recovery_prob: number | null;  // 0.0–1.0
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'auto_executed';
  created_at: string;
  decided_at?: string | null;
  decided_by?: string | null;
}

export interface Metrics {
  total_shipments: number;
  in_transit: number;
  at_risk: number;
  auto_rerouted_today: number;
  pending_approvals: number;
  avg_risk_score: number;
  kafka_lag: number;
}

export type WSMessageType = 'gps_update' | 'risk_update' | 'disruption_new' | 'reroute_created' | 'reroute_decided';

export interface WSEvent {
  event: WSMessageType;
  data: any;
}
