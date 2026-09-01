# GriefCompanion — Project Context

## What this is
A single-page web app where users can talk to an AI avatar
that helps them process grief. Voice in + voice out + animated face.

## Tech Stack
- Frontend: React (Vite), plain CSS (no Tailwind)
- Backend: Node.js + Express (server.js + shared handlers)
- AI: SpaceXAI / xAI Grok (`grok-4.6` via `https://api.x.ai/v1`)
  Optional fallback: Anthropic Claude (`claude-sonnet-4-6`) if only `ANTHROPIC_API_KEY` is set
- TTS/STT: Browser Web Speech API (`window.speechSynthesis`, `window.SpeechRecognition`)
- Avatar: SVG face with CSS animations
- Deploy: Vercel

## Key Files
- /client/src/App.jsx — main app
- /client/src/Avatar.jsx — animated SVG avatar component
- /client/src/Conversation.jsx — chat + mic input
- /server/server.js — Express proxy (hides API key)
- /server/handlers.js — shared /api/chat and /api/waitlist logic
- /client/src/system-prompt.js — grief companion system prompt

## Rules
- Never store conversation content on the server
- Always show AI disclosure before chat
- API keys live in .env, never in client code
- Keep responses ≤3 sentences unless user asks for more
- The avatar mouth animates while TTS is speaking (`isSpeaking` prop)
- Crisis language must surface 988 (US) and iCall 9152987821 (India)
