
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import HomePage from './components/HomePage';
import UserProfile from './components/UserProfile';
import Chat from './components/Chat';
import './App.css';
import { authAPI } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize app and check for existing user session
  useEffect(() => {
    // Check for existing user session from localStorage token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setCurrentPage('home');
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Apply dark mode class to body element
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    
    // User session is already saved by Login component
  };

  const handleSignUp = (userData) => {
    console.log('SignUp successful:', userData);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    
    // User session is already saved by SignUp component
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('login');
    
    // Clear user session from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleNavigateToChat = () => {
    setCurrentPage('chat');
  };

  const handleBackFromChat = () => {
    setCurrentPage('home');
  };

  if (isLoggedIn) {
    if (currentPage === 'chat') {
      return (
        <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
          <Chat 
            onNavigateToHome={handleBackFromChat}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        </div>
      );
    }
    
    return (
      <Router>
        <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  onLogout={handleLogout} 
                  user={currentUser}
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  onNavigateToChat={handleNavigateToChat}
                />
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={<UserProfile />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      {currentPage === 'login' ? (
        <Login 
          onNavigateSignUp={() => setCurrentPage('signup')}
          onLogin={handleLogin}
        />
      ) : (
        <SignUp 
          onNavigateLogin={() => setCurrentPage('login')}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
}

export default App;