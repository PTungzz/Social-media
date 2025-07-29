import React, { useState, useEffect } from 'react';
import './UserProfileCard.css';
import { friendsAPI } from '../services/api';

// Cache for friends count
const friendsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const UserProfileCard = ({ user, onViewProfile }) => {
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get friends count from API with caching optimization
  useEffect(() => {
    const fetchFriendsCount = async () => {
      const cacheKey = 'current_user_friends';
      const cachedData = friendsCache.get(cacheKey);
      
      // Check if we have valid cached data
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        setFriendsCount(cachedData.count);
        return;
      }

      try {
        setLoading(true);
        const response = await friendsAPI.getFriends();
        if (response.data.success) {
          const count = response.data.friends.length;
          
          // Cache the result
          friendsCache.set(cacheKey, {
            count,
            timestamp: Date.now()
          });
          
          setFriendsCount(count);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
        // Use cached data if available, even if expired
        if (cachedData) {
          setFriendsCount(cachedData.count);
        } else {
          setFriendsCount(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsCount();
  }, []);

  const profileData = {
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.name || 'User',
    friends: friendsCount,
    location: user?.location || 'Unknown Location',
    occupation: user?.occupation || 'Unknown Occupation',
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
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={profileData.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="avatar-fallback" style={{ 
            display: user?.avatar ? 'none' : 'flex' 
          }}>
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
