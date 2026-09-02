import path from 'path';
import { fileURLToPath } from 'url';
import { recordEvent, recordRating } from './store.js';
import { loadConfig } from './config.js';

const day = 86400000;

export function seedObservatory({ now = Date.now() } = {}) {
  const cfg = loadConfig();
  let n = 0;
  for (let d = 14; d >= 0; d -= 1) {
    const ts = now - d * day + 12 * 3600000;
    for (let v = 0; v < 6; v += 1) {
      const visitor_id = `seed_${d}_${v}`;
      const session_id = `sess_${d}_${v}`;
      const conversation_id = `c_${d}_${v}`;
      const source = v % 5 === 0 ? 'paid' : 'organic';
      recordEvent({ name: 'landing_view', visitor_id, ts, source });
      recordEvent({ name: 'unique_visit', visitor_id, ts: ts + 1000, source });
      recordEvent({ name: 'consent_viewed', visitor_id, ts: ts + 2000, source });
      recordEvent({ name: 'consent_completed', visitor_id, ts: ts + 3000, source });
      recordEvent({ name: 'disclosure_accept', visitor_id, ts: ts + 3000, source });
      if (v === 5) continue;
      recordEvent({
        name: 'tavus_session_created',
        visitor_id,
        session_id,
        conversation_id,
        ts: ts + 4000,
        source,
      });
      recordEvent({
        name: 'call_started',
        visitor_id,
        session_id,
        conversation_id,
        ts: ts + 5000,
        source,
        avatar_id: cfg.avatar_id,
        model_version: cfg.model_version,
      });
      recordEvent({
        name: 'latency_sample',
        visitor_id,
        conversation_id,
        ts: ts + 6000,
        props: { latency_ms: 900 + v * 120, stage: 'playback_start' },
      });
      const duration_s = 70 + v * 20;
      recordEvent({
        name: 'conversation_completed',
        visitor_id,
        session_id,
        conversation_id,
        ts: ts + duration_s * 1000,
        props: { duration_s, turns: 4 + v, completed: true },
      });
      const rating = [5, 4, 4, 3, 5, 2][v];
      recordRating({
        session_id,
        visitor_id,
        ts: ts + duration_s * 1000 + 2000,
        rating,
        duration_s,
        turns: 4 + v,
        conversation_id,
        source,
        completed: true,
        infra_failed: false,
        avatar_id: cfg.avatar_id,
        model_version: cfg.model_version,
      });
      n += 1;
    }
  }
  recordEvent({
    name: 'crisis_detected',
    visitor_id: 'seed_0_0',
    ts: now - 2 * day,
    props: { ok: true, category: 'self-harm-risk' },
  });
  recordEvent({
    name: 'crisis_escalated',
    visitor_id: 'seed_0_0',
    ts: now - 2 * day + 1000,
    props: { ok: true },
  });
  return { sessions: n };
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === here) {
  console.log(seedObservatory());
}
