// auth.js - Authentication utilities

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('skillarly_auth_token');
  if (!token) return false;
  
  try {
    // Get token payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Get authenticated user
export const getUser = () => {
  if (!isAuthenticated()) return null;
  
  const userStr = localStorage.getItem('skillarly_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Get authentication token
export const getAuthToken = () => {
  return localStorage.getItem('skillarly_auth_token');
};

// Logout user
export const logout = () => {
  localStorage.removeItem('skillarly_auth_token');
  localStorage.removeItem('skillarly_user');
};

// Add token to API requests
export const authHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};