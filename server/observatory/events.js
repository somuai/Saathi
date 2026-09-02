/** Strongly typed analytics taxonomy. Never attach raw conversation text. */

export const EVENT_NAMES = [
  'landing_view',
  'unique_visit',
  'start_click',
  'user_signed_up',
  'onboarding_started',
  'onboarding_completed',
  'consent_viewed',
  'consent_completed',
  'avatar_setup_started',
  'avatar_setup_completed',
  'conversation_requested',
  'tavus_session_created',
  'tavus_session_failed',
  'conversation_started',
  'user_message_sent',
  'avatar_response_started',
  'avatar_response_completed',
  'conversation_interrupted',
  'conversation_completed',
  'meaningful_session_completed',
  'support_rating_submitted',
  'support_rating_skipped',
  'trust_score_submitted',
  'memory_created',
  'memory_retrieved',
  'memory_corrected',
  'memory_deleted',
  'memory_unsupported_claim',
  'safety_flag_triggered',
  'crisis_detected',
  'crisis_escalated',
  'dependency_risk_detected',
  'user_returned',
  'subscription_started',
  'subscription_cancelled',
  'account_deletion_requested',
  'account_deleted',
  'privacy_deletion_requested',
  'privacy_deletion_completed',
  'privacy_deletion_failed',
  'latency_sample',
  'waitlist',
  'session_start',
  'call_started',
  'turn_user',
  'session_3plus',
  'end_session',
  'crisis_shown',
  'disclosure_accept',
  'download',
];

const NAME_SET = new Set(EVENT_NAMES);

const ALLOWED_PROPS = new Set([
  'age',
  'loss',
  'input',
  'source',
  'campaign',
  'paid',
  'duration_s',
  'turns',
  'rating',
  'trust',
  'latency_ms',
  'stage',
  'error_code',
  'flag',
  'category',
  'confidence',
  'provider',
  'ok',
  'p50',
  'p95',
  'p99',
  'infra_failed',
  'completed',
  'variant',
  'experiment_id',
  'memory_id',
  'corrected',
  'cost_usd',
  'reason',
]);

export function validateEvent(input) {
  const name = String(input?.name || '');
  if (!NAME_SET.has(name)) return { ok: false, error: 'unknown_event' };
  const props = {};
  const raw = input?.props && typeof input.props === 'object' ? input.props : {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') props[k] = v.slice(0, 80);
    else if (typeof v === 'number' && Number.isFinite(v)) props[k] = v;
    else if (typeof v === 'boolean') props[k] = v;
  }
  return {
    ok: true,
    event: {
      name,
      ts: Number(input.ts) || Date.now(),
      visitor_id: String(input.visitor_id || '').slice(0, 64) || 'anon',
      session_id: String(input.session_id || '').slice(0, 64),
      conversation_id: String(input.conversation_id || '').slice(0, 64),
      avatar_id: String(input.avatar_id || 'maya').slice(0, 32),
      model_version: String(input.model_version || '').slice(0, 64),
      tavus_version: String(input.tavus_version || '').slice(0, 64),
      source: String(input.source || props.source || 'direct').slice(0, 40),
      experiment_id: String(input.experiment_id || props.experiment_id || '').slice(0, 64),
      variant: String(input.variant || props.variant || '').slice(0, 16),
      props,
    },
  };
}
