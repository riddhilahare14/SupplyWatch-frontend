import { useEffect, useRef, useCallback } from 'react';
import { useSupplyStore } from '../store/useSupplyStore';
import type { WSEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Separate stable mock emitter so it isn't killed on StrictMode double-mount
let mockInterval: ReturnType<typeof setInterval> | null = null;
let mockListeners: Array<(e: WSEvent) => void> = [];

function startMock() {
  if (mockInterval) return; // already running
  mockInterval = setInterval(() => {
    const event: WSEvent = {
      event: 'gps_update',
      data: {
        shipment_id: `SHP-${1000 + Math.floor(Math.random() * 499)}`,
        lat: 20 + (Math.random() - 0.5) * 12,
        lng: 78 + (Math.random() - 0.5) * 12,
        speed_kmh: 35 + Math.random() * 50,
        timestamp: new Date().toISOString(),
      },
    };
    mockListeners.forEach(l => l(event));
  }, 3000);

  // Risk spike demo after 12s
  setTimeout(() => {
    const spike: WSEvent = {
      event: 'risk_update',
      data: { shipment_id: 'SHP-1001', risk_score: 0.88, predicted_eta: new Date(Date.now() + 120_000_000).toISOString() },
    };
    mockListeners.forEach(l => l(spike));
  }, 12_000);
}

export const useWebSocket = () => {
  const { updateGPS, updateRisk, addDisruption, addReroute, decideReroute, setWSStatus } = useSupplyStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMessage = useCallback((event: WSEvent) => {
    const { event: type, data } = event;
    switch (type) {
      case 'gps_update':    updateGPS(data.shipment_id, data.lat, data.lng, data.speed_kmh, data.timestamp); break;
      case 'risk_update':   updateRisk(data.shipment_id, data.risk_score, data.predicted_eta); break;
      case 'disruption_new': addDisruption(data); break;
      case 'reroute_created': addReroute(data); break;
      case 'reroute_decided': decideReroute(data.reroute_id, data.status); break;
    }
  }, [updateGPS, updateRisk, addDisruption, addReroute, decideReroute]);

  useEffect(() => {
    if (USE_MOCK) {
      setWSStatus('connected');
      startMock();
      mockListeners.push(handleMessage);
      return () => {
        // Remove only this handler on cleanup, keep interval alive
        mockListeners = mockListeners.filter(l => l !== handleMessage);
      };
    }

    // Real WebSocket with exponential backoff reconnection
    let retryDelay = 1000;

    const connect = () => {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;
      setWSStatus('reconnecting');

      socket.onopen = () => { setWSStatus('connected'); retryDelay = 1000; };

      socket.onmessage = (msg) => {
        try { handleMessage(JSON.parse(msg.data)); } catch {}
      };

      socket.onclose = () => {
        setWSStatus('disconnected');
        reconnectRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30_000);
          connect();
        }, retryDelay);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      socketRef.current?.close();
      clearTimeout(reconnectRef.current);
    };
  }, [handleMessage, setWSStatus]);
};
