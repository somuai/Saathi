#!/usr/bin/env python3
"""Exact KPI / session / India-age boards for the intern review. Not generated art."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
CREAM = (243, 247, 251)
INK = (27, 36, 48)
MUTED = (90, 104, 122)
SAPPHIRE = (42, 103, 255)
CORAL = (255, 122, 69)
WHITE = (255, 255, 255)
LINE = (220, 228, 238)


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def card(w, h, title, eyebrow="SAATH  ·  INTERN REVIEW"):
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, w, 8), fill=SAPPHIRE)
    d.text((64, 36), eyebrow, font=font(18), fill=SAPPHIRE)
    d.text((64, 68), title, font=font(42, True), fill=INK)
    return img, d


def kpi_matrix():
    img, d = card(1600, 1000, "KPI matrix  ·  24-hour demo")
    rows = [
        ("KPI", "What it counts", "24h target", "Why"),
        ("Landing views", "Opens of the home page", "100", "Did anyone arrive"),
        ("Unique visitors", "First-visit cookie gc_seen", "80", "Not vanity reloads"),
        ("Sessions started", "Disclosure accepted", "20", "Intent to talk"),
        ("Live calls started", "Tavus room actually opened", "10", "NORTH STAR"),
        ("Fallback ≥3 turns", "In-app chat if video fails", "10", "Still a conversation"),
        ("Waitlist emails", "Permission to return", "15", "Come-back loop"),
    ]
    cols = [64, 420, 920, 1180]
    y = 160
    for i, row in enumerate(rows):
        bg = WHITE if i else SAPPHIRE
        fg = WHITE if i == 0 else INK
        d.rounded_rectangle((48, y, 1552, y + 84), 12, fill=bg, outline=LINE)
        for x, cell in zip(cols, row):
            use = font(20, True) if i == 0 or row[0] == "Live calls started" else font(20)
            color = CORAL if (not i == 0 and row[3] == "NORTH STAR" and x == cols[0]) else fg
            if row[3] == "NORTH STAR" and i and x == cols[0]:
                color = CORAL
            d.text((x, y + 26), cell, font=use, fill=color)
        y += 96
    d.text(
        (64, 920),
        "Source of truth: in-product Pulse  ·  client/src/Pulse.jsx  ·  server/pulse.json  ·  never stores speech",
        font=font(18),
        fill=MUTED,
    )
    img.save(OUT / "kpi-matrix.png")


def session_arc():
    img, d = card(1600, 900, "Maya session arc")
    steps = [
        ("01", "Name", "What should I call you?"),
        ("02", "Stage", "Child / teen / adult / senior"),
        ("03", "Weight", "What is sitting heaviest tonight?"),
        ("04", "Breathe", "In 4 · hold 4 · out 6 · twice"),
        ("05", "Escalate", "Stay on that named wound"),
    ]
    x = 64
    for i, (num, title, sub) in enumerate(steps):
        d.rounded_rectangle((x, 200, x + 270, 520), 24, fill=WHITE, outline=LINE, width=2)
        d.ellipse((x + 20, 224, x + 88, 292), fill=SAPPHIRE if i < 4 else CORAL)
        d.text((x + 38, 238), num, font=font(22, True), fill=WHITE)
        d.text((x + 24, 330), title, font=font(28, True), fill=INK)
        d.text((x + 24, 380), sub, font=font(18), fill=MUTED)
        if i < 4:
            d.polygon(
                [(x + 282, 350), (x + 310, 366), (x + 282, 382)],
                fill=SAPPHIRE,
            )
        x += 306
    d.rounded_rectangle((64, 580, 1536, 820), 24, fill=WHITE, outline=LINE)
    d.text((96, 616), "The point of the escalation", font=font(24, True), fill=CORAL)
    d.text(
        (96, 668),
        "After the first breathing, Maya does not restart small talk and does not stack exercises.",
        font=font(22),
        fill=INK,
    )
    d.text(
        (96, 716),
        "She returns to the one thing they named — exam, marriage, shop, parent, quiet house —",
        font=font(22),
        fill=INK,
    )
    d.text(
        (96, 764),
        "and works that wound with India-aware methods for their age. Crisis overrides the whole arc.",
        font=font(22),
        fill=INK,
    )
    img.save(OUT / "session-arc.png")


def india_age_map():
    img, d = card(1600, 1000, "What is sitting there, in India")
    cols = [
        (
            "Teen / student",
            [
                "Boards, JEE, NEET, coaching cities",
                "Family izzat and comparison",
                "Sleep, screens, first heartbreak",
                "Maya: older sibling, not a teacher",
            ],
        ),
        (
            "Adult 30–45",
            [
                "Sandwich: children + ageing parents",
                "Layoff, shop or business closure",
                "Divorce stigma, breadwinner identity",
                "Maya: peer. One next hour.",
            ],
        ),
        (
            "Senior",
            [
                "Widowhood; children NRI or far away",
                "Joint family thinning; living alone",
                "Dignity, money, fear of being a burden",
                "Maya: slow, honouring, continuing bonds",
            ],
        ),
    ]
    x = 64
    for title, bullets in cols:
        d.rounded_rectangle((x, 180, x + 480, 900), 28, fill=WHITE, outline=LINE, width=2)
        d.rectangle((x, 180, x + 480, 188), fill=SAPPHIRE)
        d.text((x + 32, 220), title, font=font(28, True), fill=INK)
        yy = 300
        for b in bullets:
            d.ellipse((x + 36, yy + 8, x + 52, yy + 24), fill=CORAL)
            d.text((x + 68, yy), b, font=font(22), fill=INK)
            yy += 88
        x += 512
    img.save(OUT / "india-age-map.png")


def funnel():
    img, d = card(1600, 900, "North-star funnel")
    stages = [
        (100, "Landing view"),
        (80, "Unique visitor"),
        (20, "Session start"),
        (10, "Call started  ·  north star"),
    ]
    y = 200
    for n, label in stages:
        width = 400 + int(n * 8)
        x = (1600 - width) // 2
        color = CORAL if "Call" in label else SAPPHIRE
        d.rounded_rectangle((x, y, x + width, y + 110), 20, fill=color)
        d.text((x + 40, y + 34), f"{n:>3}   {label}", font=font(32, True), fill=WHITE)
        y += 150
    d.text((64, 820), "If they never start the call, nothing else on this page matters.", font=font(22), fill=MUTED)
    img.save(OUT / "kpi-funnel.png")


if __name__ == "__main__":
    kpi_matrix()
    session_arc()
    india_age_map()
    funnel()
    print("wrote", list(OUT.glob("*.png")))
