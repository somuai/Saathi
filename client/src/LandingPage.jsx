import { useState } from 'react';
import Avatar from './Avatar.jsx';
import Disclosure from './Disclosure.jsx';
import Waitlist from './Waitlist.jsx';

const STYLES = [
  { id: 'warm', label: '🌿 Warm' },
  { id: 'cool', label: '🌊 Calm' },
  { id: 'cartoon', label: '✨ Gentle' },
];

export default function LandingPage({ onStart }) {
  const [name, setName] = useState('Ava');
  const [style, setStyle] = useState('warm');
  const [showDisclosure, setShowDisclosure] = useState(false);

  function handleBegin(event) {
    event.preventDefault();
    setShowDisclosure(true);
  }

  return (
    <div className="landing fade-in">
      <div className="glow" aria-hidden="true" />
      <header className="landing-header">
        <span className="logo">GriefCompanion</span>
        <span className="ai-pill">You&apos;ll be talking to an AI</span>
      </header>

      <main className="hero">
        <Avatar style={style} isSpeaking={false} isListening={false} size={180} />
        <h1>Someone to talk to, whenever you need.</h1>
        <p className="subhead">
          A compassionate AI companion for moments of grief and loss. No sign-up. No judgment.
          Just listening.
        </p>

        <form className="setup" onSubmit={handleBegin}>
          <label htmlFor="companion-name">Name your companion</label>
          <input
            id="companion-name"
            type="text"
            maxLength={32}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ava"
          />

          <p className="style-label">Choose a presence</p>
          <div className="style-row" role="radiogroup" aria-label="Avatar style">
            {STYLES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={style === option.id}
                className={`style-chip ${style === option.id ? 'is-active' : ''}`}
                onClick={() => setStyle(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button type="submit" className="btn-primary btn-lg">
            Start a conversation →
          </button>
          <p className="fine-print">You&apos;ll be talking to an AI. It listens and responds.</p>
        </form>
      </main>

      <section className="landing-waitlist">
        <Waitlist
          heading="Want saved sessions later?"
          subcopy="No accounts today. Leave an email if you'd like us to remember your companion in the future."
        />
      </section>

      {showDisclosure ? (
        <Disclosure
          name={name}
          onBack={() => setShowDisclosure(false)}
          onConfirm={() => onStart(name.trim() || 'Ava', style)}
        />
      ) : null}
    </div>
  );
}
