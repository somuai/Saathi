# Saathi — slide copy for presentations.ai

Use the circular bear (`client/public/logo.png`) as the only logo.
Do not use the word GriefCompanion.
Product: **Saathi**. Companion: **Maya**. Deadline: 2 Sep 2026.

Paste one slide at a time. Keep type large. Cream `#F3F7FB`, sapphire `#2A67FF`, coral `#FF7A45`, ink `#1B2430`.

---

## Slide 1 — Title

**Eyebrow:** Intern assignment · live product · 2 Sep 2026

**Headline:** Saathi

**Subhead:** Someone to talk to at 1am, without waking the house.

**Footer line:** A video call with Maya, an AI grief companion for India. Not a counsellor.

**Visual:** bear logo, left. No screenshots of other products.

---

## Slide 2 — The gap

**Headline:** Family WhatsApp is tired. A counsellor has a queue.

**Body:**
- Grief in India is private, late, and often unsayable: a parent, a marriage, a shop, an exam, a quiet house.
- Friends stop asking. Relatives say “be strong.” Paid therapy is slow and stigmatised.
- 1am has no waiting room.

**Callout:** The job is presence, not a diagnosis.

---

## Slide 3 — Who it is for

**Headline:** One product. Three Indias.

| Stage | What is often sitting there | How Maya sounds |
|---|---|---|
| Teen / student | Boards, JEE, NEET, coaching isolation, family izzat | Older sibling. Never “crack it next year.” |
| Adult 30–45 | Sandwich caregiving, layoff, business closure, divorce stigma | Peer. One next hour. |
| Senior | Widowhood, children abroad, joint family thinning | Slow, respectful. Continuing bonds. |

**Note:** Optional chips on the landing. Maya still asks: *what should I call you?* then *what is heaviest tonight?*

---

## Slide 4 — The product

**Headline:** A live video call with one named person.

**Body:**
- Maya is a Tavus PAL (Mary–Home, Hindi + English).
- Disclosure before join: she is AI.
- The call stays inside Saathi: logo, End call, crisis footer.
- Nothing you say is stored here. Pulse counts only.

**Session arc (this is the product, not a chatbot dump):**
1. Who are you — name
2. Age / stage, if unknown
3. What is sitting heaviest
4. One short breathing exercise
5. **Escalation:** stay with that named wound. Do not restart small talk.

---

## Slide 5 — Why this, not that

**Headline:** Choices a senior PM would defend.

| We did not | We did | Why |
|---|---|---|
| Face picker | One companion: Maya | People pick a *problem*, not a cast |
| Dump user on tavus.daily.co | In-product room | Brand, crisis lines, End call |
| Claim “therapy” | Therapeutic methods, disclosed AI | Over-claiming loses India trust |
| Store transcripts | Counts only | Grief is not a CRM |
| US 988 as primary | iCall, Vandrevala, KIRAN, Tele-MANAS | India first |

---

## Slide 6 — Guardrails

**Headline:** Safe enough to put in front of a human.

- Crisis overrides everything. Numbers on screen and in Maya’s mouth.
- No diagnosis. No medication. No pretending to be the person they lost.
- PAL guardrails: `refuse_medical_prescriptions` · `redirect_psychiatric_crisis` · `no_clinical_diagnosis` · `stay_on_therapeutic_topic`
- Free Tavus = one live room, 5-minute cap. Demo is a short, held conversation — not an hour of therapy.

---

## Slide 7 — KPIs (north star)

**Headline:** If they never start the call, nothing else matters.

**North star:** `call_started` — live video calls that actually open.

**24-hour demo targets**

| KPI | Target | Why it exists |
|---|---|---|
| Landing views | 100 | Did anyone arrive |
| Unique visitors | 80 | Cookie `gc_seen`, not vanity reloads |
| Sessions started | 20 | Disclosure accepted |
| **Live calls started** | **10** | **North star** |
| Fallback chat ≥3 turns | 10 | Tavus down, still a conversation |
| Waitlist emails | 15 | Permission to return |

**Where to screenshot:** in-product **Pulse** (nav). Counts, never speech.

---

## Slide 8 — Traction plan (ethical)

**Headline:** Public posts. Never DM the newly bereaved.

**Channels:** r/grief, Instagram, LinkedIn, campus/intern demo.

**Script:**
> I built a small video call with an AI named Maya, for people who need to talk after a loss and don’t want to wake the house. It’s not counselling. Hindi or English. No sign-up. I’m not storing what you say. Does this feel useful, or does it feel wrong?

**Do not:** scrape obituaries, target “RIP” comments, or message a grieving stranger.

---

## Slide 9 — Live demo

**Headline:** Watch a two-minute call.

**Script for you:**
1. Open the live URL.
2. Optional chip: Teen / Adult / Senior.
3. Join. Allow camera.
4. Maya asks your name, then the weight, then one breath, then stays on that wound.
5. End call. Open **Pulse**. Show `call_started` ticked up.

**Backup:** if Tavus is busy (one concurrent room), fallback chat still speaks as Maya.

---

## Slide 10 — Close

**Headline:** Saathi. With you.

**Three lines:**
- A named AI on a video call, for Indian grief that has nowhere to go at night.
- Honest about what it is not: not a clinician, not a stored journal, not a five-minute miracle.
- Ask: ship the demo, then add a psychologist knowledge base after you have watched a real call.

**Logo:** bear. **URL:** the Render link once live. **Until then:** http://localhost:5173
