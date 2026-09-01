const ALLOWED = new Set([
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

function safeProps(props = {}) {
  const out = {};
  if (['young', 'midlife', 'older', 'unspecified'].includes(props.age)) out.age = props.age;
  if (['person', 'pet', 'relationship', 'chapter', 'unspecified'].includes(props.loss)) {
    out.loss = props.loss;
  }
  if (props.input === 'voice' || props.input === 'text') out.input = props.input;
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
  if (!ALLOWED.has(name)) return;
  const event = { name, t: Date.now(), ...safeProps(props) };
  try {
    const log = readLocal();
    log.push(event);
    localStorage.setItem('gc_events', JSON.stringify(log.slice(-800)));
  } catch {
    /* private mode */
  }
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, props: safeProps(props) }),
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
