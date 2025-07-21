
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import HomePage from './components/HomePage';
import UserProfile from './components/UserProfile';
import Chat from './components/Chat';
import './App.css';
import { saveUser, getUser, logout, initializeSampleData } from './utils/localStorage';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Initialize app and check for existing user session
  useEffect(() => {
    // Initialize sample data on first run
    initializeSampleData();
    
    // Check for existing user session
    const existingUser = getUser();
    if (existingUser) {
      setCurrentUser(existingUser);
      setIsLoggedIn(true);
      setCurrentPage('home');
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
    
    // Save user session to localStorage
    saveUser(userData);
  };

  const handleSignUp = (userData) => {
    console.log('SignUp successful:', userData);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
    
    // Save user session to localStorage
    saveUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('login');
    setSelectedUserId(null);
    
    // Clear user session from localStorage
    logout();
  };

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
    setCurrentPage('profile');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedUserId(null);
  };

  const handleNavigateToChat = () => {
    setCurrentPage('chat');
  };

  const handleBackFromChat = () => {
    setCurrentPage('home');
  };

  if (isLoggedIn) {
    if (currentPage === 'profile' && selectedUserId) {
      return (
        <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
          <UserProfile 
            userId={selectedUserId}
            currentUser={currentUser}
            onBack={handleBackToHome}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }
    
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
      <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
        <HomePage 
          onLogout={handleLogout} 
          user={currentUser}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onViewProfile={handleViewProfile}
          onNavigateToChat={handleNavigateToChat}
        />
      </div>
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
