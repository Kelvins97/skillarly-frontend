import React, { useEffect, useRef, useState } from 'react';
import { getUser, getAuthToken, logout } from '../utils/auth'; // Import your auth utilities
import { useNavigate } from 'react-router-dom';
import './style.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [recommendations, setRecommendations] = useState({ courses: [], certifications: [], jobs: [] });
  const [preferences, setPreferences] = useState({ email_notifications: false });
  const [plan, setPlan] = useState('Loading...');
  const [scrapeCount, setScrapeCount] = useState(0);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [apiErrors, setApiErrors] = useState({});
  const themeToggleRef = useRef();
  const navigate = useNavigate();

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Function to get default avatar URL (you can replace this with your preferred default avatar)
  const getDefaultAvatar = () => {
    // Use a placeholder service with the user's name
    const userName = userData?.name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0ea5e9&color=fff&size=150&font-size=0.6`;
  };

  // Function to get the profile picture URL with fallbacks
  const getProfilePictureUrl = () => {
    // First, try to get from userData (which comes from backend API)
    if (userData?.profilePicture) {
      return userData.profilePicture;
    }
    
    // Second, try to get from the JWT token (stored in localStorage)
    const user = getUser();
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    
    // Third, check if there's a stored profile picture URL in localStorage
    const storedProfilePic = localStorage.getItem('userProfilePicture');
    if (storedProfilePic) {
      return storedProfilePic;
    }
    
    // Finally, fall back to the default avatar
    return getDefaultAvatar();
  };

  // Enhanced error handling for API calls
  const handleApiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      setApiErrors(prev => ({ ...prev, [url]: error.message }));
      throw error;
    }
  };

  useEffect(() => {
    // Get user and token from localStorage using your auth utilities
    const user = getUser();
    const token = getAuthToken();

    console.log('Dashboard auth check:', { user, token: token ? 'exists' : 'missing' });

    if (!token || !user) {
      console.log('No token or user found, redirecting to login');
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    // Use the user data from localStorage and fetch additional data
    const fetchUserData = async () => {
      try {
        // Set initial user data from auth
        setUserData({
          name: user.name,
          email: user.email,
          id: user.id,
          profilePicture: user.profilePicture // Include profile picture from JWT
        });
        
        // Store profile picture in localStorage for quick access
        if (user.profilePicture) {
          localStorage.setItem('userProfilePicture', user.profilePicture);
        }
        
        setAuthenticated(true);

        // Fetch additional user data from your backend
        try {
          const data = await handleApiCall(`https://skillarly-backend.onrender.com/user-data?userId=${user.id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          if (data.success) {
            // Merge the additional data with existing user data
            setUserData(prev => ({ ...prev, ...data }));
          }
        } catch (error) {
          console.warn('Failed to fetch additional user data:', error.message);
          // Continue with basic user data from auth
        }

        // Fetch recommendations with error handling
        try {
          const recData = await handleApiCall('https://skillarly-backend.onrender.com/recommendations', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: user.email, userId: user.id }),
          });
          
          setRecommendations(recData);
        } catch (error) {
          console.warn('Failed to fetch recommendations:', error.message);
          // Set default empty recommendations
          setRecommendations({ courses: [], certifications: [], jobs: [] });
        }

        // Fetch user plan info with error handling
        try {
          const info = await handleApiCall(`https://skillarly-backend.onrender.com/user-info?email=${user.email}&userId=${user.id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          setPlan(info.plan || 'Basic');
          setScrapeCount(info.monthly_scrapes || 0);
          setPreferences({ email_notifications: info.email_notifications !== false });
          if (info.plan === 'basic' && info.monthly_scrapes >= 2) {
            setUpgradeBanner(true);
          }
        } catch (error) {
          console.warn('Failed to fetch plan info:', error.message);
          // Set default values
          setPlan('Basic');
          setScrapeCount(0);
          setPreferences({ email_notifications: false });
        }

      } catch (error) {
        console.error('Error in fetchUserData:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;

    const toggle = themeToggleRef.current;
    if (!toggle) return;

    const handleClick = () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggle.textContent = isDark ? '☀️' : '🌙';
    };

    toggle.addEventListener('click', handleClick);

    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
      toggle.textContent = '☀️';
    }

    return () => {
      if (toggle) {
        toggle.removeEventListener('click', handleClick);
      }
    };
  }, [loading]);

  const saveNotificationSettings = async () => {
    const user = getUser();
    const token = getAuthToken();
    
    try {
      await handleApiCall('https://skillarly-backend.onrender.com/update-preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.id, 
          email_notifications: preferences.email_notifications 
        }),
      });
      
      alert('Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences: ' + error.message);
    }
  };

  const handleSubscribe = async () => {
    const user = getUser();
    const token = getAuthToken();
    const plan = document.querySelector('input[name="plan"]:checked')?.value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;

    if (!plan || !payment) {
      alert('Please select a plan and payment method');
      return;
    }

    try {
      const result = await handleApiCall('https://skillarly-backend.onrender.com/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.id, 
          plan, 
          paymentMethod: payment 
        }),
      });
      
      if (payment === 'stripe' && result.stripeUrl) {
        window.location.href = result.stripeUrl;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error processing subscription: ' + error.message);
    }
  };

  const handleLogout = () => {
    logout(); // Use your logout utility
    navigate('/login');
  };

  // Handle image load error
  const handleImageError = (e) => {
    console.log('Image failed to load, falling back to default');
    e.target.src = getDefaultAvatar();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader" />
        <p>Loading your profile data...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Authentication Required</h2>
          <p>You need to be authenticated to view this dashboard.</p>
          <button 
            className="linkedin-button" 
            onClick={() => navigate('/login')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ marginRight: '8px' }}>
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div id="themeToggle" ref={themeToggleRef}>🌙</div>
      <header className="dashboard-header">
        <h1>Skillarly Dashboard</h1>
      </header>

      {/* Display API errors if any */}
      {Object.keys(apiErrors).length > 0 && (
        <div className="api-errors" style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '5px' 
        }}>
          <h4>Some features may be limited due to API issues:</h4>
          <ul>
            {Object.entries(apiErrors).map(([url, error]) => (
              <li key={url} style={{ fontSize: '0.9em', color: '#c00' }}>
                {url.split('/').pop()}: {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="profile-section">
        <h2>Profile Summary</h2>
        <div className="profile-card">
          <div className="profile-content">
            <div className="profile-image-container">
              <img 
                src={getProfilePictureUrl()} 
                alt="Profile" 
                className="profile-image"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            </div>
            <div className="profile-details">
              <div className="greeting-container">
                <span className="greeting">{getTimeBasedGreeting()},</span>
                <h3 className="user-name">{userData?.name || 'LinkedIn User'}</h3>
              </div>
              <p className="user-headline">{userData?.headline || 'Professional'}</p>
              <p className="user-email">Email: {userData?.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="skills-analysis">
        <h2>Skills Analysis</h2>
        {userData?.skills?.length > 0 ? (
          <ul className="skills-list">
            {userData.skills.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : <p>No skills data available.</p>}
      </section>

      <section>
        <h2>Personalized Recommendations</h2>
        <h3>🎓 Courses</h3>
        <ul>
          {recommendations.courses.length > 0 ? 
            recommendations.courses.map((item, i) => (
              <li key={i}>
                <strong>{item.title}</strong><br />
                <span>{item.description}</span><br />
                <a href={item.link} target="_blank" rel="noreferrer">View</a>
              </li>
            )) : <li>No course recommendations available</li>
          }
        </ul>
        
        <h3>🎖️ Certifications</h3>
        <ul>
          {recommendations.certifications.length > 0 ? 
            recommendations.certifications.map((item, i) => (
              <li key={i}>
                <strong>{item.title}</strong><br />
                <span>{item.description}</span><br />
                <a href={item.link} target="_blank" rel="noreferrer">View</a>
              </li>
            )) : <li>No certification recommendations available</li>
          }
        </ul>
        
        <h3>💼 Jobs</h3>
        <ul>
          {recommendations.jobs.length > 0 ? 
            recommendations.jobs.map((item, i) => (
              <li key={i}>
                <strong>{item.title}</strong><br />
                <span>{item.description}</span><br />
                <a href={item.link} target="_blank" rel="noreferrer">View</a>
              </li>
            )) : <li>No job recommendations available</li>
          }
        </ul>
      </section>

      <section>
        <h2>Notification Preferences</h2>
        <label>
          <input 
            type="checkbox" 
            checked={preferences.email_notifications} 
            onChange={(e) => setPreferences({ email_notifications: e.target.checked })} 
          />
          Send AI recommendations to my email
        </label>
        <button onClick={saveNotificationSettings}>Save Preferences</button>
      </section>

      <section>
        <h2>Your Current Plan</h2>
        <p><strong>Plan:</strong> {plan}</p>
        {upgradeBanner && (
          <div className="banner">
            You've used all your profile scrapes for this month. Upgrade your plan to continue.
          </div>
        )}
        <p><strong>Scrapes Used:</strong> {scrapeCount}</p>
        {upgradeBanner && (
          <button onClick={() => document.getElementById('subscriptions-tab')?.scrollIntoView({ behavior: 'smooth' })}>
            Upgrade Plan
          </button>
        )}
      </section>

      <section className="subscription-plans" id="subscriptions-tab">
        <h2>Upgrade Your Plan</h2>
        <div className="plan-grid">
          {['basic', 'pro', 'premium'].map((planType) => (
            <label key={planType} className="plan-card">
              <input type="radio" name="plan" value={planType} defaultChecked={planType === 'basic'} />
              <h3>{planType.charAt(0).toUpperCase() + planType.slice(1)}</h3>
              <p>
                {planType === 'basic' ? 'Free – 2 scrapes/month' : 
                 planType === 'pro' ? '$5/month – 10 scrapes' : 
                 '$15/month – Unlimited'}
              </p>
              <div className="plan-features">
                <ul>
                  {planType === 'basic' && (
                    <>
                      <li>Basic recommendations</li>
                      <li>Basic analytics</li>
                    </>
                  )}
                  {planType === 'pro' && (
                    <>
                      <li>Advanced recommendations</li>
                      <li>Weekly insights</li>
                      <li>Priority support</li>
                    </>
                  )}
                  {planType === 'premium' && (
                    <>
                      <li>Custom recommendations</li>
                      <li>Daily insights</li>
                      <li>24/7 Premium support</li>
                      <li>Personalized career coaching</li>
                    </>
                  )}
                </ul>
              </div>
            </label>
          ))}
        </div>

        <div className="payment-methods">
          <h3>Payment Method</h3>
          <div className="payment-options">
            <label>
              <input type="radio" name="payment" value="stripe" defaultChecked /> 
              <span>Stripe</span>
            </label>
            <label>
              <input type="radio" name="payment" value="mpesa" /> 
              <span>M-Pesa</span>
            </label>
          </div>
        </div>

        <button onClick={handleSubscribe}>Subscribe</button>
        <button onClick={handleLogout} className="secondary-button">Log Out</button>
      </section>

      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} Skillarly</p>
      </footer>
    </div>
  );
};

export default Dashboard;
