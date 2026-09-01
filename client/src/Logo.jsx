export default function Logo({ compact = false }) {
  return (
    <span className={`brand ${compact ? 'is-compact' : ''}`}>
      <img src="/logo.png" className="brand-mark" alt="Saath" />
      <span className="brand-name">
        Saath
        <small>with you</small>
      </span>
    </span>
  );
}
