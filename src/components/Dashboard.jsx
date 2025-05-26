import React, { useEffect, useRef, useState } from 'react';
import { getUser, getAuthToken, logout } from '../utils/auth';
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
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploadStatus, setResumeUploadStatus] = useState(null);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const themeToggleRef = useRef();
  const navigate = useNavigate();

  const BACKEND_URL = 'https://skillarly-backend.onrender.com';

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        logout();
        navigate('/login');
        return null;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Request failed with status ${response.status}`);
      return data;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setResumeFile(file);
        setResumeUploadStatus('Resume uploaded and parsed successfully!');
        setUserData(prev => ({ ...prev, ...data.parsed }));
      } else {
        setResumeUploadStatus('Resume upload failed.');
      }
    } catch (err) {
      console.error('Resume upload failed:', err);
      setResumeUploadStatus('Error uploading resume.');
    }
  };

  useEffect(() => {
    const user = getUser();
    const token = getAuthToken();

    if (!token || !user) {
      console.log('No token or user found, redirecting to login');
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setUserData({ name: user.name, email: user.email, id: user.id });
        setAuthenticated(true);

        const userInfo = await apiCall('/user-info');
        if (userInfo?.success) {
          setPlan(userInfo.plan || 'Basic');
          setScrapeCount(userInfo.monthly_scrapes || 0);
          setPreferences({ email_notifications: userInfo.email_notifications !== false });
          
          if (userInfo.plan === 'basic' && userInfo.monthly_scrapes >= 2) {
            setUpgradeBanner(true);
          }

          setUserData(prev => ({
            ...prev,
            plan: userInfo.plan,
            monthly_scrapes: userInfo.monthly_scrapes,
            email_notifications: userInfo.email_notifications
          }));
        }

        const additionalData = await apiCall('/user-data');
        if (additionalData?.success) {
          setUserData(prev => ({ ...prev, ...additionalData }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recData = await apiCall('/recommendations', {
        method: 'POST',
        body: JSON.stringify({ skills: userData?.skills || [] }),
      });
      
      if (recData?.success) {
        setRecommendations({
          courses: recData.courses || [],
          certifications: recData.certifications || [],
          jobs: recData.jobs || []
        });
        setErrors(prev => ({ ...prev, recommendations: null }));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setErrors(prev => ({ ...prev, recommendations: 'Failed to load recommendations' }));
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

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

    return () => toggle.removeEventListener('click', handleClick);
  }, [loading]);

  const saveNotificationSettings = async () => {
    try {
      const result = await apiCall('/update-preferences', {
        method: 'POST',
        body: JSON.stringify({ 
          email_notifications: preferences.email_notifications,
          frequency: 'weekly'
        }),
      });
      
      if (result?.success) {
        alert('Preferences saved successfully!');
        setErrors(prev => ({ ...prev, preferences: null }));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrors(prev => ({ ...prev, preferences: 'Failed to save preferences' }));
      alert('Error saving preferences. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value;
    const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;

    if (!selectedPlan || !selectedPayment) {
      alert('Please select a plan and payment method');
      return;
    }

    try {
      const result = await apiCall('/subscription', {
        method: 'POST',
        body: JSON.stringify({ 
          plan: selectedPlan, 
          paymentMethod: selectedPayment 
        }),
      });
      
      if (result) {
        if (selectedPayment === 'stripe' && result.stripeUrl) {
          window.location.href = result.stripeUrl;
        } else if (result.success) {
          alert('Subscription updated successfully!');
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(`Error processing subscription: ${error.message}`);
    }
  };

  const handleLogout = () => {
    logout();
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
          <button className="linkedin-button" onClick={() => navigate('/login')}>
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

      {Object.keys(errors).length > 0 && (
        <div className="error-banner">
          {Object.entries(errors).map(([key, message]) => 
            message && (
              <div key={key} className="error-message">
                <strong>Error ({key}):</strong> {message}
              </div>
            )
          )}
        </div>
      )}

      <section className="profile-section">
        <h2>Profile Summary</h2>
        <div className="profile-card">
          <div className="profile-content">
            <div className="resume-upload-container">
              {resumeFile ? (
                <a 
                  href={URL.createObjectURL(resumeFile)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="view-resume"
                >
                  View Uploaded Resume
                </a>
              ) : (
                <p className="no-resume">No resume uploaded</p>
              )}
              <div className="upload-controls">
                <input 
                  type="file" 
                  id="resumeUpload" 
                  onChange={handleResumeUpload}
                  accept=".pdf,.doc,.docx"
                />
                <label htmlFor="resumeUpload" className="upload-button">
                  {resumeFile ? 'Replace Resume' : 'Upload Resume'}
                </label>
                {resumeUploadStatus && <p className="upload-status">{resumeUploadStatus}</p>}
              </div>
            </div>
            <div className="profile-details">
              <div className="greeting-container">
                <span className="greeting">{getTimeBasedGreeting()},</span>
                <h3 className="user-name">{userData?.name || 'User'}</h3>
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
        ) : <p>No skills data available. Upload your resume to get started.</p>}
      </section>

      <section>
        <h2>Personalized Recommendations</h2>
        {userData?.skills?.length > 0 && (
          <div className="recommendations-header">
            <button 
              onClick={fetchRecommendations} 
              disabled={isLoadingRecommendations}
              className="fetch-recommendations-btn"
            >
              {isLoadingRecommendations ? 'Loading...' : 'Generate Recommendations'}
            </button>
          </div>
        )}
        
        {errors.recommendations && (
          <div className="error-message">
            {errors.recommendations}
          </div>
        )}

        <h3>🎓 Courses</h3>
        <ul>
          {recommendations.courses.length > 0 ? 
            recommendations.courses.map((item, i) => (
              <li key={i}>
                <strong>{item.title || item}</strong><br />
                {item.description && <span>{item.description}</span>}
                {item.link && <a href={item.link} target="_blank" rel="noreferrer">View Course</a>}
              </li>
            )) : <li>No course recommendations available</li>
          }
        </ul>

        <h3>🎖️ Certifications</h3>
        <ul>
          {recommendations.certifications.length > 0 ? 
            recommendations.certifications.map((item, i) => (
              <li key={i}>
                <strong>{item.title || item}</strong><br />
                {item.description && <span>{item.description}</span>}
                {item.link && <a href={item.link} target="_blank" rel="noreferrer">View Certification</a>}
              </li>
            )) : <li>No certification recommendations available</li>
          }
        </ul>

        <h3>💼 Jobs</h3>
        <ul>
          {recommendations.jobs.length > 0 ? 
            recommendations.jobs.map((item, i) => (
              <li key={i}>
                <strong>{item.title}</strong> at {item.company}<br />
                <span>{item.description}</span><br />
                <a href={item.link} target="_blank" rel="noreferrer">View Job</a>
              </li>
            )) : <li>No job recommendations available</li>
          }
        </ul>
      </section>

      <section>
        <h2>Notification Preferences</h2>
        {errors.preferences && <div className="error-message">{errors.preferences}</div>}
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
            You've used all your profile scrapes this month. Upgrade to continue.
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
                  {planType === 'basic' && <>
                    <li>Basic recommendations</li>
                    <li>Basic analytics</li>
                  </>}
                  {planType === 'pro' && <>
                    <li>Advanced recommendations</li>
                    <li>Weekly insights</li>
                    <li>Priority support</li>
                  </>}
                  {planType === 'premium' && <>
                    <li>Custom recommendations</li>
                    <li>Daily insights</li>
                    <li>24/7 Premium support</li>
                    <li>Personalized coaching</li>
                  </>}
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
