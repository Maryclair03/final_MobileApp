/**
 * API Service Layer for Little Watch Mobile App
 * Handles all communication with the Node.js backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';  // Change to your server IP
const TOKEN_KEY = '@littlewatch_token';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Helper function to save auth token
const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

// Helper function to clear auth token
const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// ============ AUTHENTICATION API ============

export const authAPI = {
  // Register new user
  register: async (name, email, password, phone = '') => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ name, email, password, phone }),
    });

    if (data.token) {
      await saveAuthToken(data.token);
    }

    return data;
  },

  // Login user
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      await saveAuthToken(data.token);
    }

    return data;
  },

  // Get user profile
  getProfile: async () => {
    return await apiRequest('/auth/profile');
  },

  // Update user profile
  updateProfile: async (name, phone) => {
    return await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    });
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Logout
  logout: async () => {
    await clearAuthToken();
  },

  // Check if user is logged in
  isLoggedIn: async () => {
    const token = await getAuthToken();
    return !!token;
  },
};

// ============ CHILDREN API ============

export const childrenAPI = {
  // Add new child
  addChild: async (childData) => {
    return await apiRequest('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  },

  // Get all children
  getChildren: async () => {
    return await apiRequest('/children');
  },

  // Get single child
  getChild: async (childId) => {
    return await apiRequest(`/children/${childId}`);
  },

  // Update child
  updateChild: async (childId, childData) => {
    return await apiRequest(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  },

  // Delete child
  deleteChild: async (childId) => {
    return await apiRequest(`/children/${childId}`, {
      method: 'DELETE',
    });
  },
};

// ============ VITALS API ============

export const vitalsAPI = {
  // Add vital reading (usually done by Arduino, but can be manual)
  addVitalReading: async (vitalData) => {
    return await apiRequest('/vitals', {
      method: 'POST',
      body: JSON.stringify(vitalData),
    });
  },

  // Get latest vitals for a child
  getLatestVitals: async (childId) => {
    return await apiRequest(`/vitals/${childId}/latest`);
  },

  // Get vitals history
  getVitalsHistory: async (childId, startDate = null, endDate = null, limit = 100) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit);

    return await apiRequest(`/vitals/${childId}/history?${params.toString()}`);
  },

  // Get vital statistics
  getVitalStats: async (childId, period = '24h') => {
    return await apiRequest(`/vitals/${childId}/stats?period=${period}`);
  },
};

// ============ ALERTS API ============

export const alertsAPI = {
  // Get all alerts
  getAlerts: async (unreadOnly = false, limit = 50) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    params.append('limit', limit);

    return await apiRequest(`/alerts?${params.toString()}`);
  },

  // Get alerts for specific child
  getChildAlerts: async (childId, limit = 50) => {
    return await apiRequest(`/alerts/child/${childId}?limit=${limit}`);
  },

  // Mark alert as read
  markAlertRead: async (alertId) => {
    return await apiRequest(`/alerts/${alertId}/read`, {
      method: 'PUT',
    });
  },

  // Mark alert as resolved
  markAlertResolved: async (alertId) => {
    return await apiRequest(`/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  },

  // Get threshold settings
  getThresholds: async (childId) => {
    return await apiRequest(`/alerts/thresholds/${childId}`);
  },

  // Update threshold settings
  updateThresholds: async (childId, thresholdData) => {
    return await apiRequest(`/alerts/thresholds/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(thresholdData),
    });
  },
};

// ============ SLEEP API ============

export const sleepAPI = {
  // Start sleep session
  startSleep: async (childId) => {
    return await apiRequest('/sleep/start', {
      method: 'POST',
      body: JSON.stringify({ childId }),
    });
  },

  // End sleep session
  endSleep: async (sessionId, quality, interruptions = 0, notes = '') => {
    return await apiRequest(`/sleep/end/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ quality, interruptions, notes }),
    });
  },

  // Get sleep history
  getSleepHistory: async (childId, limit = 30) => {
    return await apiRequest(`/sleep/${childId}/history?limit=${limit}`);
  },

  // Get sleep statistics
  getSleepStats: async (childId, period = '7d') => {
    return await apiRequest(`/sleep/${childId}/stats?period=${period}`);
  },

  // Get active sleep session
  getActiveSleep: async (childId) => {
    return await apiRequest(`/sleep/${childId}/active`);
  },
};

// Export utility functions
export const apiUtils = {
  setBaseURL: (url) => {
    API_BASE_URL = url;
  },
  getBaseURL: () => API_BASE_URL,
  clearToken: clearAuthToken,
};
