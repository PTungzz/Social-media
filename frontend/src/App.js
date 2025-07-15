
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import SignUp from './components/SignUp';
import HomePage from './components/HomePage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode class to body element
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleLogin = (userData) => {
    // TODO: Handle login logic here
    console.log('Login successful:', userData);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleSignUp = (userData) => {
    // TODO: Handle sign up logic here
    console.log('Sign up successful:', userData);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('login');
  };

  if (isLoggedIn) {
    return (
      <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
        <HomePage 
          onLogout={handleLogout} 
          user={currentUser}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
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
