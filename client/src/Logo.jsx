export default function Logo({ compact = false }) {
  return (
    <span className={`brand ${compact ? 'is-compact' : ''}`}>
      <img src="/logo.png" className="brand-mark" alt="Saathi" />
      <span className="brand-name">
        Saathi
        <small>with you</small>
      </span>
    </span>
  );
}
