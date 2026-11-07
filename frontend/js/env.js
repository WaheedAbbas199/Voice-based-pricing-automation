/* Environment config — the ONLY file to edit per deployment. Never put secrets here (it is public). */
window.__ENV__ = {
  API_BASE_URL: '/api',   // e.g. 'https://api.example.com/api'
  USE_MOCK: true          // true = local demo data in localStorage; false = call the real backend
};
