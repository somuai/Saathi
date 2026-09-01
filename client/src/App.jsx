import { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import Conversation from './Conversation.jsx';

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [companionName, setCompanionName] = useState('Ava');
  const [avatarStyle, setAvatarStyle] = useState('warm');

  function handleStart(name, style) {
    setCompanionName(name);
    setAvatarStyle(style);
    setPhase('conversation');
  }

  function handleStartOver() {
    window.speechSynthesis?.cancel();
    setPhase('landing');
  }

  return (
    <div className="app">
      {phase === 'landing' ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <>
          <Conversation
            companionName={companionName}
            avatarStyle={avatarStyle}
            onStartOver={handleStartOver}
          />
          <footer className="crisis-footer">
            Talking to an AI · Not a therapist · Crisis line: 988 (US) | 9152987821 (India)
          </footer>
        </>
      )}
    </div>
  );
}
