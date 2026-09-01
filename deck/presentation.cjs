const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.defineLayout({ name: "BOOST_WIDE", width: 20, height: 11.25 });
pres.layout = "BOOST_WIDE";
pres.author = "GriefCompanion";
pres.title = "GriefCompanion — Product intern assignment";
pres.company = "GriefCompanion";

const C = {
  bg: "FDF5EB",
  orange: "E85D2C",
  orangeDk: "C84A1F",
  peach: "F5C77C",
  peachLt: "FCE4BD",
  peachVLt: "FCEFD9",
  ivory: "FFF8EC",
  inkDark: "2A1F12",
  ink: "3A2E20",
  body: "4A3F2E",
  muted: "9C8770",
  divider: "D8C8B0",
  pink: "F4A3A3",
  sage: "A6BFA8",
  sageDk: "6F8F71",
  phoneDark: "1F1410",
  cardBg: "FFFFFF",
  shadow: "000000",
};

function addBackground(slide) {
  slide.background = { color: C.bg };
}

function addLogoTopLeft(slide, x = 0.7, y = 0.6) {
  slide.addShape(pres.shapes.OVAL, {
    x: x, y: y, w: 0.32, h: 0.32,
    fill: { color: C.orange }, line: { color: C.orange, width: 0 },
  });
  slide.addShape(pres.shapes.OVAL, {
    x: x + 0.2, y: y, w: 0.32, h: 0.32,
    fill: { color: C.pink }, line: { color: C.pink, width: 0 },
  });
  slide.addText("griefcompanion", {
    x: x + 0.65, y: y - 0.04, w: 5, h: 0.42,
    fontSize: 20, fontFace: "Calibri", color: C.inkDark, valign: "middle", margin: 0,
  });
}

function addFooter(slide, num) {
  slide.addShape(pres.shapes.OVAL, {
    x: 0.7, y: 10.78, w: 0.18, h: 0.18,
    fill: { color: C.orange }, line: { color: C.orange, width: 0 },
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 0.82, y: 10.78, w: 0.18, h: 0.18,
    fill: { color: C.pink }, line: { color: C.pink, width: 0 },
  });
  slide.addText("griefcompanion", {
    x: 1.05, y: 10.74, w: 3.2, h: 0.28,
    fontSize: 13, fontFace: "Calibri", color: C.inkDark, valign: "middle", margin: 0,
  });
  slide.addText("Product intern assignment  ·  2 Sep 2026  ·  Live demo at localhost:5173", {
    x: 5.2, y: 10.74, w: 11.2, h: 0.28,
    fontSize: 13, fontFace: "Calibri", color: C.muted,
    align: "center", valign: "middle", margin: 0,
  });
  const padded = num.toString().padStart(2, "0");
  slide.addText(`${padded} / 09`, {
    x: 17.6, y: 10.74, w: 1.7, h: 0.28,
    fontSize: 13, fontFace: "Calibri", color: C.muted,
    align: "right", valign: "middle", charSpacing: 1.5, margin: 0,
  });
}

function addSectionLabel(slide, text, x = 0.85, y = 1.05) {
  slide.addText(text, {
    x: x, y: y, w: 12, h: 0.45,
    fontSize: 16, fontFace: "Calibri", bold: true,
    color: C.orange, charSpacing: 4, margin: 0, valign: "middle",
  });
}

