import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthSuccess() {
  const [status, setStatus] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    // Extract token from URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('Error: No authentication token found');
      return;
    }

    try {
      // Store the token in localStorage
      localStorage.setItem('skillarly_auth_token', token);
      
      // Decode token payload to get user info (without requiring jwt library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Store user info if needed
      localStorage.setItem('skillarly_user', JSON.stringify({
        id: payload.id,
        name: payload.name,
        email: payload.email
      }));

      // Success - redirect to dashboard
      setStatus('Authentication successful! Redirecting...');
      
      // Short timeout to allow user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Token processing error:', error);
      setStatus('Authentication error. Please try again.');
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          LinkedIn Authentication
        </h2>
        
        <div className="text-center">
          {status === 'Authentication successful! Redirecting...' ? (
            <>
              <div className="text-green-600 mb-4">✓ {status}</div>
              <div className="animate-pulse mt-4">
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </>
          ) : status.includes('Error') ? (
            <div className="text-red-600">{status}</div>
          ) : (
            <>
              <div className="text-gray-600 mb-4">{status}</div>
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthSuccess;