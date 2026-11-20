import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://betaura.online';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let token = localStorage.getItem('betaura_admin_token');
  try {
    const rawProfile = localStorage.getItem('betaura_active_admin_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      const isSuper = Boolean(
        parsed?.isSuperAdmin ||
        parsed?.role === 'ROLE_SUPER_ADMIN' ||
        parsed?.id === 'super-admin-1' ||
        (parsed?.username || '').toLowerCase() === 'thisissuperadmin'
      );
      if (isSuper) {
        const superToken = localStorage.getItem('betaura_super_admin_token');
        if (superToken) {
          token = superToken;
        }
      }
    }
  } catch {
    // fallback
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
