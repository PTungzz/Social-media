import React from 'react';
import './UserProfileCard.css';
import { getFriends } from '../utils/localStorage';

const UserProfileCard = ({ user, onViewProfile }) => {
  // Get real user data from localStorage
  const userFriends = getFriends(user?.id);
  const profileData = {
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.name || 'User',
    friends: userFriends.length,
    location: user?.location || 'Unknown Location',
    occupation: user?.occupation || 'Unknown Occupation',
    profileViews: Math.floor(Math.random() * 20000) + 5000, // Random but consistent-looking
    postImpressions: Math.floor(Math.random() * 100000) + 10000,
    socialProfiles: [
      { name: 'Twitter', platform: 'Social Network', icon: '🐦' },
      { name: 'LinkedIn', platform: 'Network Platform', icon: '💼' }
    ]
  };

  return (
    <div className="user-profile-card">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={profileData.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <img 
              src="/api/placeholder/50/50" 
              alt={profileData.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          <div className="avatar-fallback" style={{ display: user?.profilePicture ? 'none' : 'flex' }}>
            {profileData.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{profileData.name}</h3>
          <p className="profile-friends">{profileData.friends} friends</p>
        </div>
        <button 
          className="profile-menu-btn"
          onClick={() => onViewProfile && onViewProfile(user?.id)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>

      {/* Location and Occupation */}
      <div className="profile-details">
        <div className="detail-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{profileData.location}</span>
        </div>
        <div className="detail-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <span>{profileData.occupation}</span>
        </div>
      </div>

      <div className="profile-divider"></div>

      {/* Stats Section */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-label">Who's viewed your profile</span>
          <span className="stat-value">{profileData.profileViews.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Impressions of your post</span>
          <span className="stat-value">{profileData.postImpressions.toLocaleString()}</span>
        </div>
      </div>

      <div className="profile-divider"></div>

      {/* Social Profiles Section */}
      <div className="social-profiles">
        <h4 className="social-title">Social Profiles</h4>
        {profileData.socialProfiles.map((social, index) => (
          <div key={index} className="social-item">
            <div className="social-info">
              <div className="social-icon">{social.icon}</div>
              <div className="social-details">
                <span className="social-name">{social.name}</span>
                <span className="social-platform">{social.platform}</span>
              </div>
            </div>
            <button className="social-edit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfileCard;
