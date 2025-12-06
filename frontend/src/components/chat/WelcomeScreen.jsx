import React, { memo } from 'react';
import { Bot } from 'lucide-react';

const SUGGESTIONS = [
  { emoji: '📅', label: 'Vacation', prompt: "What are the company's vacation policies?" },
  { emoji: '💻', label: 'IT Setup', prompt: 'How do I set up my IT equipment?' },
  { emoji: '🏥', label: 'Benefits', prompt: 'What benefits do I have access to?' },
  { emoji: '👥', label: 'Team', prompt: 'Who are my team members?' }
];

const WelcomeScreen = memo(({ onSuggestionClick }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">
        <Bot size={48} />
      </div>
      <h1 className="welcome-title">How can I help you today?</h1>
      <p className="welcome-subtitle">
        I'm your onboarding assistant. Ask me anything about company policies, benefits, procedures, or getting started at the company.
      </p>

      <div className="suggestion-cards">
        {SUGGESTIONS.map((suggestion, index) => (
          <div 
            key={index}
            className="suggestion-card" 
            onClick={() => onSuggestionClick(suggestion.prompt)}
          >
            <span>{suggestion.emoji} {suggestion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

export default WelcomeScreen;
