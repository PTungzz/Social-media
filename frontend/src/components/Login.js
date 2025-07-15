import React, { useState } from 'react';
import './Login.css';

const Login = ({ onNavigateSignUp, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Danh sách tài khoản mặc định
  const defaultAccounts = [
    { email: 'admin@sociopedia.com', password: '123456', name: 'Admin User' },
    { email: 'user@sociopedia.com', password: '123456', name: 'Regular User' },
    { email: 'test@sociopedia.com', password: '123456', name: 'Test User' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Kiểm tra tài khoản mặc định
    const account = defaultAccounts.find(acc => 
      acc.email === email && acc.password === password
    );
    
    if (account) {
      console.log('Login successful:', account);
      onLogin(account);
    } else {
      setError('Invalid email or password. Try admin@sociopedia.com / 123456');
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
            <p className="demo-title">Demo Accounts:</p>
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
