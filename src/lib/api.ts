// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://crewmind.onrender.com';

export const API_ENDPOINTS = {
  machines: `${API_BASE_URL}/api/machines`,
  query: `${API_BASE_URL}/api/query`,
  queryStream: `${API_BASE_URL}/api/query/stream`,
  health: `${API_BASE_URL}/api/health`,
  tts: `${API_BASE_URL}/api/tts`,
  ingest: `${API_BASE_URL}/api/ingest`,
  ingestUpload: `${API_BASE_URL}/api/ingest/upload`,
};

export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;
export const apiBaseUrl = API_BASE_URL;