// SLIDE 1 — Title
{
  const s = pres.addSlide();
  addBackground(s);
  s.addShape(pres.shapes.OVAL, {
    x: -3.5, y: 2.5, w: 14.5, h: 14.5,
    fill: { color: C.peach }, line: { color: C.peach, width: 0 },
  });
  addLogoTopLeft(s, 0.85, 0.85);
  s.addText("AN AI AVATAR FOR GRIEF  ·  NOT THERAPY", {
    x: 0.85, y: 2.85, w: 16, h: 0.5,
    fontSize: 17, fontFace: "Calibri", bold: true,
    color: C.orange, charSpacing: 5, margin: 0, valign: "middle",
  });
  s.addText([
    { text: "Grief is isolating. ", options: { color: C.inkDark } },
    { text: "2am", options: { color: C.orange, italic: true } },
    { text: " doesn't have", options: { color: C.inkDark, breakLine: true } },
    { text: "a waiting room.", options: { color: C.inkDark } },
  ], {
    x: 0.85, y: 3.5, w: 18.5, h: 3.0,
    fontSize: 64, fontFace: "Calibri", valign: "top", margin: 0,
  });
  s.addText("A face and a voice that stay. No sign-up. Nothing you say is stored.\nVoice in, voice out, three life-stage tones — built in 24 hours on free APIs.", {
    x: 0.85, y: 7.0, w: 12, h: 1.3,
    fontSize: 22, fontFace: "Calibri", italic: true,
    color: C.body, valign: "top", margin: 0,
  });
  s.addText("PRODUCT INTERN ASSIGNMENT", {
    x: 12.2, y: 9.0, w: 7.3, h: 0.4,
    fontSize: 16, fontFace: "Calibri", bold: true, color: C.muted,
    charSpacing: 3, align: "right", valign: "middle", margin: 0,
  });
  s.addText("MVP live  ·  Pulse KPIs instrumented  ·  Demo film", {
    x: 11.2, y: 9.5, w: 8.3, h: 0.4,
    fontSize: 17, fontFace: "Calibri", color: C.body,
    align: "right", valign: "middle", margin: 0,
  });
  addFooter(s, 1);
}

// SLIDE 2 — Problem
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "THE PROBLEM");
  s.addText([
    { text: "Friends get tired. Therapy has a queue.", options: { color: C.inkDark, breakLine: true } },
    { text: "Journals don't talk back.", options: { color: C.orange, italic: true } },
  ], {
    x: 0.85, y: 1.7, w: 18.3, h: 2.4,
    fontSize: 48, fontFace: "Calibri", valign: "top", margin: 0,
  });
  const cols = [
    { x: 0.85, stat: "2–6w", desc: "Typical wait for a first therapy session in many US / urban IN cities", src: "Industry wait-time ranges, 2024–25" },
    { x: 7.2, stat: "$150+", desc: "Per session, before you know if the fit is even right", src: "Private-practice cash rates" },
    { x: 13.55, stat: "2am", desc: "When grief is loudest — and every human channel is asleep", src: "User interviews / grief forums" },
  ];
  for (const col of cols) {
    s.addShape(pres.shapes.LINE, {
      x: col.x, y: 5.5, w: 5.6, h: 0,
      line: { color: C.divider, width: 0.75 },
    });
    s.addText(col.stat, {
      x: col.x, y: 5.7, w: 5.6, h: 1.4,
      fontSize: 64, fontFace: "Calibri", color: C.orange, valign: "top", margin: 0,
    });
    s.addText(col.desc, {
      x: col.x, y: 7.3, w: 5.6, h: 1.2,
      fontSize: 18, fontFace: "Calibri", color: C.ink, valign: "top", margin: 0,
    });
    s.addText(col.src, {
      x: col.x, y: 8.7, w: 5.6, h: 0.5,
      fontSize: 14, fontFace: "Calibri", color: C.muted, valign: "top", margin: 0,
    });
  }
  addFooter(s, 2);
}

// SLIDE 3 — Insight
{
  const s = pres.addSlide();
  addBackground(s);
  s.addShape(pres.shapes.OVAL, {
    x: 11.5, y: -2.5, w: 13.5, h: 13.5,
    fill: { color: C.peach }, line: { color: C.peach, width: 0 },
  });
  addSectionLabel(s, "THE INSIGHT");
  s.addText([
    { text: "The missing layer isn't more AI.", options: { color: C.inkDark, breakLine: true } },
    { text: "It's ", options: { color: C.inkDark } },
    { text: "presence.", options: { color: C.orange, italic: true } },
  ], {
    x: 0.85, y: 1.8, w: 18, h: 2.2,
    fontSize: 44, fontFace: "Calibri", valign: "top", margin: 0,
  });
  const gaps = [
    { t: "ChatGPT / Claude", d: "Brilliant, faceless, feels like a search engine at 2am." },
    { t: "Replika", d: "Companionship that drifts into romance. Wrong register for grief." },
    { t: "BetterHelp", d: "Real humans — and a wait, a form, a credit card." },
    { t: "GriefCompanion", d: "A named face, a voice matched to your age, no account, no stored transcript." },
  ];
  gaps.forEach((g, i) => {
    const y = 4.3 + i * 1.35;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.85, y: y, w: 18.3, h: 1.2,
      fill: { color: i === 3 ? C.peachLt : C.cardBg },
      line: { color: C.divider, width: 0.75 },
      rectRadius: 0.08,
    });
    s.addText(g.t, {
      x: 1.15, y: y + 0.12, w: 4.5, h: 0.95,
      fontSize: 20, fontFace: "Calibri", bold: true, color: C.inkDark, valign: "middle", margin: 0,
    });
    s.addText(g.d, {
      x: 5.8, y: y + 0.12, w: 12.9, h: 0.95,
      fontSize: 20, fontFace: "Calibri", color: C.body, valign: "middle", margin: 0,
    });
  });
  addFooter(s, 3);
}

