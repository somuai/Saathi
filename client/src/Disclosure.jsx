export default function Disclosure({ name, onConfirm, onBack }) {
  const companion = name?.trim() || 'Maya';

  return (
    <div className="overlay fade-in" role="dialog" aria-labelledby="disclosure-title">
      <div className="overlay-card">
        <p className="eyebrow">Before you begin</p>
        <h2 id="disclosure-title">You&apos;re talking to an AI</h2>
        <p>
          {companion} is an AI companion — not a counsellor, not a human. She can&apos;t replace
          professional support, but she can listen without judgment. Be as open as you feel
          comfortable. Hindi or English is fine.
        </p>
        <p className="crisis-note">
          If you&apos;re in crisis, please call iCall at <a href="tel:9152987821">9152987821</a> or
          Vandrevala at <a href="tel:9999666555">9999666555</a>.
        </p>
        <div className="overlay-actions">
          <button type="button" className="btn-ghost" onClick={onBack}>
            Go back
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm}>
            I understand — let&apos;s begin
          </button>
        </div>
      </div>
    </div>
  );
}
