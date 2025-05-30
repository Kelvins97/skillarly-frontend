import React, { useEffect, useRef, useState } from 'react';
import { getUser, getAuthToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import './style.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [recommendations, setRecommendations] = useState({ courses: [], certifications: [], jobs: [] });
  const [preferences, setPreferences] = useState({ email_notifications: false });
  const [plan, setPlan] = useState('Loading...');
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showDrip, setShowDrip] = useState(false);
  const themeToggleRef = useRef();
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Base URL for your backend
  const BACKEND_URL = 'https://skillarly-backend.onrender.com';

  // Check if drip should be shown
  useEffect(() => {
    const lastDripShown = localStorage.getItem('lastDripShown');
    const today = new Date().toISOString().split('T')[0];
    if (lastDripShown !== today && (recommendations.courses.length > 0 || recommendations.certifications.length > 0 || recommendations.jobs.length > 0)) {
      setShowDrip(true);
      localStorage.setItem('lastDripShown', today);
    }
  }, [recommendations]);

  // Get drip recommendation
  const getDripRecommendation = () => {
    return (
      recommendations.courses[0] ||
      recommendations.certifications[0] ||
      recommendations.jobs[0] ||
      null
    );
  };

  // Handle drip modal close
  const handleCloseDrip = () => {
    setShowDrip(false);
  };

  // Handle "Give Me More" with confetti effect
  const handleGiveMeMore = () => {
    // Create confetti effect
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const particleCount = 50;
        const spread = 70;
        const origin = { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 + 0.3 };
        
        // Create confetti burst
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.top = `${origin.y * 100}%`;
        confetti.style.left = `${origin.x * 100}%`;
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        document.body.appendChild(confetti);

        for (let j = 0; j < particleCount; j++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.width = '8px';
          particle.style.height = '8px';
          particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          particle.style.borderRadius = '50%';
          particle.style.animation = `fall ${1 + Math.random()}s linear forwards`;
          
          const angle = (Math.random() - 0.5) * spread * Math.PI / 180;
          const velocity = 100 + Math.random() * 100;
          const vx = Math.cos(angle) * velocity;
          const vy = Math.sin(angle) * velocity - 50;
          
          particle.style.setProperty('--vx', `${vx}px`);
          particle.style.setProperty('--vy', `${vy}px`);
          
          confetti.appendChild(particle);
        }

        setTimeout(() => {
          document.body.removeChild(confetti);
        }, 2000);
      }, i * 200);
    }

    setShowAll(true);
    setShowDrip(false);
  };

  // Drip Modal Component
  const DripModal = () => {
    const rec = getDripRecommendation();
    if (!rec || !showDrip) return null;

    const getRecommendationType = () => {
      if (recommendations.courses.includes(rec)) return { type: '🎓 Course', color: '#4ecdc4' };
      if (recommendations.certifications.includes(rec)) return { type: '🎖️ Certification', color: '#feca57' };
      if (recommendations.jobs.includes(rec)) return { type: '💼 Job', color: '#ff6b6b' };
      return { type: '✨ Recommendation', color: '#45b7d1' };
    };

    const { type, color } = getRecommendationType();

    return (
      <div className="drip-modal-overlay">
        <div className="drip-modal">
          <div className="drip-modal-header">
            <div className="daily-badge" style={{ backgroundColor: color }}>
              Daily Pick
            </div>
            <button className="drip-close-btn" onClick={handleCloseDrip}>×</button>
          </div>
          
          <div className="drip-content">
            <div className="drip-icon">🎯</div>
            <h2>Your Recommendation for Today</h2>
            <div className="rec-type-badge" style={{ color: color }}>
              {type}
            </div>
            <h3>{rec.title || rec}</h3>
            <p>{rec.description || 'Boost your career with this personalized recommendation!'}</p>
            
            {rec.link && (
              <a href={rec.link} target="_blank" rel="noreferrer" className="rec-link">
                View Details →
              </a>
            )}
          </div>
          
          <div className="drip-buttons">
            <button className="give-more-btn" onClick={handleGiveMeMore}>
              🚀 Give Me More!
            </button>
            <button className="later-btn" onClick={handleCloseDrip}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper function to make authenticated API calls
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
        console.log('Token expired or invalid, logging out');
        logout();
        navigate('/login');
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  };

  // Function to handle resume file selection
  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    uploadResume(file);
  };

  // Function to upload resume to backend
  const uploadResume = async (file) => {
    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = getAuthToken();
      const response = await fetch(`${BACKEND_URL}/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      if (result.success) {
        setResumeFile({
          filename: file.name,
          url: result.resumeUrl,
          uploadDate: new Date().toISOString()
        });
        
        setUserData(prev => ({
          ...prev,
          resumeUrl: result.resumeUrl,
          resumeFilename: file.name
        }));
        
        alert('Resume uploaded successfully!');
        setErrors(prev => ({ ...prev, resume: null }));
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setErrors(prev => ({ ...prev, resume: 'Failed to upload resume' }));
      alert(`Error uploading resume: ${error.message}`);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Function to view resume
  const viewResume = () => {
    if (userData?.resumeUrl || resumeFile?.url) {
      const resumeUrl = userData?.resumeUrl || resumeFile?.url;
      window.open(resumeUrl, '_blank');
    }
  };

  // Function to trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
        setUserData({
          name: user.name,
          email: user.email,
          id: user.id
        });
        
        setAuthenticated(true);

        try {
          const userInfo = await apiCall('/user-info');
          if (userInfo && userInfo.success) {
            setPlan(userInfo.plan || 'Basic');
            setRecommendationsCount(userInfo.weekly_recommendations || 0);
            setPreferences({ email_notifications: userInfo.email_notifications !== false });
            
            if (userInfo.plan === 'basic' && userInfo.monthly_scrapes >= 2) {
              setUpgradeBanner(true);
            }

            setUserData(prev => ({
              ...prev,
              plan: userInfo.plan,
              monthly_scrapes: userInfo.monthly_scrapes,
              email_notifications: userInfo.email_notifications,
              resumeUrl: userInfo.resumeUrl,
              resumeFilename: userInfo.resumeFilename
            }));

            if (userInfo.resumeUrl) {
              setResumeFile({
                filename: userInfo.resumeFilename || 'Resume',
                url: userInfo.resumeUrl,
                uploadDate: userInfo.resumeUploadDate
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
          setErrors(prev => ({ ...prev, userInfo: 'Failed to load user information' }));
        }

        try {
          const additionalData = await apiCall('/user-data');
          if (additionalData && additionalData.success) {
            setUserData(prev => ({ 
              ...prev, 
              ...additionalData,
              email: prev.email,
              id: prev.id
            }));
          }
        } catch (error) {
          console.error('Error fetching additional user data:', error);
          setErrors(prev => ({ ...prev, userData: 'Failed to load profile data' }));
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

  // Separate function to fetch recommendations
  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recData = await apiCall('/recommendations', {
        method: 'POST',
        body: JSON.stringify({ 
          skills: userData?.skills || []
        }),
      });
      
      if (recData && recData.success) {
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

    return () => {
      if (toggle) {
        toggle.removeEventListener('click', handleClick);
      }
    };
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
      
      if (result && result.success) {
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
      <DripModal />
      
      <div id="themeToggle" ref={themeToggleRef}>🌙</div>
      <header className="dashboard-header">
        <h1>Skillarly Dashboard</h1>
      </header>

      {/* Error Display */}
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
      <div className="resume-container">
        {resumeFile || userData?.resumeUrl ? (
          <div 
            className="resume-preview" 
            onClick={viewResume}
            style={{ cursor: 'pointer' }}
            title="Click to view resume">
            <div className="resume-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="resume-filename">
              {resumeFile?.filename || userData?.resumeFilename || 'Resume'}
            </p>
            <span className="view-resume-text">Click to view</span>
          </div>
        ) : (
          <div className="no-resume">
            <div className="resume-placeholder">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p>No resume uploaded</p>
          </div>
        )}
      </div>
      
      <div className="profile-details">
        <div className="profile-header">
          <div className="profile-info">
            <div className="greeting-container">
              <span className="greeting">{getTimeBasedGreeting()},</span>
              <h3 className="user-name">{userData?.name || 'LinkedIn User'}</h3>
            </div>
            <p className="user-headline">{userData?.headline || 'Professional'}</p>
            <p className="user-email">Email: {userData?.email}</p>
          </div>
          
          <div className="profile-image-container">
          {(userData?.profilepicture || userData?.picture || userData?.profile_picture) ? (
          <img src={userData?.profilepicture || userData?.picture || userData?.profile_picture} 
         alt={`${userData?.name || 'User'}'s profile`}
         className="profile-image"
         crossOrigin="anonymous"
         referrerPolicy="no-referrer"
         onLoad={(e) => {
         console.log('Profile image loaded successfully:', e.target.src);
        }}
        onError={(e) => {
        console.error('Profile image failed to load:', e.target.src);
        e.target.style.display = 'none';
        e.target.nextElementSibling.style.display = 'flex';
       }}
       />
       ) : null}
       <div 
      className="profile-image-fallback" 
      style={{ 
      display: (userData?.profilepicture || userData?.picture || userData?.profile_picture) ? 'none' : 'flex' 
     }}
     >
     <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
      <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
    </svg>
    </div>
    </div>

    const debugProfileImage = () => {
    console.log('Profile image debug:', {
    profilepicture: userData?.profilepicture,
    picture: userData?.picture,
    profile_picture: userData?.profile_picture,
    all_userData: userData
    });
    }
        
        <div className="resume-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleResumeUpload}
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            />
          <button 
            onClick={triggerFileUpload}
            disabled={isUploadingResume}
            className="upload-resume-btn">
            
            {isUploadingResume ? 'Uploading...' : (resumeFile || userData?.resumeUrl ? '📄 Update Resume' : '📄 Upload Resume')}
          </button>
          <p className="upload-hint">PDF, DOC, or DOCX (Max 5MB)</p>
        </div>
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
        ) : <p>No skills data available. Upload your resume to get personalized recommendations.</p>}
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

        <div className={`recommendations-content ${showAll ? 'show-all' : ''}`}>
          <h3>🎓 Courses</h3>
          <ul>
            {recommendations.courses.length > 0 ? 
              recommendations.courses.slice(0, showAll ? undefined : 3).map((item, i) => (
                <li key={i}>
                  <strong>{item.title || item}</strong><br />
                  {item.description && <span>{item.description}</span>}
                  {item.link && (
                    <>
                      <br />
                      <a href={item.link} target="_blank" rel="noreferrer">View Course</a>
                    </>
                  )}
                </li>
              )) : <li>No course recommendations available. Upload resume to see suggestions.</li>
            }
          </ul>
          
          <h3>🎖️ Certifications</h3>
          <ul>
            {recommendations.certifications.length > 0 ? 
              recommendations.certifications.slice(0, showAll ? undefined : 3).map((item, i) => (
                <li key={i}>
                  <strong>{item.title || item}</strong><br />
                  {item.description && <span>{item.description}</span>}
                  {item.link && (
                    <>
                      <br />
                      <a href={item.link} target="_blank" rel="noreferrer">View Certification</a>
                    </>
                  )}
                </li>
              )) : <li>No certification recommendations available. Upload resume to see suggestions.</li>
            }
          </ul>
          
          <h3>💼 Jobs</h3>
          <ul>
            {recommendations.jobs.length > 0 ? 
              recommendations.jobs.slice(0, showAll ? undefined : 3).map((item, i) => (
                <li key={i}>
                  <strong>{item.title}</strong> at {item.company}<br />
                  <span>{item.description}</span><br />
                  <a href={item.link} target="_blank" rel="noreferrer">View Job</a>
                </li>
              )) : <li>No job recommendations available. Upload resume to see suggestions.</li>
            }
          </ul>
        </div>

        {!showAll && (recommendations.courses.length > 3 || recommendations.certifications.length > 3 || recommendations.jobs.length > 3) && (
          <button 
            className="show-more-btn"
            onClick={() => setShowAll(true)}
          >
            Show All Recommendations
          </button>
        )}
      </section>

      <section>
        <h2>Notification Preferences</h2>
        {errors.preferences && (
          <div className="error-message">
            {errors.preferences}
          </div>
        )}
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
            You've used all your recommendations for this week. Upgrade your plan to continue.
          </div>
        )}
        <p><strong>Recommendations:</strong> {recommendationsCount}</p>
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
                {planType === 'basic' ? 'Free – 2 recommendations/week' : 
                 planType === 'pro' ? '$5/month – 10 recommendations/week' : 
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
              <span>Card</span>
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
