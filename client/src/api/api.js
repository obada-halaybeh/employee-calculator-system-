const BASE_URL = 'http://localhost:5000/api';

const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (path !== '/auth/login') {
        window.location.href = '/login';
      }
      const message = data?.message || 'Unauthorized';
      throw new Error(message);
    }

    if (!res.ok) {
      const message = data?.message || 'Request failed';
      throw new Error(message);
    }
    return data;
  },

  get(path) {
    return this.request(path, { method: 'GET' });
  },
  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  },
  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  patch(path, body) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
  },
  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
};

export default api;
