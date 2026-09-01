import { useEffect, useMemo, useRef, useState } from 'react';
import VideoAvatar from './VideoAvatar.jsx';
import Waitlist from './Waitlist.jsx';
import { getSystemPrompt } from './system-prompt.js';
import { getPersona, greetingFor, pickVoice } from './personas.js';
import { track } from './analytics.js';
import { demoReply } from './demo-replies.js';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const CRISIS_RE =
  /\b(suicid(?:e|al)?|kill myself|killing myself|want to die|end my life|self[- ]harm|don'?t want to (?:live|be alive))\b/i;

function formatTranscript(companionName, messages) {
  const date = new Date().toLocaleString();
  const lines = [
    `Saath session — ${date}`,
    `Companion: ${companionName}`,
    '---',
    ...messages.map((m) => `${m.role === 'assistant' ? companionName : 'You'}: ${m.content}`),
    '',
  ];
  return lines.join('\n');
}

export default function Conversation({
  companionName,
  avatarStyle,
  ageId = 'unspecified',
  lossId = 'unspecified',
  onStartOver,
}) {
  const persona = useMemo(() => getPersona(ageId, lossId), [ageId, lossId]);
  const greeting = useMemo(
    () => greetingFor(companionName),
    [companionName],
  );

  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [micSupported] = useState(() => Boolean(SpeechRecognition));
  const [showCrisis, setShowCrisis] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const logRef = useRef(null);
  const recognitionRef = useRef(null);
  const spokenGreeting = useRef(false);
  const messagesRef = useRef(messages);
  const userTurns = useRef(0);
  messagesRef.current = messages;

  useEffect(() => {
    track('session_start', { age: ageId, loss: lossId });
  }, [ageId, lossId]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = persona.age.rate;
    utter.pitch = persona.age.pitch;
    const voice = pickVoice(persona.age.voices);
    if (voice) utter.voice = voice;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  useEffect(() => {
    const playGreeting = () => {
      if (spokenGreeting.current) return;
      spokenGreeting.current = true;
      speak(greeting);
    };
    const warm = () => pickVoice(persona.age.voices);
    warm();
    window.speechSynthesis?.addEventListener?.('voiceschanged', warm);
    if (window.speechSynthesis?.getVoices?.().length) playGreeting();
    else window.speechSynthesis?.addEventListener?.('voiceschanged', playGreeting);
    const fallback = setTimeout(playGreeting, 500);
    return () => {
      clearTimeout(fallback);
      window.speechSynthesis?.removeEventListener?.('voiceschanged', warm);
      window.speechSynthesis?.removeEventListener?.('voiceschanged', playGreeting);
      window.speechSynthesis?.cancel();
    };
  }, [greeting, persona.age.voices]);

  async function sendMessage(text, inputType = 'text') {
    const content = text.trim();
    if (!content || isLoading) return;

    stopSpeaking();
    setInputText('');
    setError('');
    if (CRISIS_RE.test(content)) {
      setShowCrisis(true);
      track('crisis_shown');
    }

    const next = [...messagesRef.current, { role: 'user', content }];
    setMessages(next);
    setIsLoading(true);
    track('turn_user', { age: ageId, loss: lossId, input: inputType });
    userTurns.current += 1;
    if (userTurns.current === 3) track('session_3plus', { age: ageId, loss: lossId });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          systemPrompt: getSystemPrompt(companionName, { ageId, lossId }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'I could not reply just then.');
      const reply = data.reply?.trim();
      if (!reply) throw new Error('Empty reply.');
      setDemoMode(false);
      setMessages([...next, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch {
      const reply = demoReply(content, companionName);
      setDemoMode(true);
      setMessages([...next, { role: 'assistant', content: reply }]);
      speak(reply);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(inputText, 'text');
  }

  function toggleMic() {
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInputText(transcript);
      if (transcript.trim()) sendMessage(transcript, 'voice');
    };
    recognition.start();
  }

  function downloadSession() {
    const blob = new Blob([formatTranscript(companionName, messages)], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `griefcompanion-session-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    track('download');
  }

  const canDownload = messages.length >= 5;

  return (
    <div className={`conversation fade-in ${ageId === 'older' ? 'is-older' : ''}`}>
      <header className="convo-header">
        <div>
          <p className="eyebrow">{companionName}</p>
          <p className="convo-status">
            {isListening
              ? 'Listening…'
              : isSpeaking
                ? 'Speaking…'
                : isLoading
                  ? 'Thinking…'
                  : 'Here with you'}
          </p>
        </div>
        <div className="convo-actions">
          {canDownload ? (
            <button type="button" className="btn-ghost" onClick={downloadSession}>
              Download session
            </button>
          ) : null}
          {isSpeaking ? (
            <button type="button" className="btn-ghost" onClick={stopSpeaking}>
              Stop speaking
            </button>
          ) : null}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              track('end_session');
              setEnding(true);
            }}
          >
            End session
          </button>
        </div>
      </header>

      <div className="avatar-stage">
        <VideoAvatar
          style={avatarStyle}
          isSpeaking={isSpeaking}
          isListening={isListening}
        />
      </div>

      {demoMode ? (
        <p className="demo-note" role="status">
          Presence mode — replies are on-device until an API key is set. Still not stored.
        </p>
      ) : null}

      {showCrisis ? (
        <div className="crisis-banner" role="alert">
          If you are in crisis, please reach out now — iCall{' '}
          <a href="tel:9152987821">9152987821</a> or Vandrevala{' '}
          <a href="tel:9999666555">9999666555</a>. You don&apos;t have to face this alone.
        </div>
      ) : null}

      <div className="message-log" ref={logRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
            {m.role === 'assistant' ? <span className="bubble-name">{companionName}</span> : null}
            <p>{m.content}</p>
          </div>
        ))}
        {isLoading ? (
          <div className="bubble assistant">
            <span className="bubble-name">{companionName}</span>
            <p className="typing">…</p>
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        {micSupported ? (
          <button
            type="button"
            className={`mic-btn ${isListening ? 'is-listening' : ''}`}
            onClick={toggleMic}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop listening' : 'Speak'}
          >
            {isListening ? '●' : '🎤'}
          </button>
        ) : (
          <p className="mic-note">Voice input isn&apos;t available in this browser — you can type instead.</p>
        )}
        <label className="sr-only" htmlFor="message-input">
          Message
        </label>
        <input
          id="message-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Listening…' : 'Type something, or use the mic'}
          autoComplete="off"
          disabled={isLoading}
        />
        <button type="submit" className="btn-primary" disabled={isLoading || !inputText.trim()}>
          Send
        </button>
      </form>

      {ending ? (
        <div className="overlay fade-in" role="dialog" aria-labelledby="end-title">
          <div className="overlay-card">
            <h2 id="end-title">Would you like to save sessions in future?</h2>
            <p>
              This conversation stays on your device only. We never store what you said. Leave an
              email if you want accounts later — or download a copy for yourself.
            </p>
            {canDownload ? (
              <button type="button" className="btn-primary" onClick={downloadSession}>
                Download this session
              </button>
            ) : (
              <p className="fine-print">Download appears after a few turns, so there&apos;s something to keep.</p>
            )}
            <Waitlist heading="" subcopy="Optional — for future saved sessions only." />
            <div className="overlay-actions">
              <button type="button" className="btn-ghost" onClick={() => setEnding(false)}>
                Keep talking
              </button>
              <button type="button" className="btn-primary" onClick={onStartOver}>
                Start over
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
