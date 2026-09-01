import { useEffect, useState } from 'react';
import { summarizeLocal } from './analytics.js';

const TARGETS = {
  landing_view: 100,
  unique_visit: 80,
  session_start: 20,
  call_started: 10,
  session_3plus: 10,
  waitlist: 15,
};

function Bar({ value, target }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="pulse-bar" aria-hidden="true">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Pulse({ onBack }) {
  const [server, setServer] = useState(null);
  const local = summarizeLocal();

  useEffect(() => {
    fetch('/api/pulse')
      .then((r) => r.json())
      .then(setServer)
      .catch(() => setServer(null));
  }, []);

  const rows = [
    ['Landing views', 'landing_view'],
    ['Unique visitors (this device cookie)', 'unique_visit'],
    ['Sessions started', 'session_start'],
    ['Live video calls started (north star)', 'call_started'],
    ['Fallback chat ≥3 turns', 'session_3plus'],
    ['Waitlist emails', 'waitlist'],
    ['Transcript downloads', 'download'],
    ['Crisis banner shown', 'crisis_shown'],
  ];

  return (
    <div className="pulse fade-in">
      <header className="landing-header">
        <span className="logo">Product pulse</span>
        <button type="button" className="btn-ghost" onClick={onBack}>
          Back
        </button>
      </header>
      <p className="subhead">
        Counts only — never conversation text. Server totals persist in pulse.json on this
        machine. Unique visitors use a first-visit cookie on this browser.
      </p>

      <table className="pulse-table">
        <thead>
          <tr>
            <th>KPI</th>
            <th>This browser</th>
            <th>Server</th>
            <th>24h target</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key}>
              <td>{label}</td>
              <td>{local[key] || 0}</td>
              <td>{server?.[key] ?? '—'}</td>
              <td>
                {TARGETS[key] ? (
                  <>
                    {TARGETS[key]}
                    <Bar value={server?.[key] || local[key] || 0} target={TARGETS[key]} />
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pulse-grid">
        <section>
          <h3>Input mix</h3>
          <p>Voice {local.voice} · Text {local.text}</p>
          <p className="fine-print">Server: voice {server?.voice ?? '—'} · text {server?.text ?? '—'}</p>
        </section>
        <section>
          <h3>Life stage</h3>
          <p>{formatMap(local.age)}</p>
        </section>
        <section>
          <h3>Loss type (named)</h3>
          <p>{formatMap(local.loss)}</p>
        </section>
      </div>
    </div>
  );
}

function formatMap(obj) {
  const entries = Object.entries(obj || {});
  if (!entries.length) return 'No sessions yet';
  return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
}
