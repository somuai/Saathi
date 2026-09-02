export const AGES = [
  {
    id: 'unspecified',
    label: 'Skip',
    hint: 'Default calm voice',
    rate: 0.9,
    pitch: 1.0,
    voices: ['heera', 'ravi', 'veena', 'india', 'en-in', 'samantha'],
  },
  {
    id: 'young',
    label: 'Child',
    hint: 'Simple, playful, validating',
    rate: 0.92,
    pitch: 1.02,
    voices: ['heera', 'ravi', 'veena', 'india', 'en-in', 'samantha', 'google uk'],
  },
  {
    id: 'teen',
    label: 'Teen',
    hint: 'Exam, coaching, family izzat',
    rate: 0.92,
    pitch: 1.0,
    voices: ['heera', 'ravi', 'veena', 'india', 'en-in', 'samantha', 'google uk'],
  },
  {
    id: 'midlife',
    label: 'Adult 30–45',
    hint: 'Empathetic and practical',
    rate: 0.88,
    pitch: 1.0,
    voices: ['heera', 'ravi', 'veena', 'india', 'en-in', 'karen', 'moira'],
  },
  {
    id: 'older',
    label: 'Senior',
    hint: 'Respectful, patient, reflective',
    rate: 0.82,
    pitch: 0.96,
    voices: ['heera', 'veena', 'ravi', 'india', 'en-in', 'karen'],
  },
];

export const LOSSES = [
  { id: 'unspecified', label: "I'd rather not say" },
  { id: 'person', label: 'Someone in the family' },
  { id: 'pet', label: 'A pet' },
  { id: 'relationship', label: 'A relationship' },
  { id: 'chapter', label: 'A job or chapter' },
];

export function getPersona(ageId, lossId) {
  const age = AGES.find((a) => a.id === ageId) || AGES[0];
  const loss = LOSSES.find((l) => l.id === lossId) || LOSSES[0];
  return { age, loss };
}

export function greetingFor(companionName) {
  const name = companionName || 'Maya';
  return `Hello, I'm ${name}. I'm here to listen and walk with you through this. Whenever you're ready, would you like to tell me what's on your mind?`;
}

export function pickVoice(preferredNames = []) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const lower = (v) => `${v.name} ${v.lang}`.toLowerCase();
  for (const name of preferredNames) {
    const hit = voices.find((v) => lower(v).includes(name));
    if (hit) return hit;
  }
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('en-in')) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
}
