import React from 'react';

function Login() {
  const handleLinkedInLogin = () => {
    // Redirect to your backend's LinkedIn auth endpoint
    window.location.href = 'https://skillarly-backend.onrender.com/auth/linkedin';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Sign in to Skillarly
        </h2>
        
        <button
          onClick={handleLinkedInLogin}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#0A66C2] text-white rounded hover:bg-[#004182] transition-colors"
        >
          {/* LinkedIn Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
          Sign in with LinkedIn
        </button>
        
        {/* Other login options can go here */}
      </div>
    </div>
  );
}

export default Login;
