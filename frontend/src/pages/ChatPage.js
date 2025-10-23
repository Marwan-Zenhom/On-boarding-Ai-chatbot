import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import App from '../App';

const ChatPage = () => {
  const { user, signOut, updateProfile, updateEmail, updatePassword, uploadProfileImage } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const authFunctions = {
    updateProfile,
    updateEmail,
    updatePassword,
    uploadProfileImage,
  };

  return (
    <div>
      <App user={user} onSignOut={handleSignOut} authFunctions={authFunctions} />
    </div>
  );
};

export default ChatPage;

