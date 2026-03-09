const API = {
  get token() {
    return localStorage.getItem('citypulse_token');
  },
  set token(value) {
    if (value) localStorage.setItem('citypulse_token', value);
    else localStorage.removeItem('citypulse_token');
  },

  async request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(path, Object.assign({}, options, { headers }));
    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

    if (!res.ok) {
      const msg = (data && data.message) ? data.message : `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  },

  // Auth
  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // Venues
  listVenues(params = {}) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const qs = new URLSearchParams(cleaned);
    const url = qs.toString() ? `/api/venues?${qs}` : '/api/venues';
    return this.request(url, { method: 'GET', headers: {} });
  },
  listVenueMeta() {
    return this.request('/api/venues/meta', { method: 'GET', headers: {} });
  },
  createVenue(payload) {
    return this.request('/api/venues', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateVenue(id, payload) {
    return this.request(`/api/venues/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteVenue(id) {
    return this.request(`/api/venues/${id}`, { method: 'DELETE', headers: {} });
  },

  // Events
  listEvents() {
    return this.request('/api/events', { method: 'GET', headers: {} });
  },
  createEvent(payload) {
    return this.request('/api/events', { method: 'POST', body: JSON.stringify(payload) });
  }
};

window.API = API;
