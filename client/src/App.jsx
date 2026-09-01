import { useState } from 'react';
import LandingPage from './LandingPage.jsx';
import Conversation from './Conversation.jsx';
import Pulse from './Pulse.jsx';
import CallRoom from './CallRoom.jsx';
import AfterCall from './AfterCall.jsx';
import VideoAvatar from './VideoAvatar.jsx';
import { track } from './analytics.js';

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [session, setSession] = useState({
    companionName: 'Maya',
    avatarStyle: 'warm',
    ageId: 'unspecified',
    lossId: 'unspecified',
  });
  const [callUrl, setCallUrl] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [joinError, setJoinError] = useState('');

  async function handleStart(next) {
    setSession(next);
    setJoinError('');
    setCallUrl('');
    setConversationId('');
    setPhase('joining');
    track('session_start', { age: next.ageId, loss: next.lossId });
    try {
      const res = await fetch('/api/avatar-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageId: next.ageId, lossId: next.lossId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.conversationUrl) {
        track('call_started', { age: next.ageId, loss: next.lossId });
        setCallUrl(data.conversationUrl);
        setConversationId(data.conversationId || '');
        setPhase('call');
        return;
      }
      setJoinError(data.error || 'The video room is not available. You can still talk here.');
      setPhase('conversation');
    } catch {
      setJoinError('The video room is not available. You can still talk here.');
      setPhase('conversation');
    }
  }

  function handleWrap() {
    track('end_session');
    setCallUrl('');
    setPhase('wrap');
  }

  function handleEndCall() {
    track('end_session');
    setCallUrl('');
    setConversationId('');
    setPhase('landing');
  }

  function handleStartOver() {
    window.speechSynthesis?.cancel();
    setPhase('landing');
  }

  return (
    <div className="app">
      {phase === 'landing' ? (
        <LandingPage onStart={handleStart} onOpenPulse={() => setPhase('pulse')} />
      ) : null}
      {phase === 'pulse' ? <Pulse onBack={() => setPhase('landing')} /> : null}
      {phase === 'joining' ? (
        <div className="join-screen fade-in">
          <VideoAvatar style="warm" isSpeaking isListening={false} />
          <h1>Starting your call with Maya…</h1>
          <p>Allow camera and microphone when asked. This is a live video room.</p>
        </div>
      ) : null}
      {phase === 'call' && callUrl ? (
        <CallRoom url={callUrl} conversationId={conversationId} onWrap={handleWrap} />
      ) : null}
      {phase === 'wrap' ? (
        <AfterCall conversationId={conversationId} onDone={handleEndCall} />
      ) : null}
      {phase === 'conversation' ? (
        <>
          {joinError ? <p className="demo-note">{joinError}</p> : null}
          <Conversation
            companionName={session.companionName}
            avatarStyle="warm"
            ageId={session.ageId}
            lossId={session.lossId}
            onStartOver={handleStartOver}
          />
          <footer className="crisis-footer">
            Talking to an AI · Not a counsellor · iCall 9152987821 · Vandrevala 9999666555
          </footer>
        </>
      ) : null}
    </div>
  );
}
