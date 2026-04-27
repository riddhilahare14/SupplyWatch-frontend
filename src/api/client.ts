import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for mock mode
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';
