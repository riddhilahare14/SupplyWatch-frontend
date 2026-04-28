import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Coord = [number, number];

interface UserRouteMapProps {
  from: Coord;
  to: Coord;
  progress: number;
  tracking: boolean;
  zoomLevel: number;
  mapMode: 'Streets' | 'Satellite';
}

const buildRoute = (from: Coord, to: Coord, steps = 28): LatLngExpression[] => {
  const points: LatLngExpression[] = [];
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const arc = Math.sin(t * Math.PI) * 0.02;
    const lat = fromLat + (toLat - fromLat) * t + arc * 0.15;
    const lng = fromLng + (toLng - fromLng) * t + arc;
    points.push([lat, lng]);
  }

  return points;
};

const TrackingController: React.FC<{ center: Coord; zoomLevel: number; tracking: boolean }> = ({ center, zoomLevel, tracking }) => {
  const map = useMap();

  useEffect(() => {
    if (tracking) {
      map.setView(center, zoomLevel, { animate: true });
    }
  }, [center, zoomLevel, tracking, map]);

  return null;
};

const tileConfig = {
  Streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  Satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

const UserRouteMap: React.FC<UserRouteMapProps> = ({ from, to, progress, tracking, zoomLevel, mapMode }) => {
  const route = useMemo(() => buildRoute(from, to), [from, to]);
  const clamped = Math.max(0, Math.min(progress, 1));
  const currentIndex = Math.max(1, Math.floor(clamped * (route.length - 1)));
  const traveled = route.slice(0, currentIndex + 1);
  const current = route[currentIndex] as Coord;

  const bounds = useMemo(() => [from, to] as LatLngBoundsExpression, [from, to]);
  const tiles = tileConfig[mapMode];

  return (
    <MapContainer
      center={current}
      zoom={zoomLevel}
      bounds={bounds}
      boundsOptions={{ padding: [28, 28] }}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={tiles.url} attribution={tiles.attribution} />
      <Polyline positions={route} pathOptions={{ color: '#9fb3d9', weight: 4, opacity: 0.6 }} />
      <Polyline positions={traveled} pathOptions={{ color: '#1f3a5f', weight: 5, opacity: 0.95 }} />
      <CircleMarker center={from} pathOptions={{ color: '#1f3a5f', weight: 2 }} radius={6} />
      <CircleMarker center={to} pathOptions={{ color: '#2f6fed', weight: 2 }} radius={6} />
      <CircleMarker center={current} pathOptions={{ color: '#1f3a5f', weight: 3, fillColor: '#1f3a5f', fillOpacity: 1 }} radius={7} />
      <TrackingController center={current} zoomLevel={zoomLevel} tracking={tracking} />
    </MapContainer>
  );
};

export default UserRouteMap;