// SLIDE 4 — Product
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "THE PRODUCT");
  s.addText("A session you can start in 20 seconds.", {
    x: 0.85, y: 1.6, w: 18, h: 0.7,
    fontSize: 36, fontFace: "Calibri", color: C.inkDark, margin: 0,
  });
  const steps = [
    { n: "01", t: "Name a companion", d: "Ava, or yours. Pick Warm / Calm / Gentle." },
    { n: "02", t: "Say who you are", d: "Life stage + kind of loss — optional, never required." },
    { n: "03", t: "AI disclosure", d: "Hard gate. Crisis lines on screen before a word is said." },
    { n: "04", t: "Talk", d: "Mic or keyboard. Face listens. Voice answers in 2–3 sentences." },
    { n: "05", t: "Leave clean", d: "Download a .txt for you. Server stored nothing." },
  ];
  steps.forEach((st, i) => {
    const x = 0.85 + i * 3.75;
    s.addText(st.n, {
      x: x, y: 2.6, w: 3.4, h: 0.5,
      fontSize: 16, fontFace: "Calibri", bold: true, color: C.orange, charSpacing: 2, margin: 0,
    });
    s.addText(st.t, {
      x: x, y: 3.2, w: 3.4, h: 1.1,
      fontSize: 24, fontFace: "Calibri", bold: true, color: C.inkDark, margin: 0,
    });
    s.addText(st.d, {
      x: x, y: 4.4, w: 3.4, h: 1.6,
      fontSize: 16, fontFace: "Calibri", color: C.body, margin: 0,
    });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.85, y: 6.4, w: 18.3, h: 3.5,
    fill: { color: C.phoneDark }, line: { color: C.phoneDark, width: 0 }, rectRadius: 0.1,
  });
  s.addText("North star  ·  a moment of presence", {
    x: 1.2, y: 6.65, w: 17.5, h: 0.4,
    fontSize: 14, fontFace: "Calibri", bold: true, color: C.peach, charSpacing: 2, margin: 0,
  });
  s.addText("Session with ≥ 3 user turns", {
    x: 1.2, y: 7.15, w: 17.5, h: 0.7,
    fontSize: 32, fontFace: "Calibri", color: "FFFFFF", margin: 0,
  });
  s.addText("Not DAU. Not time-on-site. Did someone stay long enough to actually say the thing?\nGuardrail: 0 conversation logs on the server. Crisis copy in prompt, disclosure, footer, and a live banner.", {
    x: 1.2, y: 8.0, w: 17.5, h: 1.5,
    fontSize: 18, fontFace: "Calibri", color: "E8DCC8", margin: 0,
  });
  addFooter(s, 4);
}

