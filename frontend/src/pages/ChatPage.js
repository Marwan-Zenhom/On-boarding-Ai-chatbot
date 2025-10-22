import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatApp } from '../App';

const ChatPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div>
      <ChatApp user={user} onSignOut={handleSignOut} />
    </div>
  );
};

export default ChatPage;

