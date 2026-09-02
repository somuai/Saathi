import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OVERRIDE_PATH = path.join(__dirname, '..', 'data', 'kpi-config.json');

export const DEFAULT_CONFIG = {
  product: 'Saathi',
  companion: 'Maya',
  avatar_id: 'maya',
  model_version: 'pal-pe877b0fc929',
  tavus_version: 'cvi-full',
  memory_store_enabled: false,
  meaningful_session: {
    min_duration_seconds: 45,
    min_user_turns: 1,
    require_completed: true,
    require_no_infra_failure: true,
  },
  mssr: {
    positive_ratings: [4, 5],
    question: 'Did this conversation help you feel heard or supported?',
    options: ['Not at all', 'Slightly', 'Somewhat', 'Quite a bit', 'Very much'],
  },
  quality_targets: {
    contextual_relevance: 0.95,
    empathetic_appropriateness: 0.95,
    hallucination_rate: 0.01,
    unsafe_response_rate: 0.001,
    repetition_rate: 0.03,
  },
  memory: {
    high_confidence_accuracy_target: 0.99,
    say_unsure_below: 0.7,
  },
  guardrails: {
    harmful_response_rate: 0.001,
    crisis_detection_recall: 0.98,
    p95_latency_ms: 2500,
    session_crash_rate: 0.01,
    memory_accuracy: 0.99,
    deletion_success: 0.999,
    dependency_risk_increase: 0,
  },
  objective: {
    maximize: 'mssr',
    from: 0.62,
    to: 0.75,
  },
  economics: {
    tavus_usd_per_session: 0.12,
    llm_usd_per_session: 0.04,
    stt_tts_usd_per_session: 0.03,
    storage_usd_per_user_month: 0.01,
  },
  trust_question: 'How comfortable do you feel discussing personal memories with this companion?',
};

export function loadConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(OVERRIDE_PATH, 'utf8'));
    return deepMerge(DEFAULT_CONFIG, raw);
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export function saveConfig(next) {
  const dir = path.dirname(OVERRIDE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const merged = deepMerge(DEFAULT_CONFIG, next || {});
  fs.writeFileSync(OVERRIDE_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

function deepMerge(base, extra) {
  if (Array.isArray(base)) return extra ?? base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    for (const [k, v] of Object.entries(extra || {})) {
      out[k] = k in base ? deepMerge(base[k], v) : v;
    }
    return out;
  }
  return extra === undefined ? base : extra;
}
