import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MapPage from './pages/MapPage';
import ShipmentsPage from './pages/ShipmentsPage';
import AlertsPage from './pages/AlertsPage';
import { useWebSocket } from './hooks/useWebSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const AppContent: React.FC = () => {
  useWebSocket();

  return (
    // Full viewport, no scroll, dark background
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#020617', color: '#f8fafc' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: '64px', overflow: 'hidden' }}>
        <Header />
        {/* Main takes remaining space below 64px header */}
        <main style={{ flex: 1, marginTop: '64px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
