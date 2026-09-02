const PULSE = new Set([
  'landing_view',
  'unique_visit',
  'start_click',
  'disclosure_accept',
  'session_start',
  'call_started',
  'turn_user',
  'session_3plus',
  'waitlist',
  'download',
  'end_session',
  'crisis_shown',
]);

function visitorId() {
  try {
    let id = localStorage.getItem('gc_vid');
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `v_${Date.now()}`;
      localStorage.setItem('gc_vid', id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function getVisitorId() {
  return visitorId();
}

function safeProps(props = {}) {
  const out = {};
  if (['young', 'teen', 'midlife', 'older', 'unspecified'].includes(props.age)) out.age = props.age;
  if (['person', 'pet', 'relationship', 'chapter', 'unspecified'].includes(props.loss)) {
    out.loss = props.loss;
  }
  if (props.input === 'voice' || props.input === 'text') out.input = props.input;
  if (typeof props.duration_s === 'number') out.duration_s = props.duration_s;
  if (typeof props.turns === 'number') out.turns = props.turns;
  if (typeof props.rating === 'number') out.rating = props.rating;
  if (typeof props.latency_ms === 'number') out.latency_ms = props.latency_ms;
  if (typeof props.trust === 'number') out.trust = props.trust;
  if (typeof props.source === 'string') out.source = props.source.slice(0, 40);
  if (typeof props.stage === 'string') out.stage = props.stage.slice(0, 40);
  if (typeof props.provider === 'string') out.provider = props.provider.slice(0, 20);
  if (typeof props.ok === 'boolean') out.ok = props.ok;
  if (typeof props.completed === 'boolean') out.completed = props.completed;
  if (typeof props.infra_failed === 'boolean') out.infra_failed = props.infra_failed;
  if (typeof props.category === 'string') out.category = props.category.slice(0, 40);
  return out;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem('gc_events') || '[]');
  } catch {
    return [];
  }
}

export function track(name, props = {}) {
  if (name === 'landing_view') {
    try {
      if (!localStorage.getItem('gc_seen')) {
        localStorage.setItem('gc_seen', '1');
        track('unique_visit', props);
      }
    } catch {
      /* private mode */
    }
  }
  const propsSafe = safeProps(props);
  const event = { name, t: Date.now(), ...propsSafe };
  try {
    const log = readLocal();
    log.push(event);
    localStorage.setItem('gc_events', JSON.stringify(log.slice(-800)));
  } catch {
    /* private mode */
  }
  const visitor_id = visitorId();
  const body = {
    name,
    visitor_id,
    session_id: props.session_id,
    conversation_id: props.conversation_id,
    source: props.source,
    props: propsSafe,
  };
  if (PULSE.has(name)) {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, props: propsSafe }),
    }).catch(() => {});
  }
  fetch('/api/observatory/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export function summarizeLocal() {
  const events = readLocal();
  const count = (n) => events.filter((e) => e.name === n).length;
  const by = (key) =>
    events.reduce((acc, e) => {
      if (e[key]) acc[e[key]] = (acc[e[key]] || 0) + 1;
      return acc;
    }, {});
  return {
    landing_view: count('landing_view'),
    unique_visit: count('unique_visit'),
    session_start: count('session_start'),
    call_started: count('call_started'),
    session_3plus: count('session_3plus'),
    waitlist: count('waitlist'),
    download: count('download'),
    crisis_shown: count('crisis_shown'),
    voice: events.filter((e) => e.input === 'voice').length,
    text: events.filter((e) => e.input === 'text').length,
    age: by('age'),
    loss: by('loss'),
    source: 'this browser',
  };
}
