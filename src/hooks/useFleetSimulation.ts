import { useEffect, useState } from 'react';

type Coord = [number, number];

type RouteSeed = {
  from: string;
  to: string;
  corridor: string;
  distanceKm: number;
  durationMin: number;
  fromCoord: Coord;
  toCoord: Coord;
};

export type FleetTruck = RouteSeed & {
  id: string;
  driver: string;
  routeIndex: number;
  progress: number;
  speedKmh: number;
  status: 'On Route' | 'Delayed' | 'Rerouted';
  delayMin: number;
  etaMin: number;
  checkpointIndex: number;
  lastUpdate: number;
};

export type FleetEvent = {
  id: string;
  truckId: string;
  time: string;
  title: string;
  detail: string;
  tone: 'info' | 'warning' | 'success';
};

const ROUTES: RouteSeed[] = [
  {
    from: 'Shivajinagar',
    to: 'Hinjewadi',
    corridor: 'IT Corridor',
    distanceKm: 19,
    durationMin: 42,
    fromCoord: [18.5308, 73.8476],
    toCoord: [18.5971, 73.7163],
  },
  {
    from: 'Kharadi',
    to: 'Pimpri',
    corridor: 'North Loop',
    distanceKm: 23,
    durationMin: 50,
    fromCoord: [18.5526, 73.9346],
    toCoord: [18.6236, 73.8010],
  },
  {
    from: 'Hadapsar',
    to: 'Wakad',
    corridor: 'Ring Route',
    distanceKm: 27,
    durationMin: 58,
    fromCoord: [18.5089, 73.9259],
    toCoord: [18.5996, 73.7645],
  },
  {
    from: 'Yerwada',
    to: 'Talegaon',
    corridor: 'Industrial Belt',
    distanceKm: 33,
    durationMin: 68,
    fromCoord: [18.5451, 73.8752],
    toCoord: [18.7350, 73.6750],
  },
  {
    from: 'Baner',
    to: 'Wagholi',
    corridor: 'East Arc',
    distanceKm: 28,
    durationMin: 61,
    fromCoord: [18.5590, 73.7866],
    toCoord: [18.5793, 73.9788],
  },
  {
    from: 'Kothrud',
    to: 'Chakan',
    corridor: 'Freight Link',
    distanceKm: 35,
    durationMin: 72,
    fromCoord: [18.5074, 73.8077],
    toCoord: [18.7617, 73.8637],
  },
];

const DRIVERS = ['Rajiv', 'Ayesha', 'Vikram', 'Neha', 'Siddharth', 'Meera', 'Arjun', 'Ishan'];
const CHECKPOINTS = [0.25, 0.5, 0.75];
const TICK_MS = 1200;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

const formatClock = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const createEvent = (truck: FleetTruck, title: string, detail: string, tone: FleetEvent['tone']): FleetEvent => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
  truckId: truck.id,
  time: formatClock(new Date()),
  title,
  detail,
  tone,
});

const seedFleet = (): FleetTruck[] =>
  ROUTES.map((route, index) => {
    const progress = rand(0.12, 0.68);
    const speedKmh = rand(28, 64);
    const delayMin = Math.random() < 0.2 ? randInt(2, 8) : 0;
    const etaMin = Math.max(3, Math.round((1 - progress) * route.durationMin + delayMin));

    return {
      ...route,
      id: `TRK-${(index + 1).toString().padStart(3, '0')}`,
      driver: DRIVERS[index % DRIVERS.length],
      routeIndex: index,
      progress,
      speedKmh,
      status: delayMin > 0 ? 'Delayed' : 'On Route',
      delayMin,
      etaMin,
      checkpointIndex: Math.floor(progress / 0.25),
      lastUpdate: Date.now(),
    };
  });

const evolveFleet = (fleet: FleetTruck[]) => {
  const nextEvents: FleetEvent[] = [];
  const now = Date.now();

  const nextFleet = fleet.map((truck) => {
    let routeIndex = truck.routeIndex;
    let route = ROUTES[routeIndex];
    let progress = truck.progress + (truck.speedKmh * (TICK_MS / 3600000)) / route.distanceKm;
    let speedKmh = clamp(truck.speedKmh + rand(-4, 4), 18, 72);
    let status = truck.status;
    let delayMin = truck.delayMin;
    let checkpointIndex = truck.checkpointIndex;

    if (Math.random() < 0.035) {
      status = 'Delayed';
      delayMin = clamp(delayMin + randInt(3, 9), 0, 28);
      nextEvents.push(createEvent(truck, 'Delay detected', `Traffic build-up adds ${delayMin} min to ETA.`, 'warning'));
    } else if (status === 'Delayed' && Math.random() < 0.35) {
      status = 'On Route';
      delayMin = clamp(delayMin - randInt(2, 6), 0, 28);
      nextEvents.push(createEvent(truck, 'Back on schedule', 'Congestion cleared, ETA improving.', 'success'));
    }

    if (checkpointIndex < CHECKPOINTS.length && progress >= CHECKPOINTS[checkpointIndex]) {
      const checkpointLabel = Math.round(CHECKPOINTS[checkpointIndex] * 100);
      checkpointIndex += 1;
      nextEvents.push(createEvent(truck, 'Checkpoint reached', `${checkpointLabel}% of route completed.`, 'info'));
    }

    if (progress >= 1) {
      const previousRoute = route;
      routeIndex = (routeIndex + randInt(1, ROUTES.length - 1)) % ROUTES.length;
      route = ROUTES[routeIndex];
      progress = rand(0.04, 0.12);
      delayMin = 0;
      status = 'On Route';
      checkpointIndex = 0;
      nextEvents.push(createEvent(truck, 'Delivered', `Arrived at ${previousRoute.to}. New dispatch queued.`, 'success'));
      nextEvents.push(createEvent(truck, 'New route assigned', `Route updated: ${route.from} to ${route.to}.`, 'info'));
    }

    const etaMin = Math.max(3, Math.round((1 - progress) * route.durationMin + delayMin));

    return {
      ...truck,
      ...route,
      routeIndex,
      progress,
      speedKmh,
      status,
      delayMin,
      etaMin,
      checkpointIndex,
      lastUpdate: now,
    };
  });

  return { nextFleet, nextEvents };
};

const INITIAL_FLEET = seedFleet();

export const useFleetSimulation = () => {
  const [fleet, setFleet] = useState<FleetTruck[]>(() => INITIAL_FLEET);
  const [events, setEvents] = useState<FleetEvent[]>(() => [
    createEvent(INITIAL_FLEET[0], 'Monitoring started', 'Live route telemetry streaming in.', 'info'),
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((prev) => {
        const { nextFleet, nextEvents } = evolveFleet(prev);
        if (nextEvents.length) {
          setEvents((current) => [...nextEvents, ...current].slice(0, 14));
        }
        return nextFleet;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return { fleet, events };
};
