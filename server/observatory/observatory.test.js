import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent } from './events.js';
import { isMeaningful, percentile } from './kpi.js';
import { scanText } from './safety.js';
import { BANNED_COMPANION_LINES } from './philosophy.js';
import { DEFAULT_CONFIG } from './config.js';
import { buildBench, evaluateBench, scoreResponse } from './eval.js';
import { assignVariant, experimentPass } from './experiments.js';
import { createMemory } from './memory.js';
import { seedObservatory } from './seed.js';
import { computeKpis } from './kpi.js';

test('rejects unknown events and strips conversation text', () => {
  assert.equal(validateEvent({ name: 'not_a_real_event' }).ok, false);
  const ok = validateEvent({
    name: 'user_message_sent',
    visitor_id: 'v1',
    props: { text: 'Papa died', duration_s: 80, turns: 3 },
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.event.props.text, undefined);
  assert.equal(ok.event.props.duration_s, 80);
});

test('meaningful session uses configurable floors', () => {
  const cfg = DEFAULT_CONFIG;
  assert.equal(isMeaningful({ duration_s: 20, turns: 0, completed: true }, cfg), false);
  assert.equal(isMeaningful({ duration_s: 90, turns: 2, completed: true, infra_failed: false }, cfg), true);
  assert.equal(isMeaningful({ duration_s: 90, turns: 2, completed: true, infra_failed: true }, cfg), false);
});

test('MSSR positive ratings are Quite a bit and Very much', () => {
  assert.deepEqual(DEFAULT_CONFIG.mssr.positive_ratings, [4, 5]);
  assert.equal(DEFAULT_CONFIG.mssr.options[3], 'Quite a bit');
  assert.equal(DEFAULT_CONFIG.mssr.options[4], 'Very much');
});

test('banned companion lines are dependency/safety flags', () => {
  for (const line of BANNED_COMPANION_LINES) {
    const flags = scanText(line, 'assistant');
    assert.ok(flags.length >= 1, line);
  }
  const clean = scanText("I'm right here with you. What else wants to be said?", 'assistant');
  assert.equal(clean.length, 0);
});

test('memory store is off by default', () => {
  const result = createMemory({ user_id: 'v', fact: 'Father loved gardening' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'memory_store_off');
});

test('percentile is monotonic', () => {
  const xs = [10, 20, 30, 40, 50];
  assert.equal(percentile(xs, 50) <= percentile(xs, 95), true);
  assert.equal(percentile([], 95), 0);
});

test('synthetic grief bench has 500 items and scores 1–5', () => {
  const bench = buildBench(500);
  assert.equal(bench.length, 500);
  const situations = new Set(bench.map((b) => b.situation));
  assert.ok(situations.size >= 15);
  const scored = scoreResponse(bench[0].user, bench[0].assistant);
  for (const k of ['empathy', 'relevance', 'safety', 'grounding', 'emotional']) {
    assert.ok(scored[k] >= 1 && scored[k] <= 5);
  }
  const report = evaluateBench(bench);
  assert.equal(report.summary.n, 500);
  assert.ok(report.summary.good_n > 0);
  assert.ok(report.summary.detection.unsafe_recall > 0.5);
});

test('seeded observatory produces an MSSR between 0 and 1', () => {
  seedObservatory({ now: Date.now() });
  const kpis = computeKpis();
  assert.ok(kpis.north_star.denominator > 0);
  assert.ok(kpis.north_star.value >= 0 && kpis.north_star.value <= 1);
  assert.equal(kpis.guardrails.maximize, 'mssr');
});

test('experiments auto-fail when safety guardrails break', () => {
  const fail = experimentPass(
    {
      north_star: { value: 0.8 },
      guardrails: {
        checks: [{ name: 'harmful_response_rate', ok: false }],
      },
    },
    'onboarding_disclosure_v1',
  );
  assert.equal(fail.auto_fail, true);
  const assign = assignVariant('visitor-9', 'sitting_style_v1');
  assert.ok(['reflective', 'memory', 'mixed'].includes(assign.variant));
});
