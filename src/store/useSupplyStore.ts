import { create } from 'zustand';
import type { Shipment, Disruption, Reroute, WSMessageType } from '../types';

interface SupplyState {
  // Live Data
  shipments: Shipment[];
  shipmentPositions: Record<string, { lat: number; lng: number; speed_kmh: number; timestamp: string }>;
  riskScores: Record<string, { risk_score: number; predicted_eta: string }>;
  activeDisruptions: Disruption[];
  pendingReroutes: Reroute[];
  
  // Connection State
  wsStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Actions
  setShipments: (shipments: Shipment[]) => void;
  setDisruptions: (disruptions: Disruption[]) => void;
  setPendingReroutes: (reroutes: Reroute[]) => void;
  setWSStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  
  // Real-time updates
  updateGPS: (shipment_id: string, lat: number, lng: number, speed_kmh: number, timestamp: string) => void;
  updateRisk: (shipment_id: string, risk_score: number, predicted_eta: string) => void;
  addDisruption: (disruption: Disruption) => void;
  addReroute: (reroute: Reroute) => void;
  decideReroute: (reroute_id: string, status: Reroute['status']) => void;
}

export const useSupplyStore = create<SupplyState>((set) => ({
  shipments: [],
  shipmentPositions: {},
  riskScores: {},
  activeDisruptions: [],
  pendingReroutes: [],
  wsStatus: 'disconnected',

  setShipments: (shipments) => set({ shipments }),
  setDisruptions: (activeDisruptions) => set({ activeDisruptions }),
  setPendingReroutes: (pendingReroutes) => set({ pendingReroutes }),
  setWSStatus: (wsStatus) => set({ wsStatus }),

  updateGPS: (shipment_id, lat, lng, speed_kmh, timestamp) => 
    set((state) => ({
      shipmentPositions: {
        ...state.shipmentPositions,
        [shipment_id]: { lat, lng, speed_kmh, timestamp }
      }
    })),

  updateRisk: (shipment_id, risk_score, predicted_eta) =>
    set((state) => ({
      riskScores: {
        ...state.riskScores,
        [shipment_id]: { risk_score, predicted_eta }
      }
    })),

  addDisruption: (disruption) =>
    set((state) => ({
      activeDisruptions: [...state.activeDisruptions, disruption]
    })),

  addReroute: (reroute) =>
    set((state) => ({
      pendingReroutes: [reroute, ...state.pendingReroutes]
    })),

  decideReroute: (reroute_id, status) =>
    set((state) => ({
      pendingReroutes: state.pendingReroutes.map(r => 
        r.id === reroute_id ? { ...r, status } : r
      ).filter(r => status === 'pending' || r.status === status) // Or keep for history
    })),
}));