// SLIDE 5 — Why this wins the assignment
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "WHY THIS, NOT ANOTHER TUTOR");
  s.addText("Interviewers will remember the 2am product. They will not remember another mock interview bot.", {
    x: 0.85, y: 1.65, w: 18.3, h: 1.2,
    fontSize: 28, fontFace: "Calibri", italic: true, color: C.body, margin: 0,
  });
  const cards = [
    { t: "Avatar is additive", d: "A talking face changes the emotional register. Text is a tool. A face is company." },
    { t: "Voice is the product", d: "Web Speech API, $0. Rate and pitch shift by life stage so a 68-year-old is not spoken to like a 24-year-old." },
    { t: "Transparent AI", d: "Disclosure is a hard gate, not a footer. Grief users already know this is not their person." },
    { t: "Free to demo live", d: "No watermark, no minute cap on the CSS face. Video APIs are week-2, not the live interview." },
  ];
  cards.forEach((c, i) => {
    const x = 0.85 + (i % 2) * 9.3;
    const y = 3.1 + Math.floor(i / 2) * 3.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 8.9, h: 3.05,
      fill: { color: C.cardBg }, line: { color: C.divider, width: 0.75 }, rectRadius: 0.1,
    });
    s.addText(c.t, {
      x: x + 0.4, y: y + 0.35, w: 8.1, h: 0.7,
      fontSize: 24, fontFace: "Calibri", bold: true, color: C.inkDark, margin: 0,
    });
    s.addText(c.d, {
      x: x + 0.4, y: y + 1.15, w: 8.1, h: 1.5,
      fontSize: 18, fontFace: "Calibri", color: C.body, margin: 0,
    });
  });
  addFooter(s, 5);
}

// SLIDE 6 — Decisions + stack
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "THE HARD CALLS  ·  ALL FREE");
  const rows = [
    ["Face", "CSS/SVG avatar, not Tavus/HeyGen", "Live demo cannot die on a 20-minute free tier or a watermark."],
    ["Voice", "Browser Web Speech", "$0. Works in Chrome/Edge. Age-tuned rate/pitch."],
    ["Brain", "Grok 4.6 (SpaceXAI) via server proxy", "Key never in the client. Claude is a one-env fallback."],
    ["Video film", "Generated stills + 6s shots", "Cinematic demo of three age groups without paying per streamed minute."],
    ["Memory", "In-session only", "Privacy is the feature. Transcript is a download, not our database."],
    ["Analytics", "Counts, never content", "Pulse page for the deck. Vercel Analytics if we deploy."],
  ];
  rows.forEach((r, i) => {
    const y = 1.7 + i * 1.3;
    s.addText(r[0], {
      x: 0.85, y: y, w: 2.6, h: 1.1,
      fontSize: 18, fontFace: "Calibri", bold: true, color: C.orange, valign: "middle", margin: 0,
    });
    s.addText(r[1], {
      x: 3.6, y: y, w: 7.2, h: 1.1,
      fontSize: 20, fontFace: "Calibri", bold: true, color: C.inkDark, valign: "middle", margin: 0,
    });
    s.addText(r[2], {
      x: 11.0, y: y, w: 8.1, h: 1.1,
      fontSize: 18, fontFace: "Calibri", color: C.body, valign: "middle", margin: 0,
    });
  });
  addFooter(s, 6);
}

// SLIDE 7 — GTM
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "GO TO MARKET  ·  THREE DOORS, ONE PRODUCT");
  const segs = [
    { who: "20s–30s", where: "r/petloss, r/BreakUps, late TikTok/X", line: "It's AI. It's free. I built it because 2am is quiet." },
    { who: "30s–50s", where: "r/grief, r/widowers, Google 'cope with grief alone'", line: "Not a therapist. A place to say it out loud before the appointment." },
    { who: "50s+", where: "Family forwards the link. Larger type, slower voice.", line: "No password. Press the circle and talk." },
  ];
  segs.forEach((g, i) => {
    const x = 0.85 + i * 6.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: 1.7, w: 5.9, h: 5.5,
      fill: { color: C.cardBg }, line: { color: C.divider, width: 0.75 }, rectRadius: 0.1,
    });
    s.addText(g.who, {
      x: x + 0.35, y: 1.95, w: 5.2, h: 0.6,
      fontSize: 26, fontFace: "Calibri", bold: true, color: C.orange, margin: 0,
    });
    s.addText(g.where, {
      x: x + 0.35, y: 2.7, w: 5.2, h: 1.5,
      fontSize: 18, fontFace: "Calibri", color: C.ink, margin: 0,
    });
    s.addText(g.line, {
      x: x + 0.35, y: 4.4, w: 5.2, h: 2.3,
      fontSize: 20, fontFace: "Calibri", italic: true, color: C.body, margin: 0,
    });
  });
  s.addText("Rule: never DM a freshly bereaved stranger with a pitch. Public posts, full transparency, ask if it feels wrong. That question is the product research.", {
    x: 0.85, y: 7.5, w: 18.3, h: 1.5,
    fontSize: 20, fontFace: "Calibri", color: C.inkDark, margin: 0,
  });
  addFooter(s, 7);
}

