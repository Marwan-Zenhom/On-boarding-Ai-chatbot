import React, { useState } from 'react';
import { MoreHorizontal, Settings, LogOut } from 'lucide-react';

const UserMenu = ({ user, isDarkMode, onSignOut, onOpenSettings }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = (user?.user_metadata?.display_name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="user-section" style={{ position: 'relative', marginLeft: '-30px' }}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        style={{
          width: 'calc(100% + 8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          marginTop: '8px',
          background: showUserMenu ? 'var(--hover-color)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
          borderRadius: '8px'
        }}
        onMouseEnter={(e) => {
          if (!showUserMenu) e.currentTarget.style.background = 'var(--hover-color)';
        }}
        onMouseLeave={(e) => {
          if (!showUserMenu) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '16px',
          flexShrink: 0
        }}>
          {!avatarUrl && initial}
        </div>
        <div style={{
          flex: 1,
          minWidth: 0,
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayName}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.email}
          </div>
        </div>
        <MoreHorizontal size={18} style={{ color: '#999', flexShrink: 0 }} />
      </button>

      {showUserMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setShowUserMenu(false)}
          />
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            margin: '0 8px',
            background: isDarkMode ? '#2c2c2c' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#3f3f3f' : '#e5e7eb'}`,
            borderRadius: '12px',
            boxShadow: isDarkMode 
              ? '0 -8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
              : '0 -8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {/* User Info Header */}
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${isDarkMode ? '#3f3f3f' : '#e5e7eb'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {!avatarUrl && initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '8px' }}>
              {/* Profile Settings */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSettings();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? '#3f3f3f' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Settings size={18} />
                Profile Settings
              </button>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: isDarkMode ? '#3f3f3f' : '#e5e7eb',
                margin: '4px 0'
              }} />

              {/* Log out */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onSignOut();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: isDarkMode ? '#e5e7eb' : '#1f2937',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? '#3f3f3f' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;

