import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Check if user is already authenticated
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const initiateLinkedInAuth = () => {
    setIsLoading(true);
    
    // Your backend API endpoint that generates the LinkedIn OAuth URL
    const backendUrl = process.env.REACT_APP_API_URL || 'https://skillarly-backend.onrender.com/';
    
    // Redirect to your backend endpoint that will redirect to LinkedIn
    window.location.href = `${backendUrl}/auth/linkedin`;
    
    // Note: The backend should redirect to LinkedIn OAuth page
    // After LinkedIn auth, it should redirect back to your /auth/success route
    // with the token as a URL parameter
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Skillarly
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-sm mx-auto px-4">
            Sign in to access your dashboard and unlock your potential
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
          {/* LinkedIn Sign In Button */}
          <button
            onClick={initiateLinkedInAuth}
            disabled={isLoading}
            className={`
              w-full group relative flex items-center justify-center
              py-4 px-6 text-base font-semibold rounded-xl
              transition-all duration-200 transform
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed scale-95' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }
              text-white
            `}
            aria-label={isLoading ? 'Connecting to LinkedIn...' : 'Sign in with LinkedIn'}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <svg 
                  className="w-6 h-6 mr-3 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>Sign in with LinkedIn</span>
              </div>
            )}
          </button>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <svg 
              className="w-4 h-4 mr-2 text-green-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 1L5 3v6c0 5.55 3.84 9.739 9 9.739 5.16 0 9-4.189 9-9.739V3l-5-2zM8.25 8.5a1.25 1.25 0 1 1 2.5 0v2.25H8.25V8.5z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>Secure OAuth Authentication</span>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              By signing in, you agree to our{' '}
              <a 
                href="/terms" 
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="/privacy" 
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Need help?{' '}
            <a 
              href="/support" 
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors duration-200"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
