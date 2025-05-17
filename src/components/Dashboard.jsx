import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userId = urlParams.get('userId');
    const email = urlParams.get('email');

    if (!token || !userId) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    fetch(`https://skillarly-backend.onrender.com/api/user-data?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error('Authentication failed');
        setUserData({ ...data, email: email || data.email });
        localStorage.setItem('linkedin_token', token);
        window.history.replaceState({}, document.title, '/dashboard');
        setAuthenticated(true);

        fetch('/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId }),
        })
          .then((res) => res.json())
          .then((recData) => setRecommendations(recData))
          .catch(console.error);

        fetch(`/user-info?email=${email}&userId=${userId}`)
          .then((res) => res.json())
          .then((info) => {
            setPlan(info.plan || 'Basic');
            setScrapeCount(info.monthly_scrapes || 0);
            setPreferences({ email_notifications: info.email_notifications !== false });
            if (info.plan === 'basic' && info.monthly_scrapes >= 2) setUpgradeBanner(true);
          });

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

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

  const saveNotificationSettings = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const userId = urlParams.get('userId');
    fetch('/update-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId, email_notifications: preferences.email_notifications }),
    }).then(() => alert('Preferences saved!'));
  };

  const handleSubscribe = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const userId = urlParams.get('userId');
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const res = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId, plan, paymentMethod: payment }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    if (payment === 'stripe' && result.stripeUrl) window.location.href = result.stripeUrl;
  };

  if (loading) return <div className="loading-container"><div className="loader" /><p>Loading your profile data...</p></div>;

  if (!authenticated) return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Authentication Required</h2>
        <p>You need to be authenticated to view this dashboard.</p>
        <button className="linkedin-button" onClick={() => window.location.href = 'https://skillarly-backend.onrender.com/auth/linkedin/'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ marginRight: '8px' }}>
            <path d="M19 0h-14c-2.761..." />
          </svg>
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  );

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
          <ul className="skills-list">{userData.skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
        ) : <p>No skills data available.</p>}
      </section>

      <section>
        <h2>Personalized Recommendations</h2>
        <h3>🎓 Courses</h3>
        <ul>{recommendations.courses.map((item, i) => <li key={i}><strong>{item.title}</strong><br /><span>{item.description}</span><br /><a href={item.link} target="_blank" rel="noreferrer">View</a></li>)}</ul>
        <h3>🎖️ Certifications</h3>
        <ul>{recommendations.certifications.map((item, i) => <li key={i}><strong>{item.title}</strong><br /><span>{item.description}</span><br /><a href={item.link} target="_blank" rel="noreferrer">View</a></li>)}</ul>
        <h3>💼 Jobs</h3>
        <ul>{recommendations.jobs.map((item, i) => <li key={i}><strong>{item.title}</strong><br /><span>{item.description}</span><br /><a href={item.link} target="_blank" rel="noreferrer">View</a></li>)}</ul>
      </section>

      <section>
        <h2>Notification Preferences</h2>
        <label>
          <input type="checkbox" checked={preferences.email_notifications} onChange={(e) => setPreferences({ email_notifications: e.target.checked })} />
          Send AI recommendations to my email
        </label>
        <button onClick={saveNotificationSettings}>Save Preferences</button>
      </section>

      <section>
        <h2>Your Current Plan</h2>
        <p><strong>Plan:</strong> {plan}</p>
        {upgradeBanner && <div className="banner">You've used all your profile scrapes for this month. Upgrade your plan to continue.</div>}
        <p><strong>Scrapes Used:</strong> {scrapeCount}</p>
        {upgradeBanner && <button onClick={() => document.getElementById('subscriptions-tab').scrollIntoView({ behavior: 'smooth' })}>Upgrade Plan</button>}
      </section>

      <section className="subscription-plans" id="subscriptions-tab">
        <h2>Upgrade Your Plan</h2>
        <div className="plan-grid">
          {['basic', 'pro', 'premium'].map((planType) => (
            <label key={planType} className="plan-card">
              <input type="radio" name="plan" value={planType} defaultChecked={planType === 'basic'} />
              <h3>{planType.charAt(0).toUpperCase() + planType.slice(1)}</h3>
              <p>{planType === 'basic' ? 'Free – 2 scrapes/month' : planType === 'pro' ? '$5/month – 10 scrapes' : '$15/month – Unlimited'}</p>
              <div className="plan-features">
                <ul>
                  {planType === 'basic' && (<><li>Basic recommendations</li><li>Basic analytics</li></>)}
                  {planType === 'pro' && (<><li>Advanced recommendations</li><li>Weekly insights</li><li>Priority support</li></>)}
                  {planType === 'premium' && (<><li>Custom recommendations</li><li>Daily insights</li><li>24/7 Premium support</li><li>Personalized career coaching</li></>)}
                </ul>
              </div>
            </label>
          ))}
        </div>

        <div className="payment-methods">
          <label><input type="radio" name="payment" value="stripe" defaultChecked /> Stripe</label>
          <label><input type="radio" name="payment" value="mpesa" /> M-Pesa</label>
        </div>

        <button onClick={handleSubscribe}>Subscribe</button>
        <button onClick={() => window.location.href = '/logout'} className="secondary-button">Log Out</button>
      </section>

      <footer>
        <p>&copy; {new Date().getFullYear()} Skillarly</p>
      </footer>
    </div>
  );
};

export default Dashboard;
