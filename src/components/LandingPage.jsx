import React, { useEffect, useState } from 'react';

const LandingPage = () => {
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('profile');
    const tokenParam = urlParams.get('token');
    if (profileParam && tokenParam) {
      setProfile(profileParam);
      setToken(tokenParam);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = 'https://skillarly-backend.onrender.com/auth/linkedin';
  };

  const handleAnalyze = async () => {
    if (!profile || !token) {
      alert('Authentication required. Please sign in with LinkedIn first.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://skillarly-backend.onrender.com/scrape-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ profileUrl: profile })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = `dashboard?userId=${data.userId}&token=${token}`;
      } else {
        alert('There was an error analyzing your profile: ' + data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('There was an error connecting to the server. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Welcome to Skillarly</h1>
      </header>

      <main>
        {loading ? (
          <div id="loading">Processing your profile...</div>
        ) : profile && token ? (
          <div id="content">
            <p>You're signed in! Ready to analyze your LinkedIn profile?</p>
            <p id="profile-name">Profile: {profile}</p>
            <button onClick={handleAnalyze}>Analyze My Profile</button>
          </div>
        ) : (
          <div id="not-authenticated">
            <p>To analyze your LinkedIn profile, you need to authenticate with LinkedIn first.</p>
            <button className="linkedin-button" onClick={handleLogin}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                style={{ marginRight: '8px' }}
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Sign in with LinkedIn
            </button>
          </div>
        )}
      </main>

      <footer>
        <p>Copyright &copy; {new Date().getFullYear()} Skillarly</p>
      </footer>

      <style jsx>{`
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #F5F8FA;
        }
        
        header, footer {
          background: white;
          text-align: center;
          padding: 20px;
        }
        
        header {
          border-bottom: 3px solid #1DA1F2;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
          color: #1DA1F2;
          margin: 0;
        }
        
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          background: white;
          margin: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        #not-authenticated {
          text-align: center;
          max-width: 400px;
        }
        
        #not-authenticated p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 25px;
          line-height: 1.6;
        }
        
        button {
          background: #1DA1F2;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          width: 100%;
          max-width: 280px;
        }
        
        button:hover {
          background: #0A85D1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .linkedin-button {
          background-color: #0077b5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s;
          width: 100%;
          max-width: 280px;
        }
        
        .linkedin-button:hover {
          background-color: #005885;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        #content {
          text-align: center;
          max-width: 400px;
        }
        
        #content p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 15px;
        }
        
        #profile-name {
          color: #0077b5;
          font-weight: 600;
          margin-bottom: 25px;
        }
        
        #loading {
          color: #1DA1F2;
          font-size: 1.2rem;
          text-align: center;
        }
        
        footer {
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
          margin-top: 0;
        }
        
        footer p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          main {
            margin: 15px;
            padding: 30px 15px;
          }
          
          h1 {
            font-size: 1.5rem;
          }
          
          #not-authenticated p,
          #content p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
