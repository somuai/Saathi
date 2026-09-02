import { loadConfig, saveConfig } from './config.js';
import { PRINCIPLES, SUCCESS_MODEL } from './philosophy.js';
import { recordEvent, recordRating, listEvents, deleteVisitor } from './store.js';
import { computeKpis } from './kpi.js';
import { scanText, scanTurns } from './safety.js';
import { buildBench, evaluateBench } from './eval.js';
import { assignVariant, experimentPass, listExperiments } from './experiments.js';
import { createMemory, retrieve } from './memory.js';

function adminOk(req) {
  const key = process.env.OBSERVATORY_ADMIN_KEY;
  if (!key) return process.env.NODE_ENV !== 'production';
  return req.headers['x-observatory-key'] === key;
}

export function observatoryEventHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const result = recordEvent({
    ...req.body,
    visitor_id: req.body?.visitor_id || req.body?.props?.visitor_id,
  });
  res.status(result.ok ? 200 : 400).json(result);
}

export function ratingHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const cfg = loadConfig();
  const result = recordRating({
    ...req.body,
    avatar_id: req.body?.avatar_id || cfg.avatar_id,
    model_version: req.body?.model_version || cfg.model_version,
  });
  if (result.ok) {
    const meaningful =
      (result.rating.duration_s || 0) >= cfg.meaningful_session.min_duration_seconds &&
      result.rating.completed !== false &&
      !result.rating.infra_failed;
    if (meaningful) {
      recordEvent({
        name: 'meaningful_session_completed',
        visitor_id: result.rating.visitor_id,
        session_id: result.rating.session_id,
        conversation_id: result.rating.conversation_id,
        props: { duration_s: result.rating.duration_s, turns: result.rating.turns, rating: result.rating.rating },
      });
    }
  }
  res.status(result.ok ? 200 : 400).json(result);
}

export function kpisHandler(req, res) {
  const q = req.query || {};
  const kpis = computeKpis({
    from: q.from ? Number(q.from) : undefined,
    to: q.to ? Number(q.to) : undefined,
    avatar_id: q.avatar_id,
    model_version: q.model_version,
    source: q.source,
    cohort: q.cohort,
  });
  res.status(200).json({
    principles: PRINCIPLES,
    success_model: SUCCESS_MODEL,
    ...kpis,
  });
}

export function configGetHandler(_req, res) {
  res.status(200).json(loadConfig());
}

export function configPatchHandler(req, res) {
  if (!adminOk(req)) return res.status(401).json({ error: 'admin_key_required' });
  const next = saveConfig(req.body || {});
  res.status(200).json(next);
}

export function scanHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const text = String(req.body?.text || '');
  const role = req.body?.role === 'user' ? 'user' : 'assistant';
  const flags = scanText(text, role);
  for (const flag of flags) {
    recordEvent({
      name: flag.category === 'self-harm-risk' ? 'crisis_detected' : 'safety_flag_triggered',
      visitor_id: req.body?.visitor_id,
      session_id: req.body?.session_id,
      conversation_id: req.body?.conversation_id,
      props: { category: flag.category, flag: flag.severity },
    });
    if (flag.category === 'dependency' || flag.category === 'manipulative-anthropomorphism') {
      recordEvent({
        name: 'dependency_risk_detected',
        visitor_id: req.body?.visitor_id,
        session_id: req.body?.session_id,
        props: { category: flag.category },
      });
    }
    if (flag.category === 'self-harm-risk' && role === 'user') {
      recordEvent({
        name: 'crisis_escalated',
        visitor_id: req.body?.visitor_id,
        session_id: req.body?.session_id,
        props: { category: flag.category, ok: true },
      });
    }
  }
  res.status(200).json({ flags, stored_text: false });
}

export function evalHandler(_req, res) {
  const items = buildBench(500);
  res.status(200).json(evaluateBench(items));
}

export function experimentsHandler(req, res) {
  if (req.method === 'GET' && req.query?.assign) {
    return res.status(200).json(assignVariant(String(req.query.visitor_id || 'anon'), String(req.query.assign)));
  }
  const kpis = computeKpis();
  res.status(200).json({
    experiments: listExperiments(),
    verdicts: listExperiments().map((e) => ({ id: e.id, ...experimentPass(kpis, e.id) })),
  });
}

export function privacyDeleteHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const visitorId = String(req.body?.visitor_id || '');
  recordEvent({ name: 'privacy_deletion_requested', visitor_id: visitorId });
  const result = deleteVisitor(visitorId);
  recordEvent({
    name: result.ok ? 'privacy_deletion_completed' : 'privacy_deletion_failed',
    visitor_id: visitorId,
    props: { ok: result.ok },
  });
  res.status(result.ok ? 200 : 500).json(result);
}

export function memoryHandler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(retrieve(String(req.query?.visitor_id || ''), String(req.query?.q || '')));
  }
  const result = createMemory(req.body || {});
  res.status(result.ok ? 200 : 400).json(result);
}

export function scanTranscriptFlags(turns, meta = {}) {
  const { flags, crisis } = scanTurns(turns);
  for (const flag of flags) {
    recordEvent({
      name: 'safety_flag_triggered',
      visitor_id: meta.visitor_id,
      session_id: meta.session_id,
      conversation_id: meta.conversation_id,
      props: { category: flag.category, flag: flag.severity },
    });
  }
  if (crisis.user_disclosed) {
    recordEvent({
      name: 'crisis_detected',
      visitor_id: meta.visitor_id,
      conversation_id: meta.conversation_id,
      props: { ok: crisis.assistant_acknowledged },
    });
    if (crisis.false_negative) {
      recordEvent({
        name: 'crisis_detected',
        visitor_id: meta.visitor_id,
        conversation_id: meta.conversation_id,
        props: { ok: false, category: 'self-harm-risk' },
      });
    }
    if (crisis.assistant_acknowledged) {
      recordEvent({
        name: 'crisis_escalated',
        visitor_id: meta.visitor_id,
        conversation_id: meta.conversation_id,
        props: { ok: true },
      });
    }
  }
  return { flags, crisis, stored_text: false };
}

export function debugEventsHandler(_req, res) {
  res.status(200).json({ n: listEvents().length });
}
