import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEvent } from './events.js';
import { loadConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');
const EVENTS_PATH = path.join(DATA, 'events.jsonl');
const RATINGS_PATH = path.join(DATA, 'ratings.jsonl');
const MEMORIES_PATH = path.join(DATA, 'memories.jsonl');
const MAX_EVENTS = 40000;

function ensureDir() {
  fs.mkdirSync(DATA, { recursive: true });
}

function appendJsonl(file, row) {
  ensureDir();
  fs.appendFileSync(file, `${JSON.stringify(row)}\n`);
}

function readJsonl(file, limit = MAX_EVENTS) {
  try {
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
    const slice = lines.length > limit ? lines.slice(-limit) : lines;
    return slice.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export function recordEvent(input) {
  const checked = validateEvent(input);
  if (!checked.ok) return checked;
  try {
    appendJsonl(EVENTS_PATH, checked.event);
  } catch {
    return { ok: false, error: 'store_readonly' };
  }
  return { ok: true, event: checked.event };
}

export function recordRating(row) {
  const rating = {
    session_id: String(row.session_id || '').slice(0, 64),
    visitor_id: String(row.visitor_id || '').slice(0, 64),
    ts: Number(row.ts) || Date.now(),
    rating: Number(row.rating),
    duration_s: Number(row.duration_s) || 0,
    turns: Number(row.turns) || 0,
    avatar_id: String(row.avatar_id || 'maya').slice(0, 32),
    model_version: String(row.model_version || loadConfig().model_version).slice(0, 64),
    conversation_id: String(row.conversation_id || '').slice(0, 64),
    source: String(row.source || 'direct').slice(0, 40),
    infra_failed: Boolean(row.infra_failed),
    completed: row.completed !== false,
    safety_flags: Array.isArray(row.safety_flags) ? row.safety_flags.slice(0, 8) : [],
    latency: row.latency && typeof row.latency === 'object' ? row.latency : {},
  };
  if (![1, 2, 3, 4, 5].includes(rating.rating) || !rating.session_id) {
    return { ok: false, error: 'invalid_rating' };
  }
  try {
    appendJsonl(RATINGS_PATH, rating);
  } catch {
    return { ok: false, error: 'store_readonly' };
  }
  recordEvent({
    name: 'support_rating_submitted',
    visitor_id: rating.visitor_id,
    session_id: rating.session_id,
    conversation_id: rating.conversation_id,
    avatar_id: rating.avatar_id,
    model_version: rating.model_version,
    source: rating.source,
    props: { rating: rating.rating, duration_s: rating.duration_s, turns: rating.turns },
  });
  return { ok: true, rating };
}

export function listEvents() {
  return readJsonl(EVENTS_PATH);
}

export function listRatings() {
  return readJsonl(RATINGS_PATH);
}

export function listMemories() {
  return readJsonl(MEMORIES_PATH);
}

export function writeMemory(row) {
  if (!loadConfig().memory_store_enabled) return { ok: false, error: 'memory_store_off' };
  appendJsonl(MEMORIES_PATH, row);
  return { ok: true };
}

export function deleteVisitor(visitorId) {
  const id = String(visitorId || '');
  if (!id) return { ok: false, error: 'missing_visitor' };
  const rewrite = (file, keep) => {
    const rows = readJsonl(file, 1e9);
    const next = rows.filter(keep);
    ensureDir();
    fs.writeFileSync(file, next.map((r) => JSON.stringify(r)).join('\n') + (next.length ? '\n' : ''));
    return { before: rows.length, after: next.length };
  };
  try {
    const events = rewrite(EVENTS_PATH, (e) => e.visitor_id !== id);
    const ratings = rewrite(RATINGS_PATH, (r) => r.visitor_id !== id);
    const memories = rewrite(MEMORIES_PATH, (m) => m.user_id !== id && m.visitor_id !== id);
    return { ok: true, events, ratings, memories };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
