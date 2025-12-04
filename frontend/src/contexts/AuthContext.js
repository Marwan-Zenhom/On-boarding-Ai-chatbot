import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const error = hashParams.get('error');
    
    if (error) {
      console.error('❌ OAuth error:', error, hashParams.get('error_description'));
      setLoading(false);
      return;
    }

    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session ? `User: ${session.user?.email}` : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (including OAuth callbacks)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      console.log('👤 Session:', session ? `User: ${session.user?.email}` : 'null');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle OAuth callback - clear hash from URL after processing
      if (event === 'SIGNED_IN' && window.location.hash) {
        console.log('✅ OAuth sign-in successful, cleaning URL hash');
        // Remove hash from URL for cleaner navigation
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }
      
      console.log('Signup successful:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signInWithOAuth = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;
      
      // Update local user state
      setUser(data.user);
      
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const updateEmail = async (newEmail) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update email error:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      // Remove any subfolders - upload directly to bucket root
      const filePath = fileName;

      console.log('Uploading to:', filePath);

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update user metadata with avatar URL
      const { data, error } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (error) {
        console.error('Update user metadata error:', error);
        throw error;
      }

      console.log('User metadata updated');

      // Update local user state
      setUser(data.user);

      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Upload profile image error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadProfileImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;


