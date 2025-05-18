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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Skillarly
            </h1>
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">
              LinkedIn Authentication
            </h2>
          </div>
          
          {/* Status Content */}
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            {status === 'Authentication successful! Redirecting...' ? (
              <>
                {/* Success Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                
                {/* Success Message */}
                <div className="text-green-700 text-sm sm:text-base md:text-lg font-medium">
                  {status}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div className="bg-green-600 h-2 sm:h-3 rounded-full animate-pulse"></div>
                </div>
              </>
            ) : status.includes('Error') ? (
              <>
                {/* Error Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </div>
                
                {/* Error Message */}
                <div className="text-red-700 text-sm sm:text-base md:text-lg font-medium">
                  {status}
                </div>
                
                {/* Retry Button */}
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                {/* Loading Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
                
                {/* Loading Message */}
                <div className="text-gray-700 text-sm sm:text-base md:text-lg font-medium">
                  {status}
                </div>
                
                {/* Loading Dots */}
                <div className="flex space-x-1 sm:space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              Please wait while we complete your authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthSuccess;