// SLIDE 8 — KPIs
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "KPIs WE WILL SCREENSHOT");
  s.addText("Targets for 24h. Pulse lives in the product — never stores what people said.", {
    x: 0.85, y: 1.6, w: 18, h: 0.55,
    fontSize: 20, fontFace: "Calibri", color: C.body, margin: 0,
  });
  const kpis = [
    { n: "100+", l: "Landing views", w: "X / Reddit / friends" },
    { n: "20", l: "Session starts", w: "Clicked through disclosure" },
    { n: "10", l: "≥3-turn sessions", w: "North star — presence" },
    { n: "15", l: "Waitlist emails", w: "Intent to return" },
    { n: "3+", l: "Qualitative replies", w: "Did this feel wrong?" },
    { n: "mix", l: "Voice vs text", w: "Learning for week 2" },
  ];
  kpis.forEach((k, i) => {
    const x = 0.85 + (i % 3) * 6.2;
    const y = 2.35 + Math.floor(i / 3) * 3.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 5.9, h: 3.2,
      fill: { color: C.cardBg }, line: { color: C.divider, width: 0.75 }, rectRadius: 0.1,
    });
    s.addText(k.n, {
      x: x + 0.35, y: y + 0.3, w: 5.2, h: 1.1,
      fontSize: 40, fontFace: "Calibri", color: C.orange, margin: 0,
    });
    s.addText(k.l, {
      x: x + 0.35, y: y + 1.45, w: 5.2, h: 0.55,
      fontSize: 22, fontFace: "Calibri", bold: true, color: C.inkDark, margin: 0,
    });
    s.addText(k.w, {
      x: x + 0.35, y: y + 2.1, w: 5.2, h: 0.7,
      fontSize: 16, fontFace: "Calibri", color: C.muted, margin: 0,
    });
  });
  addFooter(s, 8);
}

// SLIDE 9 — Next 2 weeks
{
  const s = pres.addSlide();
  addBackground(s);
  addSectionLabel(s, "NEXT TWO WEEKS  ·  IF THIS EARNS THE RIGHT");
  const next = [
    { n: "01", t: "A/B avatar vs text-only", d: "Prove presence increases ≥3-turn rate. Kill the face if it doesn't." },
    { n: "02", t: "Tavus CVI behind a toggle", d: "Photoreal video for funded demos. CSS remains the default so minutes never brick the product." },
    { n: "03", t: "On-device affect (MediaPipe)", d: "Gaze / frown stay on the laptop. Never upload a grief face." },
    { n: "04", t: "Accounts, on their terms", d: "Waitlist is the demand signal. Memory is opt-in, encrypted, deletable." },
    { n: "05", t: "Crisis routing", d: "Already in prompt + UI. Next: a dedicated handoff, not an affiliate." },
  ];
  next.forEach((item, i) => {
    const y = 1.7 + i * 1.5;
    s.addText(item.n, {
      x: 0.85, y: y, w: 1.4, h: 1.3,
      fontSize: 22, fontFace: "Calibri", bold: true, color: C.orange, valign: "middle", margin: 0,
    });
    s.addText(item.t, {
      x: 2.5, y: y, w: 6.5, h: 1.3,
      fontSize: 24, fontFace: "Calibri", bold: true, color: C.inkDark, valign: "middle", margin: 0,
    });
    s.addText(item.d, {
      x: 9.2, y: y, w: 10, h: 1.3,
      fontSize: 20, fontFace: "Calibri", color: C.body, valign: "middle", margin: 0,
    });
  });
  addFooter(s, 9);
}

pres.writeFile({ fileName: "/Users/soumyajitghosh/grief-companion/deck/GriefCompanion-PM-assignment.pptx" })
  .then(() => console.log("Wrote GriefCompanion-PM-assignment.pptx"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
