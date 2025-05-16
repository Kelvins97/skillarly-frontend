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
            <button className="linkedin-button" onClick={handleLogin}>Sign in with LinkedIn</button>
          </div>
        )}
      </main>

      <footer>
        <p>Copyright &copy; {new Date().getFullYear()} Skillarly</p>
      </footer>

      <style jsx>{`
        /* Same CSS as your original file, moved inline for brevity */
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
        button {
          background: #1DA1F2;
          color: white;
          border: none;
          border-radius: 30px;
          padding: 12px 24px;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover {
          background: #0A85D1;
        }
        #loading {
          color: #1DA1F2;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
