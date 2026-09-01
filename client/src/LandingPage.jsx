import { useEffect, useState } from 'react';
import VideoAvatar from './VideoAvatar.jsx';
import Disclosure from './Disclosure.jsx';
import Waitlist from './Waitlist.jsx';
import Logo from './Logo.jsx';
import { AGES, LOSSES } from './personas.js';
import { DEFAULT_NAME } from './companions.js';
import { track } from './analytics.js';

export default function LandingPage({ onStart, onOpenPulse }) {
  const [ageId, setAgeId] = useState('unspecified');
  const [lossId, setLossId] = useState('unspecified');
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    track('landing_view');
  }, []);

  function handleBegin(event) {
    event.preventDefault();
    track('start_click', { age: ageId, loss: lossId });
    setShowDisclosure(true);
  }

  function handleConfirm() {
    track('disclosure_accept', { age: ageId, loss: lossId });
    onStart({
      companionName: DEFAULT_NAME,
      avatarStyle: 'warm',
      ageId,
      lossId,
    });
  }

  return (
    <div className="landing fade-in" data-sense="calm">
      <div className="flute" aria-hidden="true" />

      <header className="nav">
        <Logo />
        <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#who">Who it is for</a>
          <button type="button" className="btn-ghost" onClick={onOpenPulse}>
            Pulse
          </button>
          <a href="#start" className="btn-primary">
            Start a call
          </a>
        </nav>
      </header>

      <main>
        <section className="hero-grid" id="start">
          <VideoAvatar style="warm" isSpeaking isListening={false} />
          <div className="hero-copy">
            <p className="eyebrow">Saath · a video call with Maya · Hindi + English</p>
            <h1>Someone to talk to, whenever you need.</h1>
            <p className="subhead">
              Grief is isolating. Friends get tired. Counsellors have a queue. Maya is one AI
              companion — a face on a video call, late at night, without waking the house.
            </p>
            <ul className="trust">
              <li>No sign-up</li>
              <li>Disclosed as AI</li>
              <li>Nothing you say is stored here</li>
              <li>iCall 9152987821</li>
            </ul>

            <form className="setup" onSubmit={handleBegin}>
              <p className="style-label">Optional — what is tonight about?</p>
              <div className="style-row" role="radiogroup" aria-label="Loss type">
                {LOSSES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={lossId === option.id}
                    className={`style-chip ${lossId === option.id ? 'is-active' : ''}`}
                    onClick={() => setLossId(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="style-label">Optional — Maya adapts for child, teen, adult, or senior</p>
              <div className="style-row" role="radiogroup" aria-label="Life stage">
                {AGES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={ageId === option.id}
                    className={`style-chip ${ageId === option.id ? 'is-active' : ''}`}
                    onClick={() => setAgeId(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button type="submit" className="btn-primary btn-lg">
                Join a video call with Maya
              </button>
              <p className="fine-print">
                Opens a live video call in this page with Maya (Tavus PAL). Hindi or English.
                Maya is an AI companion, not a replacement for a human counsellor.
              </p>
            </form>
          </div>
        </section>

        <section className="how" id="how">
          <h2>How a session works</h2>
          <ol className="steps">
            <li>
              <strong>01 · Name the weight</strong>
              <span>Optionally say the kind of loss. Skip is fine.</span>
            </li>
            <li>
              <strong>02 · Hear that she is AI</strong>
              <span>Disclosure first. Crisis lines stay visible.</span>
            </li>
            <li>
              <strong>03 · A video call</strong>
              <span>Maya joins a Tavus room. Speak as you would on a call.</span>
            </li>
          </ol>
        </section>

        <section className="audience" id="who">
          <h2>One companion. Different nights.</h2>
          <p className="section-lead">
            People do not pick a new face the way they pick a filter. They pick what they need to
            say. Maya stays. The topic changes.
          </p>
          <div className="audience-grid">
            <article>
              <h3>20s–30s</h3>
              <p>
                First funeral, a breakup, a pet. You do not want to wake your parents. WhatsApp is
                not the place.
              </p>
            </article>
            <article>
              <h3>30s–50s</h3>
              <p>
                A parent, a marriage, a job in another city. Private counselling is ₹2,000–₹4,000
                and weeks away.
              </p>
            </article>
            <article>
              <h3>50s+</h3>
              <p>A quieter house. A child can open the link. No account, no app store.</p>
            </article>
          </div>
        </section>

        <section className="landing-waitlist" id="waitlist">
          <Waitlist
            heading="Want saved sessions later?"
            subcopy="No accounts today. Leave an email if you'd like us to remember Maya in the future."
          />
        </section>
      </main>

      <footer className="site-footer">
        <Logo compact />
        <p>Talking to an AI · Not a counsellor · iCall 9152987821 · Vandrevala 9999666555</p>
      </footer>

      {showDisclosure ? (
        <Disclosure name={DEFAULT_NAME} onBack={() => setShowDisclosure(false)} onConfirm={handleConfirm} />
      ) : null}
    </div>
  );
}
