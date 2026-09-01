import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import Waitlist from './Waitlist.jsx';
import { getSystemPrompt } from './system-prompt.js';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const CRISIS_RE =
  /\b(suicid(?:e|al)?|kill myself|killing myself|want to die|end my life|self[- ]harm|don'?t want to (?:live|be alive))\b/i;

const PREFERRED_VOICES = ['samantha', 'karen', 'moira', 'victoria', 'allison', 'susan', 'zoe'];

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const lower = (v) => v.name.toLowerCase();
  return (
    voices.find((v) => PREFERRED_VOICES.some((n) => lower(v).includes(n))) ||
    voices.find((v) => v.lang?.startsWith('en') && v.name.toLowerCase().includes('female')) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
}

function formatTranscript(companionName, messages) {
  const date = new Date().toLocaleString();
  const lines = [
    `GriefCompanion Session — ${date}`,
    `Companion: ${companionName}`,
    '---',
    ...messages.map((m) => `${m.role === 'assistant' ? companionName : 'You'}: ${m.content}`),
    '',
  ];
  return lines.join('\n');
}

export default function Conversation({ companionName, avatarStyle, onStartOver }) {
  const greeting = useMemo(
    () =>
      `Hi. I'm ${companionName}. I'm an AI, here to listen — no judgment, no rush. What's on your mind today?`,
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

  const logRef = useRef(null);
  const recognitionRef = useRef(null);
  const spokenGreeting = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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
    utter.rate = 0.9;
    utter.pitch = 1.0;
    const voice = pickVoice();
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
    const warm = () => pickVoice();
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
  }, [greeting]);

  async function sendMessage(text) {
    const content = text.trim();
    if (!content || isLoading) return;

    stopSpeaking();
    setInputText('');
    setError('');
    if (CRISIS_RE.test(content)) setShowCrisis(true);

    const next = [...messagesRef.current, { role: 'user', content }];
    setMessages(next);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          systemPrompt: getSystemPrompt(companionName),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'I could not reply just then.');
      const reply = data.reply?.trim();
      if (!reply) throw new Error('Empty reply.');
      setMessages([...next, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch (err) {
      setError(
        err.message ||
          'Something went quiet on my side. You can try again whenever you are ready.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(inputText);
  }

  function toggleMic() {
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
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
      if (transcript.trim()) sendMessage(transcript);
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
  }

  const canDownload = messages.length >= 5;

  return (
    <div className="conversation fade-in">
      <header className="convo-header">
        <div>
          <p className="eyebrow">{companionName}</p>
          <p className="convo-status">
            {isListening ? 'Listening…' : isSpeaking ? 'Speaking…' : isLoading ? 'Thinking…' : 'Here with you'}
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
          <button type="button" className="btn-ghost" onClick={() => setEnding(true)}>
            End session
          </button>
        </div>
      </header>

      <div className="avatar-stage">
        <Avatar
          style={avatarStyle}
          isSpeaking={isSpeaking}
          isListening={isListening}
          size={200}
        />
      </div>

      {showCrisis ? (
        <div className="crisis-banner" role="alert">
          If you are in crisis, please reach out now — iCall (India){' '}
          <a href="tel:9152987821">9152987821</a> or 988 Lifeline (US) <a href="tel:988">988</a>.
          You don&apos;t have to face this alone.
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
