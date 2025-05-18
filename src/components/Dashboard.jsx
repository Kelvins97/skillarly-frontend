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
  const themeToggleRef = useRef();
  const navigate = useNavigate();

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
          id: user.id
        });
        
        setAuthenticated(true);

        // Fetch additional user data from your backend
        const response = await fetch(`https://skillarly-backend.onrender.com/api/user-data?userId=${user.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Merge the additional data with existing user data
            setUserData(prev => ({ ...prev, ...data }));
          }
        }

        // Fetch recommendations
        try {
          const recResponse = await fetch('https://skillarly-backend.onrender.com/recommendations', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: user.email, userId: user.id }),
          });
          
          if (recResponse.ok) {
            const recData = await recResponse.json();
            setRecommendations(recData);
          }
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }

        // Fetch user plan info
        try {
          const planResponse = await fetch(`https://skillarly-backend.onrender.com/user-info?email=${user.email}&userId=${user.id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (planResponse.ok) {
            const info = await planResponse.json();
            setPlan(info.plan || 'Basic');
            setScrapeCount(info.monthly_scrapes || 0);
            setPreferences({ email_notifications: info.email_notifications !== false });
            if (info.plan === 'basic' && info.monthly_scrapes >= 2) {
              setUpgradeBanner(true);
            }
          }
        } catch (error) {
          console.error('Error fetching plan info:', error);
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
      const response = await fetch('https://skillarly-backend.onrender.com/update-preferences', {
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
      
      if (response.ok) {
        alert('Preferences saved!');
      } else {
        alert('Error saving preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences');
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
      const res = await fetch('https://skillarly-backend.onrender.com/subscribe', {
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
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      if (payment === 'stripe' && result.stripeUrl) {
        window.location.href = result.stripeUrl;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error processing subscription');
    }
  };

  const handleLogout = () => {
    logout(); // Use your logout utility
    navigate('/login');
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

      <section className="profile-section">
        <h2>Profile Summary</h2>
        <div className="profile-card">
          <img src={userData?.profilePicture || '/img/default-avatar.png'} alt="Profile" />
          <h3>{userData?.name || 'LinkedIn User'}</h3>
          <p>{userData?.headline || 'Professional'}</p>
          <p>Email: {userData?.email}</p>
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
          <label>
            <input type="radio" name="payment" value="stripe" defaultChecked /> Stripe
          </label>
          <label>
            <input type="radio" name="payment" value="mpesa" /> M-Pesa
          </label>
        </div>

        <button onClick={handleSubscribe}>Subscribe</button>
        <button onClick={handleLogout} className="secondary-button">Log Out</button>
      </section>

      <footer>
        <p>&copy; {new Date().getFullYear()} Skillarly</p>
      </footer>
    </div>
  );
};

export default Dashboard;
