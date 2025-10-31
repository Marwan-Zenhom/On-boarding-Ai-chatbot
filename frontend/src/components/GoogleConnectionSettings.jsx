/**
 * Google Connection Settings Component
 * Allows users to connect/disconnect their Google account
 * Dark theme version matching app design
 */

import React, { useState, useEffect } from 'react';
import { Link2, Shield, Calendar, Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './GoogleConnectionSettings.css';

const GoogleConnectionSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    loading: true,
    error: null
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8000/api/google-auth/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setConnectionStatus({
        connected: data.connected,
        loading: false,
        error: null,
        details: data.connected ? {
          scopes: data.scopes,
          connectedAt: data.connectedAt
        } : null
      });
    } catch (error) {
      console.error('Failed to check Google connection:', error);
      setConnectionStatus({
        connected: false,
        loading: false,
        error: error.message
      });
    }
  };

  const handleConnect = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch('http://localhost:8000/api/google-auth/url', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth URL in popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.authUrl,
          'Google OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Check connection status after popup closes
        setTimeout(() => checkConnectionStatus(), 3000);
      }
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
      alert(`Failed to connect: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google account? You will lose access to Calendar and Gmail features.')) {
      return;
    }

    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8000/api/google-auth/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus({
          connected: false,
          loading: false,
          error: null,
          details: null
        });
        alert('Google account disconnected successfully');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert(`Failed to disconnect: ${error.message}`);
    }
  };

  return (
    <div className="google-settings-container">
      {/* Header */}
      <div className="google-settings-header">
        <div className="google-header-icon">
          <Link2 size={24} />
        </div>
        <h3>Connected Services</h3>
      </div>

      {/* Google Service Card */}
      <div className="google-service-card">
        {/* Service Info */}
        <div className="google-service-info">
          <div className="google-service-logo">
            <div className="google-logo-gradient">
              G
            </div>
          </div>
          
          <div className="google-service-details">
            <h4>Google Calendar & Gmail</h4>
            <p>Allow the AI agent to check your calendar, book events, and send emails on your behalf</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="google-connection-status">
          {connectionStatus.loading ? (
            <div className="status-badge status-loading">
              <Loader size={16} className="spinning" />
              <span>Checking...</span>
            </div>
          ) : connectionStatus.connected ? (
            <div className="status-badge status-connected">
              <CheckCircle size={16} />
              <span>Connected</span>
            </div>
          ) : (
            <div className="status-badge status-disconnected">
              <AlertCircle size={16} />
              <span>Not connected</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="google-action-section">
          {connectionStatus.connected ? (
            <>
              {connectionStatus.details && (
                <div className="google-connection-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>Calendar access enabled</span>
                  </div>
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>Gmail access enabled</span>
                  </div>
                  <div className="detail-item detail-date">
                    Connected: {new Date(connectionStatus.details.connectedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
              <button 
                className="google-btn google-btn-disconnect"
                onClick={handleDisconnect}
              >
                Disconnect Google Account
              </button>
            </>
          ) : (
            <button 
              className="google-btn google-btn-connect"
              onClick={handleConnect}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google Account
            </button>
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="google-features-info">
        <div className="features-header">
          <Shield size={20} />
          <h4>What can the AI agent do?</h4>
        </div>
        
        <ul className="features-list">
          <li>
            <CheckCircle size={16} />
            <span>Check your calendar for availability</span>
          </li>
          <li>
            <CheckCircle size={16} />
            <span>Book vacation and meetings on your calendar</span>
          </li>
          <li>
            <CheckCircle size={16} />
            <span>Send emails to supervisors and team members</span>
          </li>
          <li>
            <CheckCircle size={16} />
            <span>Execute multi-step workflows (e.g., vacation requests)</span>
          </li>
        </ul>

        <div className="security-note">
          <Shield size={16} />
          <div>
            <strong>Security:</strong> Your credentials are stored securely, and all actions require your approval.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleConnectionSettings;
