import { loadConfig } from './config.js';
import { listMemories, writeMemory, recordEvent } from './store.js';

function id() {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createMemory(input) {
  const cfg = loadConfig();
  if (!cfg.memory_store_enabled) return { ok: false, error: 'memory_store_off' };
  const row = {
    memory_id: input.memory_id || id(),
    user_id: String(input.user_id || input.visitor_id || '').slice(0, 64),
    subject: String(input.subject || '').slice(0, 80),
    fact: String(input.fact || '').slice(0, 280),
    source_conversation: String(input.source_conversation || '').slice(0, 64),
    source_message: String(input.source_message || '').slice(0, 64),
    timestamp: Number(input.timestamp) || Date.now(),
    confidence: Math.max(0, Math.min(1, Number(input.confidence) || 0)),
    user_confirmed: Boolean(input.user_confirmed),
    sensitive_data_category: String(input.sensitive_data_category || 'general').slice(0, 40),
    deletion_status: 'active',
  };
  if (!row.user_id || !row.fact) return { ok: false, error: 'incomplete_memory' };
  writeMemory(row);
  recordEvent({
    name: 'memory_created',
    visitor_id: row.user_id,
    conversation_id: row.source_conversation,
    props: { memory_id: row.memory_id, confidence: row.confidence },
  });
  return { ok: true, memory: row };
}

export function retrieve(userId, query) {
  const cfg = loadConfig();
  const q = String(query || '').toLowerCase();
  const hits = listMemories().filter(
    (m) =>
      m.user_id === userId &&
      m.deletion_status !== 'deleted' &&
      (`${m.subject} ${m.fact}`.toLowerCase().includes(q) || !q),
  );
  if (!hits.length) {
    recordEvent({ name: 'memory_retrieved', visitor_id: userId, props: { ok: false } });
    return { ok: true, memory: null, say: "I don't remember that clearly." };
  }
  const best = hits.sort((a, b) => b.confidence - a.confidence)[0];
  if (best.confidence < cfg.memory.say_unsure_below) {
    recordEvent({
      name: 'memory_retrieved',
      visitor_id: userId,
      props: { ok: true, confidence: best.confidence, memory_id: best.memory_id },
    });
    return { ok: true, memory: best, say: "I don't remember that clearly." };
  }
  recordEvent({
    name: 'memory_retrieved',
    visitor_id: userId,
    props: { ok: true, confidence: best.confidence, memory_id: best.memory_id },
  });
  return { ok: true, memory: best, say: null };
}

export function memoryAccuracy(evals = []) {
  const total = evals.length;
  const correct = evals.filter((e) => e.correct).length;
  return { correct, total, rate: total ? correct / total : 1 };
}
