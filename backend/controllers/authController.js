import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    // If no profile exists, create one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          display_name: req.user.email,
          preferences: {}
        })
        .select()
        .single();

      if (createError) throw createError;

      return res.json({
        success: true,
        profile: newProfile
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    logger.error('Get profile error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, avatar_url, preferences } = req.body;

    // Update user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        display_name,
        avatar_url,
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get conversation count
    const { count: conversationCount, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    res.json({
      success: true,
      stats: {
        conversationCount: conversationCount || 0,
        memberSince: profile.created_at,
        userId: userId
      }
    });
  } catch (error) {
    logger.error('Get user stats error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
      message: error.message
    });
  }
};

/**
 * Sign up a new user
 * Note: Actual signup is handled by Supabase Auth
 * This is just for additional server-side logic if needed
 */
export const signup = async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign up user through Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: display_name || email
        }
      }
    });

    if (error) throw error;

    logger.logAuth('signup', data.user?.id, true, { email });

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email for verification.',
      user: data.user
    });
  } catch (error) {
    logger.logAuth('signup', null, false, { email: req.body.email, error: error.message });
    res.status(400).json({
      success: false,
      error: 'Signup failed',
      message: error.message
    });
  }
};

/**
 * Sign in a user
 * Note: Actual login is handled by Supabase Auth on the frontend
 * This is just for additional server-side logic if needed
 */
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign in user through Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    logger.logAuth('signin', data.user?.id, true, { email });

    res.json({
      success: true,
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    logger.logAuth('signin', null, false, { email: req.body.email, error: error.message });
    res.status(401).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
};

/**
 * Sign out a user
 */
export const signout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    logger.logAuth('signout', req.user?.id, true, {});

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.logAuth('signout', req.user?.id, false, { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
};



