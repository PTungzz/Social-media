import React, { useState } from 'react';
import './SignUp.css';
import { saveUserToRegistry, findUserByEmail } from '../utils/localStorage';

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

  const handleSubmit = async (e) => {
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
    
    // Check if email already exists
    const existingUser = findUserByEmail(form.email);
    if (existingUser) {
      setError('Email already exists. Please use a different email.');
      return;
    }
    
    // Save user to registry
    try {
      const savedUser = await saveUserToRegistry(form);
      
      if (savedUser) {
        setSuccess('Account created successfully! Redirecting to home...');
        setTimeout(() => {
          onSignUp(savedUser);
        }, 1500);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError('Failed to create account. Please try again.');
    }
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
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group half-width">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="occupation"
                placeholder="Occupation"
                value={form.occupation}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
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
                  <div className="file-info">
                    <span>{form.picture.name}</span>
                    <span 
                      className="edit-icon"
                      onClick={() => setForm(f => ({ ...f, picture: null }))}
                    >
                      ✏️
                    </span>
                  </div>
                  {form.picture.type.startsWith('image/') && (
                    <div className="image-preview">
                      <img 
                        src={URL.createObjectURL(form.picture)} 
                        alt="Preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
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
