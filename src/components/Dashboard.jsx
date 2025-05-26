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
      if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
      return data;
    } catch (error) {
      console.error(`API call failed:`, error);
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

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recData = await apiCall('/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: userData?.skills || [] }),
      });

      if (recData?.success) {
        setRecommendations({
          courses: recData.courses || [],
          certifications: recData.certifications || [],
          jobs: recData.jobs || []
        });
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, recommendations: 'Failed to load recommendations' }));
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    const token = getAuthToken();
    if (!token || !user) {
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
          setPlan(userInfo.plan);
          setPreferences({ email_notifications: userInfo.email_notifications });
          setUserData(prev => ({ ...prev, ...userInfo }));
        }
        const additional = await apiCall('/user-data');
        if (additional?.success) {
          setUserData(prev => ({ ...prev, ...additional }));
        }
      } catch (err) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="container">
      <div id="themeToggle" ref={themeToggleRef}>🌙</div>
      <header className="dashboard-header">
        <h1>Skillarly Dashboard</h1>
      </header>

      <section className="profile-section">
        <h2>Resume Summary</h2>
        <div className="profile-card">
          <div className="profile-content">
            <div className="profile-image-container">
              {resumeFile ? (
                <a href={URL.createObjectURL(resumeFile)} target="_blank" rel="noreferrer">View Uploaded Resume</a>
              ) : (
                <p>No resume uploaded</p>
              )}
            </div>
            <div className="profile-details">
              <div className="greeting-container">
                <span className="greeting">{getTimeBasedGreeting()},</span>
                <h3 className="user-name">{userData?.name || 'User'}</h3>
              </div>
              <p className="user-email">Email: {userData?.email}</p>
              <input type="file" onChange={handleResumeUpload} />
              {resumeUploadStatus && <p>{resumeUploadStatus}</p>}
            </div>
          </div>
        </div>
      </section>

      <section id="skills-analysis">
        <h2>Skills Analysis</h2>
        {userData?.skills?.length ? (
          <ul className="skills-list">
            {userData.skills.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : <p>No skills data found. Upload your resume to get started.</p>}
      </section>

      <section>
        <h2>Personalized Recommendations</h2>
        <button onClick={fetchRecommendations} disabled={isLoadingRecommendations}>
          {isLoadingRecommendations ? 'Loading...' : 'Generate Recommendations'}
        </button>
        <h3>🎓 Courses</h3>
        <ul>{recommendations.courses.map((item, i) => <li key={i}>{item.title || item}</li>)}</ul>
        <h3>🎖️ Certifications</h3>
        <ul>{recommendations.certifications.map((item, i) => <li key={i}>{item.title || item}</li>)}</ul>
        <h3>💼 Jobs</h3>
        <ul>{recommendations.jobs.map((item, i) => <li key={i}>{item.title} at {item.company}</li>)}</ul>
      </section>

      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} Skillarly</p>
      </footer>
    </div>
  );
};

export default Dashboard;
