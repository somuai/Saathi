import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PAL_LIVE_CONTEXT, PAL_CONTEXT, PAL_GREETING } from './pal-prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const waitlist = [];
const PULSE_PATH = path.join(__dirname, 'pulse.json');
const defaultPulse = {
  landing_view: 0,
  unique_visit: 0,
  start_click: 0,
  disclosure_accept: 0,
  session_start: 0,
  call_started: 0,
  turn_user: 0,
  session_3plus: 0,
  waitlist: 0,
  download: 0,
  end_session: 0,
  crisis_shown: 0,
  voice: 0,
  text: 0,
  age: {},
  loss: {},
};
const pulse = loadPulse();

function loadPulse() {
  try {
    return { ...defaultPulse, ...JSON.parse(fs.readFileSync(PULSE_PATH, 'utf8')) };
  } catch {
    return { ...defaultPulse, age: {}, loss: {} };
  }
}

function savePulse() {
  try {
    fs.writeFileSync(PULSE_PATH, JSON.stringify(pulse, null, 2));
  } catch {
    /* read-only host */
  }
}

const PULSE_EVENTS = new Set(Object.keys(pulse).filter((k) => k !== 'age' && k !== 'loss' && k !== 'voice' && k !== 'text'));

function apiError(data, fallback) {
  const err = data?.error;
  if (typeof err === 'string' && err) return err;
  if (typeof err?.message === 'string' && err.message) return err.message;
  if (err && typeof err === 'object') return JSON.stringify(err).slice(0, 300);
  if (typeof data?.message === 'string') return data.message;
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

export async function eventHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const name = String(req.body?.name || '');
  if (!PULSE_EVENTS.has(name) && name !== 'turn_user') {
    res.status(400).json({ error: 'Unknown event' });
    return;
  }
  if (pulse[name] !== undefined) pulse[name] += 1;
  const input = req.body?.props?.input;
  if (input === 'voice') pulse.voice += 1;
  if (input === 'text') pulse.text += 1;
  const age = req.body?.props?.age;
  const loss = req.body?.props?.loss;
  if (typeof age === 'string' && age.length < 20) pulse.age[age] = (pulse.age[age] || 0) + 1;
  if (typeof loss === 'string' && loss.length < 20) pulse.loss[loss] = (pulse.loss[loss] || 0) + 1;
  savePulse();
  res.status(200).json({ ok: true });
}

export function pulseHandler(_req, res) {
  res.status(200).json({
    ...pulse,
    waitlist_unique: waitlist.length,
  });
}

export async function avatarSessionHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const tavusKey = process.env.TAVUS_API_KEY;
  const palId = process.env.TAVUS_PAL_ID;
  const ageId = String(req.body?.ageId || 'unspecified').slice(0, 20);
  const lossId = String(req.body?.lossId || 'unspecified').slice(0, 20);

  if (tavusKey && palId) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': tavusKey,
      };
      // Free tier allows one live room. End leftover calls first.
      const open = await fetch('https://tavusapi.com/v2/conversations?status=active&limit=20', { headers });
      const openData = await open.json().catch(() => ({}));
      for (const c of openData.data || []) {
        const id = c.conversation_id;
        if (id && c.status === 'active') {
          await fetch(`https://tavusapi.com/v2/conversations/${id}/end`, { method: 'POST', headers });
        }
      }
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pal_id: palId,
          conversation_name: 'Saath',
          conversational_context: `${PAL_LIVE_CONTEXT} Life stage chip: ${ageId}. Loss chip: ${lossId}.`,
          custom_greeting: PAL_GREETING,
          properties: {
            // Free/Starter cap is 5 minutes; Tavus will clamp if the plan is lower.
            max_call_duration: 300,
            // Default is 0: any iframe blip or tab switch ends the room immediately.
            participant_left_timeout: 60,
            participant_absent_timeout: 300,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        res.status(200).json({
          provider: 'loop',
          error: apiError(data, 'Tavus unavailable'),
        });
        return;
      }
      res.status(200).json({
        provider: 'tavus',
        conversationUrl: data.conversation_url,
        conversationId: data.conversation_id,
      });
      return;
    } catch (err) {
      res.status(200).json({ provider: 'loop', error: err.message });
      return;
    }
  }

  const anamKey = process.env.ANAM_API_KEY;
  const anamAvatar = process.env.ANAM_AVATAR_ID;
  if (anamKey && anamAvatar) {
    try {
      const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${anamKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaConfig: {
            name: 'GriefCompanion',
            avatarId: anamAvatar,
            voiceId: process.env.ANAM_VOICE_ID,
            systemPrompt: PAL_CONTEXT,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.sessionToken) {
        res.status(200).json({ provider: 'anam', sessionToken: data.sessionToken });
        return;
      }
    } catch {
      /* fall through to loop */
    }
  }

  res.status(200).json({ provider: 'loop' });
}

function tavusHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.TAVUS_API_KEY,
  };
}

export async function conversationStatusHandler(req, res) {
  const id = String(req.params?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id || !process.env.TAVUS_API_KEY) {
    res.status(400).json({ error: 'Missing conversation' });
    return;
  }
  try {
    const response = await fetch(`https://tavusapi.com/v2/conversations/${id}`, {
      headers: tavusHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    res.status(200).json({ status: data.status || 'unknown' });
  } catch {
    res.status(200).json({ status: 'unknown' });
  }
}

export async function conversationEndHandler(req, res) {
  const id = String(req.params?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id || !process.env.TAVUS_API_KEY) {
    res.status(400).json({ error: 'Missing conversation' });
    return;
  }
  try {
    await fetch(`https://tavusapi.com/v2/conversations/${id}/end`, {
      method: 'POST',
      headers: tavusHeaders(),
    });
  } catch {
    /* already gone */
  }
  res.status(200).json({ ok: true });
}
