import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

export default function AfterCall({ conversationId, onDone }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversationId) {
      setError('The room closed before we could write a note.');
      return;
    }
    let cancelled = false;
    fetch(`/api/conversation/${conversationId}/summary`, { method: 'POST' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.summary) setData(json);
        else setError(json.error || 'We could not write a note this time.');
      })
      .catch(() => {
        if (!cancelled) setError('We could not write a note this time.');
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return (
    <div className="after-call fade-in">
      <header className="nav">
        <Logo />
        <button type="button" className="btn-ghost" onClick={onDone}>
          Back
        </button>
      </header>
      <main className="after-call-body">
        <p className="eyebrow">After the call</p>
        <h1>A small note from tonight</h1>
        {!data && !error ? <p className="subhead">Maya is writing a short note. Nothing is stored here.</p> : null}
        {error ? <p className="subhead">{error}</p> : null}
        {data ? (
          <>
            <section className="after-card">
              <h2>What we sat with</h2>
              <p>{data.summary}</p>
            </section>
            {Array.isArray(data.next) && data.next.length ? (
              <section className="after-card">
                <h2>For the next hour</h2>
                <ol>
                  {data.next.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}
            <p className="fine-print">
              This note is not a diagnosis. Maya is an AI. If you are unsafe: iCall 9152987821 ·
              Vandrevala 9999666555 · KIRAN 1800-599-0019 · Tele-MANAS 14416.
            </p>
          </>
        ) : null}
        <button type="button" className="btn-primary" onClick={onDone}>
          Done
        </button>
      </main>
      <footer className="crisis-footer">
        Talking to an AI · Not a counsellor · iCall 9152987821 · Vandrevala 9999666555
      </footer>
    </div>
  );
}
