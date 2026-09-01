import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const waitlist = [];

function apiError(data, fallback) {
  const err = data?.error;
  if (typeof err === 'string' && err) return err;
  if (typeof err?.message === 'string' && err.message) return err.message;
  return fallback;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
    .slice(-40)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

async function callXai(systemPrompt, messages) {
  const key = process.env.XAI_API_KEY;
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'grok-4.6',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(apiError(data, `xAI error (${response.status})`));
  }
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Empty reply from model');
  return reply;
}

async function callClaude(systemPrompt, messages) {
  const key = process.env.ANTHROPIC_API_KEY;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(apiError(data, `Claude error (${response.status})`));
  }
  const reply = data.content?.find((b) => b.type === 'text')?.text;
  if (!reply) throw new Error('Empty reply from model');
  return reply;
}

export async function chatHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const systemPrompt =
      typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt.slice(0, 8000) : '';
    let messages = sanitizeMessages(req.body?.messages);
    if (!systemPrompt) {
      res.status(400).json({ error: 'systemPrompt is required' });
      return;
    }
    if (!messages.length) {
      res.status(400).json({ error: 'messages are required' });
      return;
    }

    const xaiKey = process.env.XAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!xaiKey && !anthropicKey) {
      res.status(500).json({
        error: 'Server is missing an API key. Set XAI_API_KEY (recommended) or ANTHROPIC_API_KEY.',
      });
      return;
    }

    // Anthropic requires the first message to be from the user.
    if (!xaiKey && messages[0]?.role === 'assistant') {
      messages = messages.slice(1);
    }

    const reply = xaiKey
      ? await callXai(systemPrompt, messages)
      : await callClaude(systemPrompt, messages);

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Something went wrong' });
  }
}

export async function waitlistHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email.' });
    return;
  }

  if (!waitlist.includes(email)) waitlist.push(email);
  res.status(200).json({ ok: true });
}

export function healthHandler(_req, res) {
  res.status(200).json({ ok: true });
}
