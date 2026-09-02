import { loadConfig } from './config.js';
import { listEvents, listRatings } from './store.js';
import { confusion } from './safety.js';

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[i];
}

function inWindow(ts, from, to) {
  return ts >= from && ts <= to;
}

export function isMeaningful(row, cfg) {
  const m = cfg.meaningful_session;
  if (m.require_completed && row.completed === false) return false;
  if (m.require_no_infra_failure && row.infra_failed) return false;
  if ((row.duration_s || 0) < m.min_duration_seconds) return false;
  if ((row.turns || 0) < m.min_user_turns && (row.duration_s || 0) < m.min_duration_seconds) return false;
  return true;
}

export function computeKpis({ from, to, cohort, avatar_id, model_version, source } = {}) {
  const cfg = loadConfig();
  const now = Date.now();
  const toTs = to || now;
  const fromTs = from || toTs - 30 * 24 * 3600 * 1000;
  const events = listEvents().filter((e) => inWindow(e.ts, fromTs, toTs));
  const ratings = listRatings().filter((r) => inWindow(r.ts, fromTs, toTs));

  const match = (row) => {
    if (avatar_id && row.avatar_id && row.avatar_id !== avatar_id) return false;
    if (model_version && row.model_version && row.model_version !== model_version) return false;
    if (source && row.source && row.source !== source) return false;
    if (cohort && row.visitor_id && !String(row.visitor_id).startsWith(cohort)) return false;
    return true;
  };

  const ev = events.filter(match);
  const rated = ratings.filter(match);
  const meaningful = rated.filter((r) => isMeaningful(r, cfg));
  const positive = meaningful.filter((r) => cfg.mssr.positive_ratings.includes(r.rating));
  const mssr = meaningful.length ? positive.length / meaningful.length : 0;

  const count = (name) => ev.filter((e) => e.name === name).length;
  const visitors = new Set(ev.map((e) => e.visitor_id));

  const landing = count('landing_view');
  const disclosure = count('consent_completed') + count('disclosure_accept');
  const firstConvo = count('call_started') + count('conversation_started');
  const meaningfulN = count('meaningful_session_completed') || meaningful.length;
  const supported = positive.length;

  const funnel = {
    discovery: landing,
    trust: disclosure,
    first_conversation: firstConvo,
    meaningful: meaningfulN,
    supported,
    rates: {
      trust: landing ? disclosure / landing : 0,
      first_conversation: visitors.size ? firstConvo / visitors.size : 0,
      meaningful: visitors.size ? meaningfulN / visitors.size : 0,
      supported: meaningfulN ? supported / meaningfulN : 0,
    },
  };

  const latencies = ev.filter((e) => e.name === 'latency_sample').map((e) => Number(e.props.latency_ms) || 0);
  const safetyFlags = ev.filter((e) => e.name === 'safety_flag_triggered');
  const crisis = ev.filter((e) => e.name === 'crisis_detected');
  const escalated = ev.filter((e) => e.name === 'crisis_escalated');
  const dependency = ev.filter((e) => e.name === 'dependency_risk_detected');
  const harmful = safetyFlags.filter((e) =>
    ['medical-advice', 'mental-health-diagnosis', 'delusion-reinforcement', 'self-harm-risk'].includes(
      e.props.category,
    ),
  );
  const responses = count('avatar_response_completed') || Math.max(1, count('turn_user'));

  const crisisRows = ev
    .filter((e) => e.name === 'crisis_detected' || e.props.category === 'self-harm-risk')
    .map((e) => ({
      true_positive: e.props.ok === true || e.name === 'crisis_escalated',
      false_negative: e.props.ok === false,
      false_positive: false,
      true_negative: false,
    }));
  const matrix = confusion(
    crisisRows.length
      ? crisisRows
      : [{ true_positive: false, false_negative: false, false_positive: false, true_negative: true }],
  );

  const tavusOk = count('tavus_session_created');
  const tavusFail = count('tavus_session_failed');
  const completed = count('conversation_completed');
  const interrupted = count('conversation_interrupted');

  const deletionsReq = count('privacy_deletion_requested') + count('account_deletion_requested');
  const deletionsOk = count('privacy_deletion_completed') + count('account_deleted');

  const memoryRefs = ev.filter((e) => e.name === 'memory_retrieved');
  const memoryCorrect = memoryRefs.filter((e) => e.props.ok && e.props.corrected !== false);
  const memoryWrong = ev.filter((e) => e.name === 'memory_unsupported_claim' || e.props.corrected === true);

  const costs = cfg.economics;
  const sessions = Math.max(1, completed || tavusOk || meaningful.length);
  const infraCost = sessions * (costs.tavus_usd_per_session + costs.llm_usd_per_session + costs.stt_tts_usd_per_session);
  const costPerSupported = supported ? infraCost / supported : infraCost;

  const retention = retentionTables(ev, toTs);
  const rolling = rollingMssr(rated.filter((r) => isMeaningful(r, cfg)), cfg, toTs);

  const ttfv = timeToFirstValue(ev, meaningful);
  const guard = evaluateGuardrails(cfg, {
    mssr,
    harmfulRate: harmful.length / responses,
    crisisRecall: matrix.recall,
    p95: percentile(latencies, 95),
    crashRate: tavusFail / Math.max(1, tavusOk + tavusFail),
    memoryAccuracy: memoryRefs.length ? memoryCorrect.length / memoryRefs.length : 1,
    deletionSuccess: deletionsReq ? deletionsOk / deletionsReq : 1,
    dependency: dependency.length,
  });

  return {
    window: { from: fromTs, to: toTs },
    north_star: {
      name: 'MSSR',
      definition: 'meaningful sessions rated Quite a bit or Very much / meaningful sessions with a rating',
      value: mssr,
      numerator: positive.length,
      denominator: meaningful.length,
      daily: rolling.daily,
      weekly: rolling.weekly,
      monthly: rolling.monthly,
      rolling_7: rolling.r7,
      rolling_30: rolling.r30,
    },
    executive: {
      mssr,
      d7_healthy_retention: retention.healthy_d7,
      safety_incident_rate: harmful.length / responses,
      p95_latency_ms: percentile(latencies, 95),
      memory_accuracy: memoryRefs.length ? memoryCorrect.length / memoryRefs.length : 1,
      cost_per_supported_session: costPerSupported,
    },
    funnel,
    activation: {
      onboarding_completion: ratio(count('onboarding_completed') + disclosure, count('onboarding_started') + disclosure),
      avatar_creation: null,
      first_conversation_rate: visitors.size ? firstConvo / visitors.size : 0,
      first_meaningful_rate: visitors.size ? meaningfulN / visitors.size : 0,
      time_to_first_value_ms: ttfv,
    },
    retention,
    quality: {
      note: 'Live quality is scored on the synthetic bench and optional chat scans. Tavus speech is not stored.',
    },
    safety: {
      harmful_response_rate: harmful.length / responses,
      crisis_events: crisis.length,
      escalation_success: crisis.length ? escalated.length / crisis.length : 1,
      dependency_risk_events: dependency.length,
      confusion: matrix,
      flags: SAFETY_BREAKDOWN(safetyFlags),
    },
    tavus: {
      session_create_success: tavusOk / Math.max(1, tavusOk + tavusFail),
      session_failures: tavusFail,
      completion_rate: (tavusOk + firstConvo) ? completed / Math.max(1, tavusOk || firstConvo) : 0,
      interruption_success: interrupted ? interrupted / Math.max(1, interrupted) : 1,
      latency: {
        p50: percentile(latencies, 50),
        p75: percentile(latencies, 75),
        p90: percentile(latencies, 90),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        n: latencies.length,
      },
    },
    trust: {
      consent_completed: disclosure,
      deletion_requests: deletionsReq,
      deletion_success: deletionsReq ? deletionsOk / deletionsReq : 1,
      trust_scores: ev.filter((e) => e.name === 'trust_score_submitted').map((e) => e.props.trust),
    },
    economics: {
      infra_cost_usd: infraCost,
      cost_per_session: infraCost / sessions,
      cost_per_supported_session: costPerSupported,
      tavus_usd: sessions * costs.tavus_usd_per_session,
      llm_usd: sessions * costs.llm_usd_per_session,
      mrr: 0,
      paid_conversion: 0,
      cac: null,
      ltv: null,
      note: 'Saathi is a no-login intern MVP. Revenue fields stay zero until billing exists.',
    },
    guardrails: guard,
    product_no_account: {
      signup: 'not in product',
      avatar_setup: 'not in product — one companion, Maya',
      memory_store: cfg.memory_store_enabled ? 'on' : 'off (privacy by default)',
    },
    visitors: visitors.size,
    config: cfg,
  };
}

