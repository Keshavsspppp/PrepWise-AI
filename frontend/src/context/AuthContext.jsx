import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on refresh/mount
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await API.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  // Login action
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Fetch user profile immediately
      const profileResponse = await API.get('/auth/profile');
      setUser(profileResponse.data);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data?.detail || "Invalid email or password";
      return { success: false, error: message };
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      await API.post('/auth/register', { name, email, password });
      // Automatically login user upon successful registration
      return await login(email, password);
    } catch (error) {
      console.error("Registration failed:", error);
      const message = error.response?.data?.detail || "Registration failed. Please try again.";
      return { success: false, error: message };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
