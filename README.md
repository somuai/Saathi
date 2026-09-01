# Saath

A working **MVP**: a live video call with **Maya**, an AI grief companion for India. Not a counsellor. No sign-up. We do not store what you say.

This is the smallest thing that can be judged as a product — not a finished therapy service.

## For reviewers

- Open the live URL in Chrome (laptop if you can).
- Allow camera and microphone.
- Optional chips, then **Join a video call with Maya**.
- **One live room at a time.** A second Join ends the first (Tavus free tier).
- Calls cap at **about 5 minutes**. That is the plan limit, not Maya hanging up.
- If video is busy, stay on the page — in-app chat still works.
- Crisis lines stay on screen: iCall 9152987821 · Vandrevala 9999666555 · KIRAN 1800-599-0019.

## Product choices

| Call | Choice |
|---|---|
| Companion | One person: Maya (Tavus PAL, Mary–Home, English + Hindi) |
| Session | Name → stage → what is heaviest → one breath → stay on that wound |
| Data | Pulse counts only. No transcripts. |
| North star | `call_started` — live video rooms that actually open |

## Run locally

```bash
npm install
# server/.env: TAVUS_API_KEY + TAVUS_PAL_ID
npm run dev
```

App: http://127.0.0.1:5173  
Pulse: nav → **Pulse**

## Deploy (Render)

Web Service from this repo.

- Build: `npm install && npm run build`
- Start: `npm start`
- Health: `/api/health`
- Env: `NODE_ENV=production`, `TAVUS_API_KEY`, `TAVUS_PAL_ID=pe877b0fc929`, `PUBLIC_ORIGIN=https://<service>.onrender.com`

Do not commit API keys.
