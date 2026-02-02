import axios from 'axios';

const api = axios.create({
  baseURL: 'http://sp.vruti.in/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
