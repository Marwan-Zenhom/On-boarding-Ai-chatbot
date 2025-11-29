/**
 * Google OAuth Routes
 * Handles Google account connection for Gmail and Calendar access
 */

import express from 'express';
import { google } from 'googleapis';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Generate Google OAuth URL
 * GET /api/google-auth/auth-url
 */
router.get('/auth-url', authenticateUser, (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      state: req.user.id, // Pass user ID for callback
      prompt: 'consent' // Force consent screen to ensure refresh token
    });

    logger.info('Generated Google auth URL', { userId: req.user.id });

    res.json({ 
      success: true, 
      authUrl: authUrl 
    });

  } catch (error) {
    logger.error('Failed to generate auth URL', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

/**
 * Handle OAuth callback from Google
 * GET /api/google-auth/callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId, error: oauthError } = req.query;

    // Check for OAuth errors
    if (oauthError) {
      logger.error('OAuth error from Google', { error: oauthError });
      return res.send(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Connection Failed</h1>
            <p>Failed to connect your Google account: ${oauthError}</p>
            <p>Please close this window and try again.</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    if (!userId) {
      return res.status(400).send('User ID not provided');
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    logger.info('Received Google tokens', { 
      userId, 
      hasRefreshToken: !!tokens.refresh_token,
      scopes: tokens.scope 
    });

    // Save tokens to database using admin client to bypass RLS
    const { error: dbError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope ? tokens.scope.split(' ') : [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      });

    if (dbError) {
      logger.error('Failed to save OAuth tokens', { 
        userId, 
        error: dbError.message 
      });
      throw dbError;
    }

    logger.info('Google account connected successfully', { userId });

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Google Account Connected</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .success-container {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              padding: 60px 50px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 600px;
              text-align: center;
              animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .icon-wrapper {
              width: 100px;
              height: 100px;
              margin: 0 auto 30px;
              background: linear-gradient(135deg, #10b981, #059669);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
              animation: scaleIn 0.6s ease-out 0.2s both;
            }
            @keyframes scaleIn {
              from {
                transform: scale(0);
              }
              to {
                transform: scale(1);
              }
            }
            .checkmark {
              width: 50px;
              height: 50px;
              border: 4px solid white;
              border-radius: 50%;
              position: relative;
            }
            .checkmark:after {
              content: '';
              position: absolute;
              left: 14px;
              top: 6px;
              width: 12px;
              height: 22px;
              border: solid white;
              border-width: 0 4px 4px 0;
              transform: rotate(45deg);
            }
            h1 {
              color: #10b981;
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 15px;
            }
            p {
              color: #4b5563;
              font-size: 18px;
              line-height: 1.6;
              margin-bottom: 12px;
            }
            p:last-of-type {
              margin-bottom: 30px;
            }
            .highlight {
              color: #6366f1;
              font-weight: 600;
            }
            button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 14px 40px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            button:active {
              transform: translateY(0);
            }
            .countdown {
              color: #9ca3af;
              font-size: 14px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="icon-wrapper">
              <div class="checkmark"></div>
            </div>
            <h1>Google Account Connected!</h1>
            <p>Your Google account has been successfully connected.</p>
            <p>You can now use <span class="highlight">Gmail and Calendar</span> features.</p>
            <button onclick="window.close()">Close This Window</button>
            <div class="countdown">This window will close automatically in <span id="timer">3</span> seconds</div>
          </div>
          <script>
            let seconds = 3;
            const timerElement = document.getElementById('timer');
            
            const countdown = setInterval(() => {
              seconds--;
              timerElement.textContent = seconds;
              
              if (seconds <= 0) {
                clearInterval(countdown);
                window.close();
              }
            }, 1000);
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    logger.error('OAuth callback error', { error: error.message, stack: error.stack });
    res.status(500).send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Connection Failed</h1>
          <p>An error occurred while connecting your Google account.</p>
          <p>Error: ${error.message}</p>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }
});

/**
 * Check Google connection status
 * GET /api/google-auth/status
 */
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: tokenData, error } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('provider, scope, created_at, token_expiry')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const isConnected = !!tokenData;
    const isExpired = tokenData?.token_expiry ? 
      new Date(tokenData.token_expiry) < new Date() : false;

    res.json({
      success: true,
      connected: isConnected,
      expired: isExpired,
      scopes: tokenData?.scope || [],
      connectedAt: tokenData?.created_at
    });

  } catch (error) {
    logger.error('Failed to check Google connection status', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status'
    });
  }
});

/**
 * Disconnect Google account
 * DELETE /api/google-auth/disconnect
 */
router.delete('/disconnect', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get token to revoke
    const { data: tokenData } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    // Revoke token with Google (best effort)
    if (tokenData?.access_token) {
      try {
        await oauth2Client.revokeToken(tokenData.access_token);
        logger.info('Google token revoked', { userId });
      } catch (revokeError) {
        logger.warn('Failed to revoke Google token', { 
          userId, 
          error: revokeError.message 
        });
        // Continue even if revocation fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (deleteError) {
      throw deleteError;
    }

    logger.info('Google account disconnected', { userId });

    res.json({ 
      success: true, 
      message: 'Google account disconnected successfully' 
    });

  } catch (error) {
    logger.error('Failed to disconnect Google account', { 
      error: error.message,
      userId: req.user.id 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google account'
    });
  }
});

export default router;

