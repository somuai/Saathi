const OPTIONS = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'Slightly' },
  { value: 3, label: 'Somewhat' },
  { value: 4, label: 'Quite a bit' },
  { value: 5, label: 'Very much' },
];

export default function SupportRating({ onSubmit, submitted }) {
  if (submitted) {
    return (
      <section className="after-card">
        <h2>Thank you</h2>
        <p>That rating is the product north star. It is a count, not a transcript.</p>
      </section>
    );
  }
  return (
    <section className="after-card support-rating">
      <p className="eyebrow">North star · MSSR</p>
      <h2>Did this conversation help you feel heard or supported?</h2>
      <p className="fine-print">One tap. We do not store what you said.</p>
      <div className="rating-row" role="radiogroup" aria-label="How supported you felt">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="style-chip"
            onClick={() => onSubmit(opt.value)}
          >
            {opt.value}. {opt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
