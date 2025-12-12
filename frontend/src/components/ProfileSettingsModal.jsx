import React, { useState, useRef } from 'react';
import { X, User, Mail, Lock, Camera } from 'lucide-react';
import GoogleConnectionSettings from './GoogleConnectionSettings';

const ProfileSettingsModal = ({ user, isDarkMode, onClose, onUpdate, authFunctions }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Upload profile image if one was selected
      if (profileImage) {
        const { data: imageUrl, error: imageError } = await authFunctions.uploadProfileImage(profileImage);
        if (imageError) throw imageError;
        console.log('Image uploaded:', imageUrl);
      }

      // Update display name
      if (displayName !== user?.user_metadata?.display_name) {
        const { error: profileError } = await authFunctions.updateProfile({
          display_name: displayName,
        });
        if (profileError) throw profileError;
      }

      // Update email if changed
      if (email !== user?.email) {
        const { error: emailError } = await authFunctions.updateEmail(email);
        if (emailError) throw emailError;
      }
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onUpdate({ displayName, email });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { error: passwordError } = await authFunctions.updatePassword(newPassword);
      if (passwordError) throw passwordError;
      
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content profile-settings-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          background: isDarkMode ? '#2c2c2c' : '#ffffff',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div className="modal-header">
          <h2 style={{ color: isDarkMode ? '#e5e7eb' : '#1f2937' }}>Profile Settings</h2>
          <button onClick={onClose} className="modal-close">
            <X className="icon" />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${isDarkMode ? '#3f3f3f' : '#e5e7eb'}`,
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'profile' ? `2px solid #19c37d` : 'none',
                color: activeTab === 'profile' ? '#19c37d' : (isDarkMode ? '#9ca3af' : '#6b7280'),
                fontWeight: activeTab === 'profile' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '15px',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'security' ? `2px solid #19c37d` : 'none',
                color: activeTab === 'security' ? '#19c37d' : (isDarkMode ? '#9ca3af' : '#6b7280'),
                fontWeight: activeTab === 'security' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '15px',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('google')}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'google' ? `2px solid #19c37d` : 'none',
                color: activeTab === 'google' ? '#19c37d' : (isDarkMode ? '#9ca3af' : '#6b7280'),
                fontWeight: activeTab === 'google' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '15px',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              Google Account
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: '#ef4444',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(25, 195, 125, 0.1)',
              border: '1px solid #19c37d',
              borderRadius: '8px',
              color: '#19c37d',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate}>
              {/* Profile Picture */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: (imagePreview || user?.user_metadata?.avatar_url) 
                    ? `url(${imagePreview || user?.user_metadata?.avatar_url}) center/cover` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: '600',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
                onClick={() => fileInputRef.current?.click()}
                >
                  {!(imagePreview || user?.user_metadata?.avatar_url) && (user?.user_metadata?.display_name || user?.email || 'U')[0].toUpperCase()}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={20} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <p style={{
                  fontSize: '13px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  margin: 0
                }}>
                  Click to upload profile picture (max 5MB)
                </p>
              </div>

              {/* Display Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  marginBottom: '8px'
                }}>
                  <User size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${isDarkMode ? '#4d4d4f' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDarkMode ? '#40414f' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#1f2937',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#19c37d'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4d4d4f' : '#e5e7eb'}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  marginBottom: '8px'
                }}>
                  <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${isDarkMode ? '#4d4d4f' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDarkMode ? '#40414f' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#1f2937',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#19c37d'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4d4d4f' : '#e5e7eb'}
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  background: '#19c37d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.target.style.background = '#15a771';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#19c37d';
                }}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate}>
              {/* Current Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  marginBottom: '8px'
                }}>
                  <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${isDarkMode ? '#4d4d4f' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDarkMode ? '#40414f' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#1f2937',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#19c37d'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4d4d4f' : '#e5e7eb'}
                />
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  marginBottom: '8px'
                }}>
                  <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${isDarkMode ? '#4d4d4f' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDarkMode ? '#40414f' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#1f2937',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#19c37d'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4d4d4f' : '#e5e7eb'}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  marginBottom: '8px'
                }}>
                  <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${isDarkMode ? '#4d4d4f' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    background: isDarkMode ? '#40414f' : '#ffffff',
                    color: isDarkMode ? '#e5e7eb' : '#1f2937',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#19c37d'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4d4d4f' : '#e5e7eb'}
                />
              </div>

              {/* Update Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  background: '#19c37d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.target.style.background = '#15a771';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#19c37d';
                }}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Google Account Tab */}
          {activeTab === 'google' && (
            <GoogleConnectionSettings 
              apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:8000'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;




