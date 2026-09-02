import { useEffect, useMemo, useState } from 'react';
import Logo from './Logo.jsx';
import GitHubLink from './GitHubLink.jsx';

const PIE_COLORS = ['#2A67FF', '#FF7A45', '#6F8F71', '#C4A35A', '#7B6C9A', '#4A90A4'];

function pieBackground(themes) {
  const total = themes.reduce((n, t) => n + t.value, 0) || 1;
  let cursor = 0;
  const stops = themes.map((t, i) => {
    const start = cursor;
    cursor += (t.value / total) * 360;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}deg ${cursor}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

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

  const themes = useMemo(() => (Array.isArray(data?.themes) ? data.themes.filter((t) => t.value > 0) : []), [data]);

  return (
    <div className="after-call fade-in">
      <header className="nav">
        <Logo />
        <div className="nav-links">
          <GitHubLink />
          <button type="button" className="btn-ghost" onClick={onDone}>
            Back
          </button>
        </div>
      </header>
      <main className="after-call-body">
        <p className="eyebrow">Sitting note · DAP style</p>
        <h1>After tonight</h1>
        <p className="fine-print after-banner">
          This is an AI companion note, not a psychologist’s file and not a diagnosis. It is not stored
          here. Modelled on how counsellors write Data, Assessment, and Plan.
        </p>
        {!data && !error ? <p className="subhead">Writing the sitting note. This can take a moment.</p> : null}
        {error ? <p className="subhead">{error}</p> : null}
        {data ? (
          <>
            <section className="after-card">
              <h2>Data · what we sat with</h2>
              <p>{data.summary}</p>
            </section>
            {data.assessment ? (
              <section className="after-card">
                <h2>Assessment · not a diagnosis</h2>
                <p>{data.assessment}</p>
              </section>
            ) : null}
            {themes.length ? (
              <section className="after-card">
                <h2>What took up the sitting</h2>
                <div className="theme-row">
                  <div
                    className="theme-pie"
                    style={{ background: pieBackground(themes) }}
                    aria-hidden="true"
                  />
                  <ul className="theme-legend">
                    {themes.map((t, i) => (
                      <li key={t.label}>
                        <span style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {t.label} · {t.value}%
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
            {Array.isArray(data.patterns) && data.patterns.length ? (
              <section className="after-card">
                <h2>What may be making this heavier</h2>
                <p className="fine-print">These are not faults. They are patterns many people carry in grief.</p>
                <ol>
                  {data.patterns.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}
            {Array.isArray(data.next) && data.next.length ? (
              <section className="after-card">
                <h2>Plan · for the next hour</h2>
                <ol>
                  {data.next.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}
            <section className="after-card after-plan-grid">
              <div>
                <h2>How often this week</h2>
                <p>{data.perWeek || '2–3 short sittings this week, then weekly if it still helps.'}</p>
              </div>
              <div>
                <h2>Suggested sittings</h2>
                <p>
                  {data.sittings ||
                    'About 6–8 companion sittings over 4 weeks, then pause. A human counsellor if it stays heavy.'}
                </p>
              </div>
            </section>
            <p className="fine-print">
              Maya is an AI. If you are unsafe: iCall 9152987821 · Vandrevala 9999666555 · KIRAN
              1800-599-0019 · Tele-MANAS 14416.
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
