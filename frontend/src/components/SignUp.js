import React, { useState } from 'react';
import './SignUp.css';

const SignUp = ({ onNavigateLogin, onSignUp }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    location: '',
    occupation: '',
    picture: null,
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Check if email already exists (simulate)
    const existingEmails = ['admin@sociopedia.com', 'user@sociopedia.com', 'test@sociopedia.com'];
    if (existingEmails.includes(form.email)) {
      setError('Email already exists. Please use a different email.');
      return;
    }
    
    // Simulate successful sign up
    setSuccess('Account created successfully! Redirecting to home...');
    setTimeout(() => {
      onSignUp(form);
    }, 1500);
  };

  return (
    <div className="signup-page">
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
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group half-width">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Picture</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="picture"
                  name="picture"
                  accept="image/*"
                  onChange={handleChange}
                />
                <label htmlFor="picture" className="file-upload-label">
                  {form.picture ? 'Change Picture' : 'Choose Picture'}
                </label>
              </div>
              {form.picture && (
                <div className="file-selected">
                  <span>{form.picture.name}</span>
                  <span 
                    className="edit-icon"
                    onClick={() => setForm(f => ({ ...f, picture: null }))}
                  >
                    ✏️
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <button type="submit" className="login-button">REGISTER</button>
          </form>
          <div className="switch-mode">
            <span className="switch-link" onClick={onNavigateLogin}>
              Already have an account? Login here.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
