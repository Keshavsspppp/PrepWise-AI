import axios from 'axios';

// Create a pre-configured instance of Axios
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically append the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refreshing on 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried this request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: new_refresh_token } = refreshResponse.data;
          
          localStorage.setItem('token', access_token);
          localStorage.setItem('refresh_token', new_refresh_token);
          
          // Retry original request with the new access token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          } else {
            originalRequest.headers = { Authorization: `Bearer ${access_token}` };
          }
          return API(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token failed:", refreshError);
          // Clean up tokens if refresh fails
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.hash = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
