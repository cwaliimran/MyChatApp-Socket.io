// src/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://192.168.100.48:4001/api/', // Replace with your backend URL
  timeout: 10000,
});

// Function to set Authorization header with Bearer token
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
