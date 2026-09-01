import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

const LIMIT = 300;

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function CallRoom({ url, conversationId, onEnd, onWrap }) {
  const [left, setLeft] = useState(LIMIT);
  const wrapping = useRef(false);

  function wrap() {
    if (wrapping.current) return;
    wrapping.current = true;
    if (conversationId) {
      fetch(`/api/conversation/${conversationId}/end`, { method: 'POST' }).catch(() => {});
    }
    onWrap();
  }

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const remain = LIMIT - Math.floor((Date.now() - started) / 1000);
      setLeft(remain);
      if (remain <= 0) wrap();
    }, 250);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return undefined;
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`/api/conversation/${conversationId}`);
        const data = await res.json().catch(() => ({}));
        if (!stopped && data.status && data.status !== 'active') wrap();
      } catch {
        /* keep going */
      }
    }

    check();
    const timer = setInterval(check, 8000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const low = left <= 60;
  const pct = Math.max(0, Math.min(100, (left / LIMIT) * 100));

  return (
    <div className="call-room fade-in">
      <header className="call-bar">
        <Logo compact />
        <div className={`call-timer ${low ? 'is-low' : ''}`} aria-live="polite">
          <span className="call-timer-label">{low ? 'About a minute left' : 'Time left'}</span>
          <strong>{formatTime(left)}</strong>
          <span className="call-timer-track" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
        </div>
        <button type="button" className="btn-ghost" onClick={wrap}>
          End call
        </button>
      </header>
      <iframe
        className="call-frame"
        title="Video call with Maya"
        src={url}
        allow="camera; microphone; autoplay; display-capture; fullscreen"
      />
      <footer className="crisis-footer">
        Talking to an AI · Not a counsellor · iCall 9152987821 · Vandrevala 9999666555 · 5 minute room
      </footer>
    </div>
  );
}
