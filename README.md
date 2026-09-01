# GriefCompanion

A compassionate AI avatar you can talk to after loss — available 24/7, no judgment, no advice you didn't ask for. Voice in, voice out, and a face that listens. No sign-up. Conversations are never stored on the server.

This is an AI companion, **not therapy**.

## Local setup

You need Node.js 18+.

```bash
cd grief-companion
npm install
cp server/.env.example server/.env
```

Add a key to `server/.env`:

```
XAI_API_KEY=your_key_here
```

Get an xAI key at [console.x.ai](https://console.x.ai). Then:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server (API proxy): http://localhost:3001

Open Chrome or Edge for the best voice input (Web Speech API). Voice output uses the browser's built-in speech synthesis — no extra API key.

Optional: if you only have Anthropic, set `ANTHROPIC_API_KEY` instead. The proxy will use `claude-sonnet-4-6`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add environment variable **`XAI_API_KEY`** (Project → Settings → Environment Variables). Use `ANTHROPIC_API_KEY` only as a fallback.
4. Deploy. The `/api/*` routes are serverless; the Vite app is the static frontend.

Do not put any API key in client code.

## What is in / out of MVP

**In:** animated SVG avatar, TTS + STT, text fallback, in-session memory, AI disclosure, companion name + 3 faces, transcript download, waitlist, crisis-line footer.

**Out:** accounts, cross-session memory, storing grief content, mobile apps, therapist booking.

## Outreach copy

Reddit (r/grief):

> I've been thinking about how isolating grief can be — especially late at night when you don't want to wake anyone. I built a small tool: an AI companion you can talk to, voice or text. It's not therapy, it's just a face that listens. No sign-up, completely free.
>
> I'm an intern building this as a product project and I genuinely want to know: does something like this feel helpful or does it feel wrong to you? Any feedback — including "this is a terrible idea" — is useful.
>
> Link: [your-vercel-url]
>
> Full transparency: you're talking to an AI. I'm not collecting your conversations.

Twitter/X:

> Built an AI grief companion overnight. Talk to it. Download your session after. No login, no ads, just a face that listens.
> Grief is isolating. This won't fix it, but maybe it helps at 2am.
> [link]
