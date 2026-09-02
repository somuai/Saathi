#!/usr/bin/env python3
"""Render 8 Saathi pitch slides as 1920x1080 PNGs with exact copy."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "slide-images"
LOGO = ROOT.parent / "client" / "public" / "logo.png"
OPENER = ROOT / "pitch-opener.jpg"

W, H = 1920, 1080
CREAM = (243, 247, 251)
WHITE = (255, 255, 255)
INK = (27, 36, 48)
MUTED = (90, 104, 122)
SAPPHIRE = (42, 103, 255)
CORAL = (255, 122, 69)
LINE = (220, 228, 238)


def font(size, bold=False, serif=False):
    if serif:
        paths = [
            "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
            "/Library/Fonts/Georgia.ttf",
        ]
    else:
        paths = [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def card(title, eyebrow="SAATHI  ·  INTERN MVP"):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 12), fill=SAPPHIRE)
    if LOGO.exists():
        mark = Image.open(LOGO).convert("RGBA").resize((72, 72), Image.Resampling.LANCZOS)
        img.paste(mark, (72, 36), mark)
    d.text((164, 42), "Saathi", font=font(28, True, True), fill=INK)
    d.text((164, 78), "with you", font=font(18, False, True), fill=MUTED)
    d.text((72, 140), eyebrow, font=font(20, True), fill=SAPPHIRE)
    if title:
        d.text((72, 178), title, font=font(52, True, True), fill=INK)
    d.text((72, 1028), "https://saath-81jt.onrender.com  ·  Maya is an AI  ·  not a counsellor", font=font(18), fill=MUTED)
    d.text((1680, 1028), "", font=font(18), fill=MUTED)
    return img, d


def bullets(d, items, x, y, max_w=1700):
    f = font(28)
    for item in items:
        for i, line in enumerate(wrap(d, item, f, max_w)):
            prefix = "•  " if i == 0 else "    "
            d.text((x, y), prefix + line, font=f, fill=INK)
            y += 44
        y += 14
    return y


def table(d, rows, y, col_x):
    for i, row in enumerate(rows):
        bg = SAPPHIRE if i == 0 else WHITE
        fg = WHITE if i == 0 else INK
        d.rounded_rectangle((72, y, 1848, y + 78), 14, fill=bg, outline=LINE)
        for x, cell in zip(col_x, row):
            use = font(22, True) if i == 0 else font(22)
            d.text((x, y + 24), cell, font=use, fill=CORAL if (i and row[0].startswith("Live")) else fg)
        y += 88
    return y


def slide1():
    base = Image.open(OPENER).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(W // 2):
        a = int(170 * (1 - i / (W / 2)))
        od.line([(i, 0), (i, H)], fill=(15, 22, 32, a))
    img = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)
    if LOGO.exists():
        mark = Image.open(LOGO).convert("RGBA").resize((88, 88), Image.Resampling.LANCZOS)
        img.paste(mark, (80, 72), mark)
    d.text((80, 720), "Saathi", font=font(96, True, True), fill=WHITE)
    d.text((84, 830), "with you", font=font(36, False, True), fill=(255, 200, 160))
    d.text((80, 900), "Someone to talk to at 1am, without waking the house.", font=font(26), fill=(230, 236, 244))
    d.text((80, 1000), "A video call with Maya  ·  AI companion for India  ·  not a counsellor", font=font(20), fill=(180, 190, 204))
    return img


def slide2():
    img, d = card("")
    d.text((72, 178), "Family WhatsApp is tired.", font=font(48, True, True), fill=INK)
    d.text((72, 244), "A counsellor has a queue.", font=font(48, True, True), fill=INK)
    bullets(
        d,
        [
            "Grief in India is private, late, and often unsayable: a parent, a marriage, a shop, an exam, a quiet house.",
            "Friends stop asking. Relatives say “be strong.” Paid therapy is slow and stigmatised.",
            "1am has no waiting room.",
        ],
        72,
        360,
    )
    d.rounded_rectangle((72, 780, 1100, 920), 20, fill=WHITE, outline=LINE)
    d.text((100, 812), "The job is presence, not a diagnosis.", font=font(30, True, True), fill=CORAL)
    d.text((100, 862), "Saathi is a working MVP — not a finished therapy service.", font=font(24), fill=INK)
    return img


def slide3():
    img, d = card("One product. Three Indias.")
    rows = [
        ("Teen / student", "Boards, JEE, NEET, coaching, izzat", "Older sibling. Never “crack it next year.”"),
        ("Adult 30–45", "Sandwich caregiving, layoff, shop closure", "Peer. One next hour."),
        ("Senior", "Widowhood, children abroad, quiet house", "Slow, honouring, continuing bonds."),
    ]
    y = 280
    for title, body, voice in rows:
        d.rounded_rectangle((72, y, 1848, y + 200), 24, fill=WHITE, outline=LINE)
        d.rectangle((72, y, 84, y + 200), fill=SAPPHIRE)
        d.text((120, y + 28), title, font=font(32, True, True), fill=INK)
        d.text((120, y + 84), body, font=font(24), fill=MUTED)
        d.text((120, y + 132), "Maya:  " + voice, font=font(24, True), fill=SAPPHIRE)
        y += 220
    return img


def slide4():
    img, d = card("A live video call with one named person.")
    bullets(
        d,
        [
            "Maya is a Tavus PAL — Mary–Home, Hindi + English.",
            "Disclosure first: she is AI. Crisis lines stay on screen.",
            "The call stays inside Saathi: logo, timer, End call.",
            "Nothing you say is stored here. Pulse counts only.",
        ],
        72,
        280,
    )
    d.text((72, 560), "Session arc", font=font(28, True), fill=SAPPHIRE)
    steps = ["01  Name", "02  Stage", "03  The weight", "04  One breath", "05  Stay on that wound"]
    x = 72
    for i, s in enumerate(steps):
        d.rounded_rectangle((x, 620, x + 340, 820), 20, fill=WHITE, outline=LINE)
        d.ellipse((x + 24, 650, x + 88, 714), fill=CORAL if i == 4 else SAPPHIRE)
        d.text((x + 40, 666), f"{i+1:02d}", font=font(20, True), fill=WHITE)
        d.text((x + 24, 740), s.split("  ", 1)[-1], font=font(24, True), fill=INK)
        x += 360
    return img


def slide5():
    img, d = card("Choices a senior PM would defend.")
    rows = [
        ("We did not", "We did", "Why"),
        ("Face picker", "One companion: Maya", "People pick a problem, not a cast"),
        ("Dump on tavus.daily.co", "In-product room", "Brand, crisis lines, End call"),
        ("Claim “therapy”", "Methods, disclosed AI", "Over-claiming loses India trust"),
        ("Store transcripts", "Counts only", "Grief is not a CRM"),
        ("US 988 as primary", "iCall, Vandrevala, KIRAN", "India first"),
    ]
    table(d, rows, 280, [100, 620, 1180])
    return img


def slide6():
    img, d = card("Safe enough to put in front of a human.")
    bullets(
        d,
        [
            "Crisis overrides everything. Numbers on screen and in Maya’s mouth.",
            "No diagnosis. No medication. No pretending to be the person they lost.",
            "PAL: refuse prescriptions · redirect psychiatric crisis · no clinical diagnosis · stay on topic.",
            "Free Tavus = one live room, 5-minute cap. The demo is a short, held conversation.",
        ],
        72,
        300,
    )
    d.rounded_rectangle((72, 720, 1848, 920), 24, fill=WHITE, outline=LINE)
    d.text((110, 760), "India crisis lines", font=font(24, True), fill=SAPPHIRE)
    d.text((110, 820), "iCall  9152987821     Vandrevala  9999666555     KIRAN  1800-599-0019     Tele-MANAS  14416", font=font(26), fill=INK)
    return img


def slide7():
    img, d = card("If they never start the call, nothing else matters.")
    d.text((72, 270), "North star: live video calls started  (call_started)", font=font(28, True), fill=CORAL)
    rows = [
        ("KPI", "24h target", "Why"),
        ("Landing views", "100", "Did anyone arrive"),
        ("Unique visitors", "80", "Not vanity reloads"),
        ("Sessions started", "20", "Disclosure accepted"),
        ("Live calls started", "10", "NORTH STAR"),
        ("Fallback ≥3 turns", "10", "Still a conversation"),
        ("Waitlist emails", "15", "Permission to return"),
    ]
    table(d, rows, 340, [100, 720, 1100])
    return img


def slide8():
    img, d = card("")
    d.text((72, 178), "Saathi.", font=font(64, True, True), fill=INK)
    d.text((72, 260), "With you.", font=font(64, True, True), fill=CORAL)
    bullets(
        d,
        [
            "A named AI on a video call, for Indian grief that has nowhere to go at night.",
            "Honest about what it is not: not a clinician, not a stored journal, not a five-minute miracle.",
            "This is a working MVP. One live room. About five minutes. Then a sitting note.",
        ],
        72,
        380,
    )
    d.rounded_rectangle((72, 720, 1848, 940), 24, fill=SAPPHIRE)
    d.text((110, 760), "Live for judges", font=font(24, True), fill=(180, 210, 255))
    d.text((110, 810), "https://saath-81jt.onrender.com", font=font(40, True), fill=WHITE)
    d.text((110, 880), "Chrome  ·  allow camera  ·  one room at a time  ·  Maya asks your name first", font=font(24), fill=(220, 230, 255))
    return img


def main():
    OUT.mkdir(exist_ok=True)
    makers = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8]
    names = [
        "01-title",
        "02-the-gap",
        "03-who",
        "04-product",
        "05-choices",
        "06-guardrails",
        "07-kpis",
        "08-close",
    ]
    for name, fn in zip(names, makers):
        img = fn()
        path = OUT / f"{name}.png"
        img.save(path, "PNG")
        print("wrote", path)


if __name__ == "__main__":
    main()
