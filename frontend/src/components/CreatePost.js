import React, { useState } from 'react';
import './CreatePost.css';

const CreatePost = ({ user, onCreatePost, isDarkMode }) => {
  const [postContent, setPostContent] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (postContent.trim() || attachedFiles.length > 0) {
      onCreatePost({
        content: postContent,
        timestamp: new Date(),
        author: user,
        attachments: attachedFiles
      });
      setPostContent('');
      setAttachedFiles([]);
      setShowActions(false);
    }
  };

  const handleInputFocus = () => {
    setShowActions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding actions to allow clicking on buttons
    setTimeout(() => {
      if (!postContent.trim() && attachedFiles.length === 0) {
        setShowActions(false);
      }
    }, 200);
  };

  const handleFileUpload = (fileType, acceptedTypes) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes;
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newFiles = files.map(file => ({
        file,
        type: fileType,
        name: file.name,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      
      setAttachedFiles(prev => [...prev, ...newFiles]);
      setShowActions(true);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (prev[index].preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newFiles;
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21,15 16,10 5,21"></polyline>
          </svg>
        );
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        );
      case 'audio':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`create-post-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="create-post-header">
        <div className="user-avatar">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <img 
              src="/api/placeholder/40/40" 
              alt={user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          <div className="avatar-fallback" style={{ display: user?.avatar ? 'none' : 'flex' }}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName[0]}${user.lastName[0]}` 
              : user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
        </div>
        <div className="post-input-container">
          <textarea
            placeholder="What's on your mind..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="post-input"
            rows="3"
          />
        </div>
      </div>

      {/* File Attachments Display */}
      {attachedFiles.length > 0 && (
        <div className="attached-files">
          {attachedFiles.map((fileData, index) => (
            <div key={index} className="attached-file">
              <div className="file-info">
                <div className="file-icon">
                  {getFileIcon(fileData.type)}
                </div>
                <div className="file-details">
                  <span className="file-name">{fileData.name}</span>
                  <span className="file-size">{formatFileSize(fileData.size)}</span>
                </div>
              </div>
              {fileData.preview && (
                <div className="file-preview">
                  <img src={fileData.preview} alt="Preview" />
                </div>
              )}
              <button 
                className="remove-file-btn"
                onClick={() => removeFile(index)}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`create-post-actions ${showActions ? 'show' : ''}`}>
        <div className="media-actions">
          <button 
            className="action-btn image-btn" 
            type="button"
            onClick={() => handleFileUpload('image', 'image/*')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21,15 16,10 5,21"></polyline>
            </svg>
            Image
          </button>
          
          <button 
            className="action-btn clip-btn" 
            type="button"
            onClick={() => handleFileUpload('video', 'video/*')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            Clip
          </button>
          
          <button 
            className="action-btn attachment-btn" 
            type="button"
            onClick={() => handleFileUpload('file', '*/*')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            Attachment
          </button>
          
          <button 
            className="action-btn audio-btn" 
            type="button"
            onClick={() => handleFileUpload('audio', 'audio/*')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            Audio
          </button>
        </div>
        
        <button 
          className="post-submit-btn"
          onClick={handleSubmit}
          disabled={!postContent.trim() && attachedFiles.length === 0}
        >
          POST
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
