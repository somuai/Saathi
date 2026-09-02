import { useEffect, useMemo, useState } from 'react';
import GitHubLink from './GitHubLink.jsx';

function pct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${Math.round(Number(n) * 1000) / 10}%`;
}

function num(n, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toFixed(d);
}

function Card({ label, value, hint, warn }) {
  return (
    <article className={`obs-card ${warn ? 'is-warn' : ''}`}>
      <p className="obs-label">{label}</p>
      <p className="obs-value">{value}</p>
      {hint ? <p className="fine-print">{hint}</p> : null}
    </article>
  );
}

export default function Observatory({ onBack }) {
  const [data, setData] = useState(null);
  const [evalReport, setEvalReport] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState(30);

  useEffect(() => {
    const from = Date.now() - range * 86400000;
    fetch(`/api/observatory/kpis?from=${from}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Could not load observatory.'));
    fetch('/api/observatory/eval')
      .then((r) => r.json())
      .then(setEvalReport)
      .catch(() => {});
  }, [range]);

  const exec = data?.executive;
  const safetyWarn = exec && exec.safety_incident_rate > (data?.config?.guardrails?.harmful_response_rate || 0.001);
  const funnel = data?.funnel;
  const stages = useMemo(() => {
    if (!funnel) return [];
    return [
      ['Discovery', funnel.discovery],
      ['Trust / disclosure', funnel.trust],
      ['First conversation', funnel.first_conversation],
      ['Meaningful sitting', funnel.meaningful],
      ['Supported (4–5)', funnel.supported],
    ];
  }, [funnel]);

  return (
    <div className="observatory fade-in">
      <header className="nav">
        <span className="logo">Observatory</span>
        <div className="nav-links">
          <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Date range">
            <option value={1}>1 day</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
          </select>
          <GitHubLink />
          <button type="button" className="btn-ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </header>

      <p className="subhead">
        Optimize for helpful, safe, trusted sittings — not time spent. Counts and flags only. No
        grief text lives here. {data?.success_model}
      </p>
      {error ? <p className="demo-note">{error}</p> : null}
      {!data ? <p className="subhead">Loading product KPIs…</p> : null}

      {exec ? (
        <>
          <h2>Executive</h2>
          <div className="obs-row">
            <Card
              label="MSSR"
              value={pct(exec.mssr)}
              hint={`${data.north_star.numerator} of ${data.north_star.denominator} meaningful sittings rated Quite a bit or Very much`}
            />
            <Card label="D7 healthy retention" value={pct(exec.d7_healthy_retention)} hint="Not automatically good" />
            <Card
              label="Safety incident rate"
              value={pct(exec.safety_incident_rate)}
              hint="Beside the north star on purpose"
              warn={safetyWarn}
            />
            <Card label="P95 latency" value={`${num(exec.p95_latency_ms, 0)} ms`} />
            <Card label="Memory accuracy" value={pct(exec.memory_accuracy)} hint="Store is off unless enabled" />
            <Card label="Cost / supported sitting" value={`$${num(exec.cost_per_supported_session, 2)}`} />
          </div>

          <h2>Activation funnel</h2>
          <p className="fine-print">
            No signup and no avatar picker in this product. Trust is disclosure. Maya is the only
            companion.
          </p>
          <ol className="obs-funnel">
            {stages.map(([label, value], i) => (
              <li key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
                {i > 0 && stages[i - 1][1] ? (
                  <em>{pct(value / stages[i - 1][1])} from previous</em>
                ) : null}
              </li>
            ))}
          </ol>

          <h2>AI quality (synthetic bench, 500 sittings)</h2>
          {evalReport?.summary ? (
            <div className="obs-row">
              <Card label="Empathy" value={num(evalReport.summary.empathy, 2)} />
              <Card label="Relevance" value={pct(evalReport.summary.contextual_relevance)} />
              <Card label="Hallucination (good slice)" value={pct(evalReport.summary.hallucination_rate)} warn={evalReport.summary.hallucination_rate > 0.01} />
              <Card label="Repetition" value={pct(evalReport.summary.repetition_rate)} />
              <Card label="Unsafe (good slice)" value={pct(evalReport.summary.unsafe_response_rate)} warn={evalReport.summary.unsafe_response_rate > 0.001} />
              <Card label="Unsafe recall" value={pct(evalReport.summary.detection?.unsafe_recall)} />
            </div>
          ) : (
            <p className="fine-print">Bench loads with the dashboard.</p>
          )}

          <h2>Safety</h2>
          <div className="obs-row">
            <Card label="Harmful response rate" value={pct(data.safety.harmful_response_rate)} warn={data.safety.harmful_response_rate > 0.001} />
            <Card label="Crisis recall" value={pct(data.safety.confusion.recall)} />
            <Card label="False negatives" value={data.safety.confusion.fn} warn={data.safety.confusion.fn > 0} />
            <Card label="Escalation success" value={pct(data.safety.escalation_success)} />
            <Card label="Dependency-risk events" value={data.safety.dependency_risk_events} warn={data.safety.dependency_risk_events > 0} />
          </div>

          <h2>Tavus</h2>
          <div className="obs-row">
            <Card label="Create success" value={pct(data.tavus.session_create_success)} />
            <Card label="API failures" value={data.tavus.session_failures} />
            <Card label="P50" value={`${num(data.tavus.latency.p50, 0)} ms`} />
            <Card label="P95" value={`${num(data.tavus.latency.p95, 0)} ms`} />
            <Card label="P99" value={`${num(data.tavus.latency.p99, 0)} ms`} />
            <Card label="Completion" value={pct(data.tavus.completion_rate)} />
          </div>

          <h2>Retention</h2>
          <p className="fine-print">{data.retention.note}</p>
          <div className="obs-row">
            <Card label="D1" value={pct(data.retention.d1.rate)} />
            <Card label="D7" value={pct(data.retention.d7.rate)} />
            <Card label="D30" value={pct(data.retention.d30.rate)} />
            <Card label="Healthy returners" value={data.retention.healthy_returners} />
            <Card label="Potential dependency" value={data.retention.potential_dependency} warn={data.retention.potential_dependency > 0} />
          </div>

          <h2>Economics</h2>
          <div className="obs-row">
            <Card label="Cost / sitting" value={`$${num(data.economics.cost_per_session, 2)}`} />
            <Card label="Tavus" value={`$${num(data.economics.tavus_usd, 2)}`} />
            <Card label="LLM" value={`$${num(data.economics.llm_usd, 2)}`} />
            <Card label="MRR" value={`$${num(data.economics.mrr, 0)}`} hint={data.economics.note} />
          </div>

          <h2>Guardrail objective</h2>
          <p>
            Maximize MSSR toward {pct(data.guardrails.target)}. Current {pct(data.guardrails.current_mssr)}.
            Status: {data.guardrails.passing ? 'passing' : 'blocked by a safety or reliability check'}.
          </p>
          <ul className="obs-checks">
            {data.guardrails.checks.map((c) => (
              <li key={c.name} className={c.ok ? '' : 'is-warn'}>
                {c.name}: {typeof c.value === 'number' && c.value <= 1 ? pct(c.value) : num(c.value, 2)}{' '}
                {c.ok ? 'ok' : 'fail'}
              </li>
            ))}
          </ul>
          <p className="fine-print">
            {data.product_no_account.signup}. {data.product_no_account.avatar_setup}. Memory{' '}
            {data.product_no_account.memory_store}.
          </p>
        </>
      ) : null}
    </div>
  );
}
