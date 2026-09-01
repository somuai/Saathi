import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

export default function CallRoom({ url, conversationId, onEnd }) {
  const [remoteEnded, setRemoteEnded] = useState(false);

  useEffect(() => {
    if (!conversationId) return undefined;
    let stopped = false;

    async function check() {
      try {
        const res = await fetch(`/api/conversation/${conversationId}`);
        const data = await res.json().catch(() => ({}));
        if (!stopped && data.status && data.status !== 'active') {
          setRemoteEnded(true);
        }
      } catch {
        /* keep the iframe until we know */
      }
    }

    check();
    const timer = setInterval(check, 8000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [conversationId]);

  function handleEnd() {
    if (conversationId) {
      fetch(`/api/conversation/${conversationId}/end`, { method: 'POST' }).catch(() => {});
    }
    onEnd();
  }

  return (
    <div className="call-room fade-in">
      <header className="call-bar">
        <Logo compact />
        <p className="call-status">Saath · live video · Maya is an AI</p>
        <button type="button" className="btn-ghost" onClick={handleEnd}>
          End call
        </button>
      </header>
      {remoteEnded ? (
        <div className="call-ended" role="status">
          <h1>This video room closed.</h1>
          <p>
            Maya did not leave you. The live call ended on the video side — often a short free-plan
            limit or a dropped connection. You can sit again whenever you are ready.
          </p>
          <button type="button" className="btn-primary" onClick={handleEnd}>
            Back
          </button>
        </div>
      ) : (
        <iframe
          className="call-frame"
          title="Video call with Maya"
          src={url}
          allow="camera; microphone; autoplay; display-capture; fullscreen"
        />
      )}
      <footer className="crisis-footer">
        Talking to an AI · Not a counsellor · iCall 9152987821 · Vandrevala 9999666555
      </footer>
    </div>
  );
}
