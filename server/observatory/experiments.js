import { loadConfig } from './config.js';

const EXPERIMENTS = [
  {
    id: 'onboarding_disclosure_v1',
    name: 'First-session trust copy',
    primary: 'mssr',
    secondary: ['funnel.rates.trust'],
    variants: ['A', 'B'],
    guardrails: ['harmful_response_rate', 'crisis_detection_recall', 'dependency_risk_events'],
  },
  {
    id: 'sitting_style_v1',
    name: 'Conversational style',
    primary: 'mssr',
    secondary: ['trust', 'conversation_completed', 'retention.healthy_d7'],
    variants: ['reflective', 'memory', 'mixed'],
    note: 'Memory variant is off while MEMORY_STORE is disabled. Never ship on time-spent.',
    guardrails: ['harmful_response_rate', 'p95_latency_ms', 'dependency_risk_events'],
  },
];

export function listExperiments() {
  return EXPERIMENTS;
}

export function assignVariant(visitorId, experimentId) {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) return { variant: 'A', experiment_id: experimentId };
  let hash = 0;
  const key = `${visitorId}:${experimentId}`;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const variant = exp.variants[hash % exp.variants.length];
  return { experiment_id: experimentId, variant };
}

export function experimentPass(kpiSlice, experimentId) {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  const cfg = loadConfig();
  if (!exp) return { ok: false, error: 'unknown_experiment' };
  const checks = kpiSlice?.guardrails?.checks || [];
  const failed = checks.filter((c) => !c.ok && exp.guardrails.includes(c.name));
  if (failed.length) {
    return { ok: false, auto_fail: true, reason: 'safety_guardrail', failed, note: 'Never approve on time spent.' };
  }
  return {
    ok: true,
    auto_fail: false,
    primary: exp.primary,
    current: kpiSlice?.north_star?.value,
    target: cfg.objective.to,
    note: 'Approve only if MSSR rises and guardrails hold. Time spent is diagnostic.',
  };
}
