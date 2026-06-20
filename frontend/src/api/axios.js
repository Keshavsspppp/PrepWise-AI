import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL;
if (!rawBaseURL && import.meta.env.PROD) {
  console.error("CRITICAL CONFIGURATION ERROR: VITE_API_URL environment variable is not defined in production!");
  if (typeof window !== 'undefined') {
    const showBanner = () => {
      const banner = document.createElement('div');
      banner.id = 'vite-api-url-error-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:14px 20px;text-align:center;z-index:99999;font-family:system-ui,sans-serif;font-weight:700;font-size:0.95rem;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
      banner.innerHTML = '⚠️ <strong>Configuration Error:</strong> VITE_API_URL is missing. Production deployment requires this environment variable.';
      document.body.appendChild(banner);
      document.body.style.paddingTop = '50px';
    };
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
}

const finalBaseURL = rawBaseURL || 'http://localhost:8000';

// Create a pre-configured instance of Axios
const API = axios.create({
  baseURL: finalBaseURL,
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
          const baseURL = finalBaseURL;
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
