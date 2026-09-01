import { useState } from 'react';

export default function Waitlist({ heading, subcopy }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not join right now.');
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err.message);
    }
  }

  if (status === 'done') {
    return (
      <p className="waitlist-thanks" role="status">
        You&apos;re on the list. We&apos;ll only email about saved sessions — nothing else.
      </p>
    );
  }

  return (
    <form className="waitlist" onSubmit={handleSubmit}>
      {heading ? <h3>{heading}</h3> : null}
      {subcopy ? <p className="waitlist-copy">{subcopy}</p> : null}
      <div className="waitlist-row">
        <label className="sr-only" htmlFor="waitlist-email">
          Email
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving…' : 'Join waitlist'}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
