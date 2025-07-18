import React, { useState } from 'react';
import './Login.css';
import { findUserByEmail } from '../utils/localStorage';

const Login = ({ onNavigateSignUp, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Kiểm tra tài khoản từ local storage
    const user = findUserByEmail(email);
    
    if (user && user.password === password) {
      console.log('Login successful:', user);
      onLogin(user);
    } else {
      setError('Invalid email or password. Try admin@sociopedia.com / admin123');
    }
  };

  return (
    <div className="login-page">
      <div className="top-bar">
        <h1 className="logo">Sociopedia</h1>
      </div>
      <div className="main-content">
        <div className="login-container">
          <h2 className="welcome-title">
            Welcome to Sociopedia, the Social Media For Sociopaths!
          </h2>
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <button type="submit" className="login-button">
              LOGIN
            </button>
          </form>
          <div className="demo-accounts">
            <p className="demo-title">Demo Account:</p>
            <div className="demo-account">
              <strong>Email:</strong> admin@sociopedia.com<br />
              <strong>Password:</strong> 123456
            </div>
          </div>
          <div className="switch-mode">
            <span className="switch-link" onClick={onNavigateSignUp}>
              Don't have an account? Sign Up here.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
