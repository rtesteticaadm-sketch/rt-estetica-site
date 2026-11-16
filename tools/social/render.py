# -*- coding: utf-8 -*-
import math, random, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from content import POSTS, WHATS, SITE

OUT = sys.argv[1]
MONTH = sys.argv[2] if len(sys.argv) > 2 else ""
LOGO = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo-original.jpg")).convert("RGB")
W, H = 1080, 1350
SERIF = "/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyrepagella-regular.otf"
SERIF_I = "/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyrepagella-italic.otf"
SANS_L = "/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf"
SANS_R = "/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf"
SANS_M = "/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf"
F = lambda p, s: ImageFont.truetype(p, s)

WINE_DARK, WINE = (24, 1, 6), (104, 12, 26)
CREAM = (246, 234, 222)
MUTED = (205, 182, 170)
GOLD = (222, 172, 92)


def bg(seed):
    random.seed(seed)
    small = Image.new("RGB", (W // 6, H // 6))
    px = small.load()
    sw, sh = small.size
    cx, cy = sw * 0.62, sh * 0.32
    for y in range(sh):
        for x in range(sw):
            d = math.hypot(x - cx, (y - cy) * 0.85) / (sh * 0.95)
            t = min(1, d ** 1.15)
            px[x, y] = tuple(int(WINE[i] * (1 - t) + WINE_DARK[i] * t) for i in range(3))
    img = small.resize((W, H), Image.BICUBIC)
    # laser beams
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for x0, bw, a in [(0.10, 10, 60), (0.16, 3, 110), (0.84, 12, 55), (0.90, 3, 100)]:
        X = x0 * W
        d.polygon([(X, -50), (X + bw, -50), (X + bw - H * 0.45, H + 50), (X - H * 0.45, H + 50)], fill=a)
    m = m.filter(ImageFilter.GaussianBlur(5))
    img.paste(Image.new("RGB", (W, H), (235, 150, 90)), (0, 0), m.point(lambda v: int(v * .5)))
    # bokeh
    b = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(b)
    for _ in range(70):
        x, y = random.random() * W, random.random() * H
        r = random.choice([1, 1, 2, 2, 3, 4])
        d.ellipse([x - r, y - r, x + r, y + r], fill=random.randint(50, 150))
    b = b.filter(ImageFilter.GaussianBlur(1))
    img.paste(Image.new("RGB", (W, H), (255, 205, 130)), (0, 0), b)
    # frame
    ImageDraw.Draw(img).rectangle([36, 36, W - 36, H - 36], outline=(170, 118, 50), width=2)
    return img


def gold(size):
    w, h = size
    g = Image.new("RGB", (1, h))
    st = [(0, (252, 222, 152)), (.45, (218, 164, 76)), (.55, (192, 132, 54)), (1, (244, 202, 120))]
    for y in range(h):
        t = y / max(1, h - 1)
        for (a, ca), (bb, cb) in zip(st, st[1:]):
            if a <= t <= bb:
                k = (t - a) / (bb - a)
                g.putpixel((0, y), tuple(int(ca[i] + (cb[i] - ca[i]) * k) for i in range(3)))
                break
    return g.resize((w, h))


def text(img, xy, s, font, fill=CREAM, anchor="la", goldfill=False, shadow=True, spacing=0):
    x, y = xy
    if spacing:
        tw = sum(font.getlength(c) for c in s) + spacing * (len(s) - 1)
        if anchor[0] == "m": x -= tw / 2
        for c in s:
            text(img, (x, y), c, font, fill, "l" + anchor[1], goldfill, shadow)
            x += font.getlength(c) + spacing
        return
    pad = font.size
    bbox = ImageDraw.Draw(img).textbbox((x, y), s, font=font, anchor=anchor)
    box = (int(bbox[0]) - pad, int(bbox[1]) - pad, int(bbox[2]) + pad, int(bbox[3]) + pad)
    m = Image.new("L", (box[2] - box[0], box[3] - box[1]), 0)
    ImageDraw.Draw(m).text((x - box[0], y - box[1]), s, font=font, anchor=anchor, fill=255)
    if shadow:
        sm = m.filter(ImageFilter.GaussianBlur(max(2, font.size // 16)))
        img.paste(Image.new("RGB", m.size, (8, 0, 2)), (box[0] + 2, box[1] + 3), sm.point(lambda v: int(v * .8)))
    src = gold(m.size) if goldfill else Image.new("RGB", m.size, fill)
    img.paste(src, box[:2], m)


def wrap(s, font, maxw):
    words, lines, cur = s.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getlength(t) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def logo_badge(img, cx, cy, size):
    lg = LOGO.resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    m = m.resize((size, size), Image.LANCZOS)
    img.paste(lg, (cx - size // 2, cy - size // 2), m)


def divider(img, cx, y, half):
    d = ImageDraw.Draw(img)
    for i in range(int(half)):
        a = 1 - (i / half) ** 2
        col = tuple(int(WINE[k] * (1 - a) + (226, 176, 96)[k] * a) for k in range(3))
        d.line([(cx + i, y), (cx + i, y + 2)], fill=col)
        d.line([(cx - i, y), (cx - i, y + 2)], fill=col)
    d.ellipse([cx - 5, y - 4, cx + 5, y + 6], fill=(255, 236, 190))


def footer(img, idx, total):
    text(img, (W // 2, H - 92), "RT ESTÉTICA AVANÇADA  ·  " + SITE.upper(), F(SANS_R, 22), MUTED, "mm", spacing=3, shadow=False)
    # page dots
    gap, r = 22, 5
    x0 = W // 2 - (total - 1) * gap / 2
    d = ImageDraw.Draw(img)
    for i in range(total):
        x = x0 + i * gap
        if i == idx: d.ellipse([x - r - 2, H - 62 - r - 2, x + r + 2, H - 62 + r + 2], fill=GOLD)
        else: d.ellipse([x - r + 1, H - 62 - r + 1, x + r - 1, H - 62 + r - 1], outline=(170, 118, 50), width=2)


def arrow(img, cx, cy, w=60):
    d = ImageDraw.Draw(img)
    d.line([(cx - w // 2, cy), (cx + w // 2, cy)], fill=GOLD, width=4)
    d.polygon([(cx + w // 2 + 6, cy), (cx + w // 2 - 12, cy - 11), (cx + w // 2 - 12, cy + 11)], fill=GOLD)


def cover(p, total, seed):
    img = bg(seed)
    l1, l2, l3, sub = p["cover"]
    logo_badge(img, W // 2, 210, 180)
    text(img, (W // 2, 350), p["tema"].upper(), F(SANS_M, 28), GOLD, "mm", spacing=6)
    big = F(SERIF, 132)
    small = F(SERIF, 76)
    it = F(SERIF_I, 74)
    L2 = wrap(l2, big, W - 180)
    while len(L2) > 2:
        big = F(SERIF, big.size - 6); L2 = wrap(l2, big, W - 180)
    L1 = wrap(l1, small, W - 200); L3 = wrap(l3, it, W - 200)
    hb = len(L1) * 92 + len(L2) * int(big.size * 1.08) + len(L3) * 90 + 40 + 120
    top, bottom = 430, H - 230
    y = top + (bottom - top - hb) // 2 + 40
    for ln in L1:
        text(img, (W // 2, y), ln, small, CREAM, "mm"); y += 92
    y += 10
    for ln in L2:
        text(img, (W // 2, y + 10), ln, big, goldfill=True, anchor="mm"); y += int(big.size * 1.08)
    for ln in L3:
        text(img, (W // 2, y), ln, it, CREAM, "mm"); y += 90
    divider(img, W // 2, y + 10, 230)
    text(img, (W // 2, y + 80), sub, F(SANS_L, 38), MUTED, "mm")
    text(img, (W // 2 - 40, H - 170), "ARRASTE PARA O LADO", F(SANS_M, 28), GOLD, "mm", spacing=4)
    arrow(img, W // 2 + 250, H - 170, 50)
    footer(img, 0, total)
    return img


def content(p, i, total, seed):
    img = bg(seed + i)
    title, body = p["slides"][i - 1]
    last = i == len(p["slides"])
    n = F(SERIF, 250)
    tf = F(SERIF, 104 if not last else 112)
    bf = F(SANS_L, 54)
    T = wrap(title, tf, W - 240); B = wrap(body, bf, W - 250)
    hb = 250 + 70 + len(T) * 116 + 50 + len(B) * 80
    y = 180 + (H - 180 - 200 - hb) // 2 + 210
    text(img, (116, y), f"{i:02d}", n, goldfill=True, anchor="ls")
    ImageDraw.Draw(img).line([(124, y + 50), (320, y + 50)], fill=GOLD, width=3)
    y += 170
    for ln in T:
        text(img, (120, y), ln, tf, CREAM if not last else None, "ls", goldfill=last); y += 116
    y += 40
    for ln in B:
        text(img, (122, y), ln, bf, MUTED, "ls", shadow=False); y += 80
    logo_badge(img, W - 160, 170, 120)
    footer(img, i, total)
    return img


def cta(p, total, seed):
    img = bg(seed + 99)
    logo_badge(img, W // 2, 300, 300)
    text(img, (W // 2, 560), "Agende sua", F(SERIF, 84), CREAM, "mm")
    text(img, (W // 2, 660), "avaliação", F(SERIF_I, 120), goldfill=True, anchor="mm")
    divider(img, W // 2, 760, 230)
    # whatsapp pill
    f = F(SANS_M, 44)
    label = "WhatsApp  " + WHATS
    pw, ph = int(f.getlength(label) + 120), 104
    x0, y0 = W // 2 - pw // 2, 830
    m = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=ph // 2, fill=255)
    img.paste(gold((pw, ph)), (x0, y0), m)
    ImageDraw.Draw(img).text((W // 2, y0 + ph // 2), label, font=f, fill=(70, 6, 16), anchor="mm")
    text(img, (W // 2, 1010), SITE, F(SANS_R, 46), CREAM, "mm")
    text(img, (W // 2, 1080), "Morrinhos - GO e região  ·  cidade e zona rural", F(SANS_L, 32), MUTED, "mm", shadow=False)
    text(img, (W // 2, 1130), "Atendimento com horário marcado", F(SANS_L, 32), MUTED, "mm", shadow=False)
    footer(img, total - 1, total)
    return img


os.makedirs(OUT, exist_ok=True)
for k, p in enumerate(POSTS):
    total = len(p["slides"]) + 2
    d = os.path.join(OUT, p["slug"])
    os.makedirs(d, exist_ok=True)
    seed = k * 17 + 3
    cover(p, total, seed).save(f"{d}/1.jpg", quality=92)
    for i in range(1, len(p["slides"]) + 1):
        content(p, i, total, seed).save(f"{d}/{i + 1}.jpg", quality=92)
    cta(p, total, seed).save(f"{d}/{total}.jpg", quality=92)
    print(p["slug"], total)
