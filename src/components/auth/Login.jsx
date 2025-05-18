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
    const backendUrl = process.env.REACT_APP_API_URL || 'https://skillarly-backend.onrender.com';
    
    // Redirect to your backend endpoint that will redirect to LinkedIn
    window.location.href = `${backendUrl}/auth/linkedin`;
    
    // Note: The backend should redirect to LinkedIn OAuth page
    // After LinkedIn auth, it should redirect back to your /auth/success route
    // with the token as a URL parameter
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Skillarly
          </h1>
          <p className="mt-3 text-sm sm:text-base lg:text-lg text-gray-600 max-w-sm mx-auto px-2">
            Sign in to access your dashboard and unlock your potential
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-lg rounded-xl border border-gray-200">
          {/* LinkedIn Sign In Button */}
          <button
            onClick={initiateLinkedInAuth}
            disabled={isLoading}
            className={`
              w-full group relative flex items-center justify-center
              py-3 px-4 sm:py-4 sm:px-6 text-sm sm:text-base font-semibold rounded-lg
              transition-all duration-200 transform
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
              }
              text-white
            `}
            aria-label={isLoading ? 'Connecting to LinkedIn...' : 'Sign in with LinkedIn'}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg 
                  className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" 
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
              <span>Sign in with LinkedIn</span>
            )}
          </button>

          {/* Security Badge */}
          <div className="mt-4 sm:mt-6 flex items-center justify-center text-xs sm:text-sm text-gray-500">
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <span>Secure OAuth Authentication</span>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs text-gray-500 leading-relaxed px-2">
              By signing in, you agree to our{' '}
              <a 
                href="https://skillarly-site.vercel.app/terms" 
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="https://skillarly-site.vercel.app/privacy" 
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
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            Need help?{' '}
            <a 
              href="https://your-external-site.com/support" 
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