function ratio(a, b) {
  return b ? a / b : 0;
}

function SAFETY_BREAKDOWN(flags) {
  const out = {};
  for (const f of flags) {
    const k = f.props.category || 'other';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function rollingMssr(meaningful, cfg, now) {
  const day = 86400000;
  const bucket = (from, to) => {
    const rows = meaningful.filter((r) => r.ts >= from && r.ts <= to);
    const pos = rows.filter((r) => cfg.mssr.positive_ratings.includes(r.rating)).length;
    return { n: rows.length, pos, rate: rows.length ? pos / rows.length : 0 };
  };
  return {
    daily: bucket(startOfDay(now), now),
    weekly: bucket(now - 7 * day, now),
    monthly: bucket(now - 30 * day, now),
    r7: bucket(now - 7 * day, now),
    r30: bucket(now - 30 * day, now),
  };
}

function retentionTables(events, now) {
  const day = 86400000;
  const first = new Map();
  const days = new Map();
  for (const e of events) {
    if (!first.has(e.visitor_id) || e.ts < first.get(e.visitor_id)) first.set(e.visitor_id, e.ts);
    const key = `${e.visitor_id}:${startOfDay(e.ts)}`;
    days.set(key, true);
  }
  const rate = (offset) => {
    let eligible = 0;
    let returned = 0;
    for (const [vid, t0] of first) {
      if (now - t0 < offset * day) continue;
      eligible += 1;
      const target = startOfDay(t0) + offset * day;
      if (days.get(`${vid}:${target}`)) returned += 1;
    }
    return { eligible, returned, rate: eligible ? returned / eligible : 0 };
  };
  const sessionsByVisitor = new Map();
  for (const e of events.filter((x) => x.name === 'conversation_completed' || x.name === 'call_started')) {
    sessionsByVisitor.set(e.visitor_id, (sessionsByVisitor.get(e.visitor_id) || 0) + 1);
  }
  let healthy = 0;
  let risky = 0;
  for (const n of sessionsByVisitor.values()) {
    if (n >= 4) risky += 1;
    else if (n >= 1) healthy += 1;
  }
  const d7 = rate(7);
  return {
    d1: rate(1),
    d7,
    d14: rate(14),
    d30: rate(30),
    weekly_returning: d7.returned,
    monthly_returning: rate(30).returned,
    healthy_d7: d7.rate,
    healthy_returners: healthy,
    potential_dependency: risky,
    note: 'Retention is not automatically positive. High frequency without a support rating is flagged as potential dependency.',
  };
}

function timeToFirstValue(events, meaningful) {
  const firstVisit = new Map();
  for (const e of events) {
    if (!firstVisit.has(e.visitor_id)) firstVisit.set(e.visitor_id, e.ts);
  }
  const deltas = [];
  for (const r of meaningful) {
    const t0 = firstVisit.get(r.visitor_id);
    if (t0) deltas.push(Math.max(0, r.ts - t0));
  }
  return {
    p50: percentile(deltas, 50),
    p75: percentile(deltas, 75),
    p90: percentile(deltas, 90),
    p95: percentile(deltas, 95),
    n: deltas.length,
  };
}

function evaluateGuardrails(cfg, s) {
  const g = cfg.guardrails;
  const checks = [
    { name: 'harmful_response_rate', ok: s.harmfulRate <= g.harmful_response_rate, value: s.harmfulRate, max: g.harmful_response_rate },
    { name: 'crisis_detection_recall', ok: s.crisisRecall >= g.crisis_detection_recall, value: s.crisisRecall, min: g.crisis_detection_recall },
    { name: 'p95_latency_ms', ok: s.p95 <= g.p95_latency_ms, value: s.p95, max: g.p95_latency_ms },
    { name: 'session_crash_rate', ok: s.crashRate <= g.session_crash_rate, value: s.crashRate, max: g.session_crash_rate },
    { name: 'memory_accuracy', ok: s.memoryAccuracy >= g.memory_accuracy, value: s.memoryAccuracy, min: g.memory_accuracy },
    { name: 'deletion_success', ok: s.deletionSuccess >= g.deletion_success, value: s.deletionSuccess, min: g.deletion_success },
  ];
  return {
    maximize: cfg.objective.maximize,
    target: cfg.objective.to,
    current_mssr: s.mssr,
    passing: checks.every((c) => c.ok),
    checks,
  };
}
