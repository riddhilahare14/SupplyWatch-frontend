import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Shipment } from '../../types';
import { Truck } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface TruckMarkerProps {
  shipment: Shipment;
  livePosition?: { lat: number; lng: number; speed_kmh: number };
  liveRisk?: { risk_score: number };
  onClick: () => void;
}

const TruckMarker: React.FC<TruckMarkerProps> = ({ shipment, livePosition, liveRisk, onClick }) => {
  const lat = livePosition?.lat ?? shipment.lat ?? 0;
  const lng = livePosition?.lng ?? shipment.lng ?? 0;
  const risk = liveRisk?.risk_score ?? shipment.risk_score;

  if (lat === 0) return null;

  const color = risk > 0.7 ? '#E74C3C' : risk > 0.4 ? '#F5A623' : '#27AE60';
  const isHighRisk = risk > 0.7;

  const icon = L.divIcon({
    html: `
      <div class="relative group">
        <div class="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center transition-all duration-300 ${isHighRisk ? 'risk-pulse' : ''}" 
             style="border-color: ${color}; color: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.035-2.544A1 1 0 0 0 17.025 10H15v8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ${shipment.id}
        </div>
      </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker 
      position={[lat, lng]} 
      icon={icon} 
      eventHandlers={{ click: onClick }}
    >
      <Popup className="custom-popup">
        <div className="p-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-100">${shipment.id}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style="background: ${color}20; color: ${color}">
              ${(risk * 100).toFixed(0)}% RISK
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Speed: ${livePosition?.speed_kmh?.toFixed(1) ?? shipment.speed_kmh?.toFixed(1) ?? 0} km/h
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default TruckMarker;
