import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('spendly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('spendly_token');
      localStorage.removeItem('spendly_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: data => api.post('/auth/register', data),
  login:    data => api.post('/auth/login', data),
};

export const txApi = {
  getAll:      ()             => api.get('/transactions'),
  getByMonth:  (month, year) => api.get(`/transactions/month?month=${month}&year=${year}`),
  create:      data          => api.post('/transactions', data),
  update:      (id, data)    => api.put(`/transactions/${id}`, data),
  delete:      id            => api.delete(`/transactions/${id}`),
  deleteMonth: (month, year) => api.delete(`/transactions/month?month=${month}&year=${year}`),
};

export const budgetApi = {
  getAll:   ()             => api.get('/budgets'),
  getMonth: (month, year) => api.get(`/budgets/month?month=${month}&year=${year}`),
  upsert:   data          => api.post('/budgets', data),
  delete:   (month, year) => api.delete(`/budgets/month?month=${month}&year=${year}`),
};

export const analyticsApi = {
  summary: (month, year) => api.get(`/analytics/summary?month=${month}&year=${year}`),
};

export default api;
