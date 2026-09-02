import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PAL_LIVE_CONTEXT, PAL_CONTEXT, PAL_DEPLOYMENT_ID } from './pal-prompt.js';
import { recordEvent } from './observatory/store.js';
import { scanTranscriptFlags } from './observatory/http.js';

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
  const deploymentId = process.env.TAVUS_DEPLOYMENT_ID || PAL_DEPLOYMENT_ID;
  const ageId = String(req.body?.ageId || 'unspecified').slice(0, 20);
  const lossId = String(req.body?.lossId || 'unspecified').slice(0, 20);

  if (tavusKey && (deploymentId || palId)) {
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
      const chipContext = `${PAL_LIVE_CONTEXT} Life stage chip: ${ageId}. Loss chip: ${lossId}.`;
      const started = Date.now();
      // Prefer the PAL Maker landing-page deployment so Maya's greeting, context, captions, and sitting stay hers.
      let response = deploymentId
        ? await fetch(`https://tavusapi.com/v2/deployments/${deploymentId}/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              conversational_context: chipContext,
            }),
          })
        : null;
      if ((!response || !response.ok) && palId) {
        response = await fetch('https://tavusapi.com/v2/conversations', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            pal_id: palId,
            conversation_name: 'Saathi',
            conversational_context: chipContext,
            properties: {
              max_call_duration: 300,
              participant_left_timeout: 60,
              participant_absent_timeout: 300,
            },
          }),
        });
      }
      const data = await response.json().catch(() => ({}));
      const latency_ms = Date.now() - started;
      if (!response.ok) {
        recordEvent({
          name: 'tavus_session_failed',
          props: { latency_ms, provider: 'tavus', ok: false },
        });
        res.status(200).json({
          provider: 'loop',
          error: apiError(data, 'Tavus unavailable'),
        });
        return;
      }
      recordEvent({
        name: 'tavus_session_created',
        conversation_id: data.conversation_id,
        props: { latency_ms, provider: 'tavus', ok: true, stage: 'session_create' },
      });
      recordEvent({
        name: 'latency_sample',
        conversation_id: data.conversation_id,
        props: { latency_ms, stage: 'session_create' },
      });
      res.status(200).json({
        provider: 'tavus',
        conversationUrl: data.conversation_url,
        conversationId: data.conversation_id,
      });
      return;
    } catch (err) {
      recordEvent({
        name: 'tavus_session_failed',
        props: { provider: 'tavus', ok: false, reason: 'exception' },
      });
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

function cleanTurn(text) {
  return String(text || '')
    .replace(/USER_SPEECH:\s*/gi, '')
    .replace(/VISUAL[_\s-]?SCENE:[\s\S]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTranscript(data) {
  const events = Array.isArray(data?.events) ? data.events : [];
  const ready = events.find((e) => e.event_type === 'application.transcription_ready');
  const raw = ready?.properties?.transcript || data?.transcript || [];
  return raw
    .filter((t) => t && (t.role === 'user' || t.role === 'assistant'))
    .map((t) => ({ role: t.role, content: cleanTurn(t.content).slice(0, 800) }))
    .filter((t) => t.content);
}

const THEME_RULES = [
  ['The loss itself', /died|death|gone|miss|ammi|abba|papa|mummy|maa\b|dad\b|mom\b|passed|grief/],
  ['Exam / studies', /exam|jee|neet|board|rank|kota|paper|marks|coaching/],
  ['Family / izzat', /family|parents|izzat|uncle|house|relatives|shame/],
  ['Self-blame', /failed|my fault|useless|should have|i ruined|i can't|worthless/],
  ['Sleep / body', /sleep|tired|eat|insomnia|headache|body/],
  ['Isolation', /alone|nobody|lonely|no one|quiet/],
];

function themeMix(userText) {
  const scores = THEME_RULES.map(([label, re]) => {
    const hits = userText.match(new RegExp(re.source, 'gi'));
    return { label, value: hits ? hits.length : 0 };
  });
  const total = scores.reduce((n, s) => n + s.value, 0);
  if (!total) {
    return [
      { label: 'Being heard', value: 50 },
      { label: 'Naming the weight', value: 30 },
      { label: 'Next hour', value: 20 },
    ];
  }
  return scores
    .filter((s) => s.value)
    .map((s) => ({ label: s.label, value: Math.round((s.value / total) * 100) }));
}

function localSummary(turns) {
  const userText = turns
    .filter((t) => t.role === 'user')
    .map((t) => t.content)
    .join(' ')
    .toLowerCase();
  const heard = turns
    .filter((t) => t.role === 'user')
    .slice(-3)
    .map((t) => t.content)
    .join(' ');
  const summary = heard
    ? `Tonight you spoke, and Maya stayed with you. You named this: “${heard.slice(0, 220)}${heard.length > 220 ? '…' : ''}”. That is enough for one sitting.`
    : 'Tonight you sat with Maya for a short while. Even a few minutes counts. You do not have to have said everything.';
  const next = ['Drink a glass of water and stay in this room for the next ten minutes.'];
  const patterns = [];
  if (/failed|my fault|useless|should have/.test(userText)) {
    patterns.push('All-or-nothing thinking — “I failed” covering a harder, more human story.');
  }
  if (/exam|jee|neet|rank/.test(userText)) {
    patterns.push('The rank or the paper is standing in for worth. That is common. It is still heavy.');
    next.push('Do not open the exam app or compare ranks tonight. That can wait until morning.');
  } else if (/divorce|broke|left me|marriage|husband|wife|ex\b/.test(userText)) {
    next.push('One kind thing for your body — tea, a wash, or sitting by a window.');
  } else if (/business|shop|laid off|job|company|failed/.test(userText)) {
    patterns.push('Collapsing a whole chapter into one word: failed. The chapter was longer than that.');
    next.push('Write one sentence: what you carried today. Not a plan. One sentence.');
  } else if (/died|death|passed|ammi|abba|papa|mummy|maa\b|dad\b|mom\b/.test(userText)) {
    next.push('If a photo or a belonging is nearby, you may sit with it. You do not have to put it away.');
  } else {
    next.push('If you can, name one person you could text tomorrow. You do not have to text tonight.');
  }
  if (!patterns.length) {
    patterns.push('Nothing here is a character flaw. Grief often looks like self-blame or shutting the door. We can notice that without punishing it.');
  }
  next.push('If you feel unsafe: iCall 9152987821, Vandrevala 9999666555, KIRAN 1800-599-0019.');
  return {
    summary,
    data: summary,
    assessment:
      'This was a short companion sitting, not a clinical assessment. What showed up is grief or a life-chapter loss. No diagnosis is being made.',
    patterns,
    next,
    perWeek: '2–3 short sittings this week, then weekly if it still helps.',
    sittings: 'About 6–8 companion sittings over 4 weeks, then pause. If it stays heavy, a human counsellor is the next step.',
    themes: themeMix(userText),
  };
}

const REPORT_SYSTEM = `You write an after-sitting note for Saathi, an AI grief companion in India. You are not a licensed clinician. Never diagnose. Never prescribe medication. Never shame.

Therapists use DAP notes: Data (what was said), Assessment (clinical impression without a disease label here), Plan (next steps, frequency).

Return JSON only:
{
  "summary": "3-5 warm sentences of Data: what they sat with tonight",
  "assessment": "2-3 sentences. Not a diagnosis. What the sitting suggests about load and coping.",
  "patterns": ["2-4 unhelpful patterns — NEVER call them mistakes or faults. CBT-style: all-or-nothing, self-blame, isolation, rank=worth. Gentle."],
  "next": ["3 tiny next-hour actions"],
  "perWeek": "how often to return this week, e.g. 2-3 short sittings",
  "sittings": "suggested companion sittings over 4 weeks, plus when to see a human counsellor",
  "themes": [{"label":"theme","value":number}]
}
themes values are percentages that sum to 100. Labels from: The loss itself, Exam / studies, Family / izzat, Self-blame, Sleep / body, Isolation, Being heard.
If crisis language appeared, last next item must be India helplines: iCall 9152987821, Vandrevala 9999666555, KIRAN 1800-599-0019, Tele-MANAS 14416.
No markdown.`;

function parseReport(raw, fallbackTurns) {
  try {
    const jsonText = String(raw).replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonText);
    if (!parsed?.summary) return localSummary(fallbackTurns);
    return {
      summary: String(parsed.summary).slice(0, 900),
      assessment: String(parsed.assessment || '').slice(0, 600),
      patterns: (Array.isArray(parsed.patterns) ? parsed.patterns : []).map((x) => String(x).slice(0, 240)).slice(0, 4),
      next: (Array.isArray(parsed.next) ? parsed.next : []).map((x) => String(x).slice(0, 220)).slice(0, 4),
      perWeek: String(parsed.perWeek || '').slice(0, 180),
      sittings: String(parsed.sittings || '').slice(0, 220),
      themes: Array.isArray(parsed.themes)
        ? parsed.themes
            .map((t) => ({ label: String(t.label || '').slice(0, 40), value: Number(t.value) || 0 }))
            .filter((t) => t.label && t.value > 0)
            .slice(0, 6)
        : [],
    };
  } catch {
    return localSummary(fallbackTurns);
  }
}

async function callGemini(systemPrompt, userText) {
  const key = process.env.GEMINI_API_KEY;
  const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
  let last = 'Gemini unavailable';
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 700, responseMimeType: 'application/json' },
        }),
      },
    );
    const data = await response.json().catch(() => ({}));
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    if (response.ok && text) return text;
    last = data.error?.message || `Gemini ${response.status}`;
  }
  throw new Error(last);
}

async function waitForTranscript(id) {
  for (let i = 0; i < 12; i += 1) {
    const response = await fetch(`https://tavusapi.com/v2/conversations/${id}?verbose=true`, {
      headers: tavusHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    const turns = extractTranscript(data);
    if (turns.length) return turns;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

export async function conversationSummaryHandler(req, res) {
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
    /* already ended */
  }

  try {
    const turns = await waitForTranscript(id);
    scanTranscriptFlags(turns, { conversation_id: id });
    const blob = turns.map((t) => `${t.role === 'user' ? 'You' : 'Maya'}: ${t.content}`).join('\n').slice(0, 6000);
    if (blob && process.env.GEMINI_API_KEY) {
      try {
        const raw = await callGemini(REPORT_SYSTEM, blob);
        res.status(200).json(parseReport(raw, turns));
        return;
      } catch {
        /* fall through */
      }
    }
    if (blob && process.env.XAI_API_KEY) {
      try {
        const raw = await callXai(REPORT_SYSTEM, [{ role: 'user', content: blob }]);
        res.status(200).json(parseReport(raw, turns));
        return;
      } catch {
        /* fall through */
      }
    }
    res.status(200).json(localSummary(turns));
  } catch {
    res.status(200).json(localSummary([]));
  }
}
