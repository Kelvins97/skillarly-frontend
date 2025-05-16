import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';

// Import your components
import AuthSuccess from './components/Auth/AuthSuccess';
import Dashboard from './components/Dashboard';
import Login from './components/Auth/Login';
import Landing from './components/LandingPage'; // Make sure you have this component

// Protected route wrapper
const ProtectedRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

// Log route changes for debugging
const logRouteChange = () => {
  console.log('Current route:', window.location.pathname + window.location.search);
};

function AppRouter() {
  React.useEffect(() => {
    // Log initial route
    logRouteChange();
    
    // Add event listener for route changes
    window.addEventListener('popstate', logRouteChange);
    
    return () => {
      window.removeEventListener('popstate', logRouteChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Auth callback route - ensure this works */}
        <Route path="/auth/success" element={<AuthSuccess />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        
        {/* Add more routes as needed */}
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
