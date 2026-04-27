import type { WSEvent } from '../types';

type Listener = (event: WSEvent) => void;

class MockWebSocket {
  private listeners: Listener[] = [];
  private interval: any;

  constructor() {
    this.startEmitting();
  }

  private startEmitting() {
    this.interval = setInterval(() => {
      // Simulate random GPS updates for some shipments
      const event: WSEvent = {
        event: 'gps_update',
        data: {
          shipment_id: `SHP-${1000 + Math.floor(Math.random() * 500)}`,
          lat: 20 + (Math.random() - 0.5) * 10,
          lng: 78 + (Math.random() - 0.5) * 10,
          speed_kmh: 40 + Math.random() * 40,
          timestamp: new Date().toISOString()
        }
      };
      this.notify(event);
    }, 3000);

    // Simulate occasional risk spike
    setTimeout(() => {
      this.notify({
        event: 'risk_update',
        data: {
          shipment_id: 'SHP-1001',
          risk_score: 0.85,
          predicted_eta: new Date(Date.now() + 120000000).toISOString()
        }
      });
    }, 10000);
  }

  private notify(event: WSEvent) {
    this.listeners.forEach(l => l(event));
  }

  public onMessage(callback: Listener) {
    this.listeners.push(callback);
  }

  public close() {
    clearInterval(this.interval);
  }
}

export const mockWS = new MockWebSocket();
