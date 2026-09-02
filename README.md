# Saathi

**Someone to talk to at 1am, without waking the house.**

Saathi is a working MVP: a live video call with **Maya**, one AI grief companion for India. No sign-up. Nothing you say is stored here. She is not a counsellor, and we say so before you join.

This is the smallest shippable product that can be judged — not a finished therapy service.

| | |
|---|---|
| **Live** | [https://saath-81jt.onrender.com](https://saath-81jt.onrender.com) |
| **Source** | [github.com/somuai/Saathi](https://github.com/somuai/Saathi) |
| **Companion** | Maya (Tavus PAL, Mary–Home, Hindi + English) |
| **North star** | `call_started` — live video rooms that actually open |

---

## The job

Grief in India is private, late, and often unsayable — a parent, a marriage, a shop, an exam, a quiet house. Family WhatsApp is tired. A counsellor has a queue and a price. **1am has no waiting room.**

Saathi’s job is **presence**, not a diagnosis.

---

## Who it is for

One product. Maya changes how she sits, not her face.

| Stage | What is often sitting there | How Maya sounds |
|---|---|---|
| Child | A person, a pet, a house that feels different | Simple, playful, validating |
| Teen / student | Boards, JEE, NEET, coaching, family *izzat* | Older sibling. Never “crack it next year.” |
| Adult 30–45 | Sandwich caregiving, layoff, business closure, divorce | Peer. One next hour. |
| Senior | Widowhood, children abroad, joint family thinning | Slow, honouring, continuing bonds |
| Parent | A child’s exam or restlessness, plus their own parents | The parent’s exhaustion is real. Do not blame the child. |

Optional chips on the landing. Maya still asks: *what should I call you?* then *what is sitting heaviest tonight?*

---

## How a sitting works

1. **Name** — what to call them  
2. **Stage** — if unknown  
3. **The weight** — they name it; we do not guess  
4. **One breath** — in 4, hold 4, out 6, twice. Skip if they refuse  
5. **Stay on that wound** — no small talk restart, no stacked exercises  

The room has a **5-minute timer**. After the call, a **sitting note** (DAP-style: data, assessment, plan) with a theme pie, next-hour steps, and a suggested cadence. The note is shown once and **not stored**.

If the video room is busy (one concurrent Tavus slot), in-app chat still speaks as Maya.

---

## What we chose not to build

| We did not | We did | Why |
|---|---|---|
| Face picker | One companion: Maya | People pick a *problem*, not a cast |
| Dump users on tavus.daily.co | In-product room | Brand, timer, End call, crisis lines |
| Claim “therapy” | Therapeutic methods, disclosed AI | Over-claiming loses India trust |
| Store transcripts | Counts only | Grief is not a CRM |
| US 988 as primary | iCall, Vandrevala, KIRAN, Tele-MANAS | India first |

---

## Guardrails

Maya uses methods (person-centred listening, light CBT noticing, grounding). She is **not** a licensed clinician on this product.

- No diagnosis. No medication. No pretending to be the person they lost.  
- Crisis overrides everything.  
- PAL: `refuse_medical_prescriptions` · `redirect_psychiatric_crisis` · `no_clinical_diagnosis` · `stay_on_therapeutic_topic`  
- ADHD / restlessness: no label, no meds, one idea at a time, they can fidget.

**India crisis lines (always on screen)**  
iCall `9152987821` · Vandrevala `9999666555` · KIRAN `1800-599-0019` · Tele-MANAS `14416`

---

## Metrics (Pulse)

In-product **Pulse** in the nav. Counts only — never speech.

| KPI | 24h demo target | Why it exists |
|---|---|---|
| Landing views | 100 | Did anyone arrive |
| Unique visitors | 80 | Cookie, not vanity reloads |
| Sessions started | 20 | Disclosure accepted |
| **Live calls started** | **10** | **North star** |
| Fallback chat ≥3 turns | 10 | Video down, still a conversation |
| Waitlist emails | 15 | Permission to return |

On free Render the disk is ephemeral: Pulse can reset on redeploy. Screenshot if you need numbers for the review.

---

## How to judge (5 minutes)

1. Open the [live URL](https://saath-81jt.onrender.com) in **Chrome**, laptop if you can.  
2. First load after idle can take ~30–60s (Render free cold start).  
3. Optional chips → **Join a video call with Maya** → allow camera and mic.  
4. **One live room.** A second Join ends the first.  
5. She asks your name, then the weight, then one breath, then stays.  
6. Watch the timer. **End call** → sitting note. Open **Pulse**.  
7. Octocat in the nav → this repo.

---

## Known MVP limits

Say these out loud. Do not hide them.

- One concurrent Tavus room  
- About **five minutes** per call (plan cap)  
- Render free **cold start**  
- Sitting-note LLM is Gemini Flash; Grok is wired but the xAI team currently has no credits  
- Knowledge documents (grief, CBT, ADHD, India age) are attached on the PAL; indexing can take a few minutes after upload  
- Not a replacement for a human counsellor

---

## Stack

Vite + React client · Express `/api` · Tavus CVI (PAL `pe877b0fc929`) · Gemini for the after-call note · Pulse counts in `server/pulse.json`

```
client/src     landing, call room, sitting note, Pulse
server/        conversation create, transcript → note, events
deck/          pitch copy + slide images
```

---

## Run locally

```bash
cd grief-companion
npm install
# server/.env — never commit this file
#   TAVUS_API_KEY=
#   TAVUS_PAL_ID=pe877b0fc929
#   GEMINI_API_KEY=          # sitting note
#   XAI_API_KEY=             # optional, needs credits
npm run dev
```

- App: http://127.0.0.1:5173  
- API: http://127.0.0.1:3001/api/health  
- Pulse: nav → **Pulse**

---

## Deploy

Render Web Service from this repo (`render.yaml`).

| | |
|---|---|
| Build | `npm install --include=dev && npm run build` |
| Start | `npm start` |
| Health | `/api/health` |
| Env | `NODE_ENV=production` · `TAVUS_API_KEY` · `TAVUS_PAL_ID` · `GEMINI_API_KEY` · `PUBLIC_ORIGIN` |

Do not put keys in git. Rotate any key that has been pasted into chat.

---

## Pitch

- Copy: `deck/SAATH-PITCH-SLIDES.md`  
- Slide images: `deck/slide-images/`  
- Video script: `deck/PITCH-VIDEO-SCRIPT.md`  
- Knowledge sources: `deck/KNOWLEDGE.md`

---

Intern assignment · 2 Sep 2026 · Working MVP
