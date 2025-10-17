import axios from 'axios';

// Dynamically determine the API URL based on the current host
// For Netlify, this will point to the Netlify Functions endpoint.
// For local development, ensure your backend runs on port 3000 or adjust accordingly.
const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/.netlify/functions/server/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;