# -*- coding: utf-8 -*-
"""Carrosséis RT Estética Avançada — estilo editorial (cores chapadas, sem efeitos).

Uso: python3 render.py <pasta_saida>
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import POSTS, WHATS, SITE

OUT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
_logo = os.path.join(HERE, "logo-original.jpg")
LOGO = Image.open(_logo if os.path.exists(_logo) else "/mnt/user-data/uploads/a0faccbf-image.jpg").convert("RGB")

W, H = 1080, 1350
M = 96                     # margem lateral
WINE = (62, 8, 20)         # fundo escuro
WINE_INK = (74, 12, 28)    # texto sobre creme
CREAM = (243, 235, 225)
CREAM_2 = (232, 221, 208)
GOLD = (190, 146, 84)      # dourado chapado
SOFT = (110, 74, 80)       # texto corrido sobre creme
SOFT_D = (214, 196, 184)   # texto corrido sobre vinho

LORA = "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
LORA_I = "/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf"
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"


def lora(size, weight="Regular", italic=False):
    f = ImageFont.truetype(LORA_I if italic else LORA, size)
    name = weight if not italic else ("Italic" if weight == "Regular" else weight + " Italic")
    f.set_variation_by_name(name)
    return f


def inter(size, weight="Regular"):
    return ImageFont.truetype(INTER.format(weight), size)


def tracked(d, xy, s, font, fill, spacing, anchor="l"):
    x, y = xy
    tw = sum(font.getlength(c) for c in s) + spacing * (len(s) - 1)
    if anchor == "r": x -= tw
    elif anchor == "m": x -= tw / 2
    for c in s:
        d.text((x, y), c, font=font, fill=fill, anchor="ls")
        x += font.getlength(c) + spacing
    return tw


def wrap(s, font, maxw):
    words, lines, cur = s.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if font.getlength(t) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def logo_round(size):
    lg = LOGO.resize((size * 2, size * 2), Image.LANCZOS)
    m = Image.new("L", (size * 8, size * 8), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 8 - 1, size * 8 - 1], fill=255)
    m = m.resize((size * 2, size * 2), Image.LANCZOS)
    lg.putalpha(m)
    return lg.resize((size, size), Image.LANCZOS)


def ring(img, cx, cy, r, color, width=2):
    """Anel fino (motivo do selo da marca), desenhado em 2x e reduzido para ficar liso."""
    k = 2
    layer = Image.new("L", (W * k, H * k), 0)
    ImageDraw.Draw(layer).ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], outline=255, width=width * k)
    layer = layer.resize((W, H), Image.LANCZOS)
    img.paste(Image.new("RGB", (W, H), color), (0, 0), layer)


def header(img, dark, label):
    d = ImageDraw.Draw(img)
    fg = CREAM if dark else WINE_INK
    lg = logo_round(64)
    img.paste(lg, (M, 74), lg)
    tracked(d, (M + 84, 116), "RT ESTÉTICA AVANÇADA", inter(21, "SemiBold"), fg, 3.2)
    if label:
        tracked(d, (W - M, 116), label.upper(), inter(19, "Medium"), GOLD, 3, anchor="r")
    d.line([(M, 168), (W - M, 168)], fill=GOLD if dark else (210, 190, 170), width=1)


def footer(img, dark, page, total, left="rtestetica.com.br", right=None):
    d = ImageDraw.Draw(img)
    fg = SOFT_D if dark else SOFT
    d.line([(M, H - 140), (W - M, H - 140)], fill=GOLD if dark else (210, 190, 170), width=1)
    tracked(d, (M, H - 96), left, inter(22, "Medium"), fg, 1.5)
    tracked(d, (W - M, H - 96), right or f"{page:02d} / {total:02d}", inter(22, "Medium"), fg, 2, anchor="r")


def cover(p, total):
    img = Image.new("RGB", (W, H), WINE)
    ring(img, W - 40, 470, 420, (96, 26, 38), 2)
    ring(img, W - 40, 470, 360, (84, 20, 32), 1)
    header(img, True, p["tema"])
    d = ImageDraw.Draw(img)
    l1, l2, l3, sub = p["cover"]
    maxw = W - 2 * M
    f1, f2, f3 = lora(78), lora(124, italic=True), lora(78)
    L2 = wrap(l2, f2, maxw)
    while len(L2) > 2:
        f2 = lora(f2.size - 6, italic=True); L2 = wrap(l2, f2, maxw)
    L1, L3 = wrap(l1, f1, maxw), wrap(l3, f3, maxw)
    lh1, lh2 = 92, int(f2.size * 1.08)
    block = len(L1) * lh1 + len(L2) * lh2 + len(L3) * lh1 + 130
    y = 168 + (H - 140 - 168 - block) // 2 + 70
    for ln in L1: d.text((M, y), ln, font=f1, fill=CREAM, anchor="ls"); y += lh1
    y += 10
    for ln in L2: d.text((M - 4, y + 12), ln, font=f2, fill=GOLD, anchor="ls"); y += lh2
    for ln in L3: d.text((M, y), ln, font=f3, fill=CREAM, anchor="ls"); y += lh1
    y += 20
    d.line([(M, y), (M + 90, y)], fill=GOLD, width=3)
    d.text((M, y + 64), sub, font=inter(34, "Light"), fill=SOFT_D, anchor="ls")
    d.line([(M, H - 140), (W - M, H - 140)], fill=GOLD, width=1)
    tw = tracked(d, (M, H - 96), "DESLIZE PARA O LADO", inter(21, "SemiBold"), CREAM, 3)
    ax = M + tw + 26
    d.line([(ax, H - 104), (ax + 46, H - 104)], fill=GOLD, width=3)
    d.polygon([(ax + 56, H - 104), (ax + 40, H - 113), (ax + 40, H - 95)], fill=GOLD)
    tracked(d, (W - M, H - 96), "MORRINHOS · GO", inter(21, "SemiBold"), SOFT_D, 3, anchor="r")
    return img


def content(p, i, total):
    last = i == len(p["slides"])
    img = Image.new("RGB", (W, H), CREAM if not last else CREAM_2)
    ring(img, W + 60, H - 150, 330, (226, 212, 196) if not last else (218, 202, 184), 2)
    header(img, False, p["tema"])
    d = ImageDraw.Draw(img)
    title, body = p["slides"][i - 1]
    maxw = W - 2 * M - 40
    tf = lora(94, "Medium")
    T = wrap(title, tf, maxw)
    while len(T) > 3:
        tf = lora(tf.size - 6, "Medium"); T = wrap(title, tf, maxw)
    bf = inter(42, "Regular")
    B = wrap(body, bf, maxw - 40)
    lh_t, lh_b = int(tf.size * 1.12), 64
    block = 120 + len(T) * lh_t + 56 + len(B) * lh_b
    y = 420
    d.text((M - 6, y), f"{i:02d}", font=lora(150, italic=True), fill=GOLD, anchor="ls")
    y += 40
    for ln in T: y += lh_t; d.text((M, y), ln, font=tf, fill=WINE_INK, anchor="ls")
    y += 40
    d.line([(M, y), (M + 70, y)], fill=GOLD, width=3)
    y += 16
    for ln in B: y += lh_b; d.text((M, y), ln, font=bf, fill=SOFT, anchor="ls")
    footer(img, False, i + 1, total)
    return img


def cta(p, total):
    img = Image.new("RGB", (W, H), WINE)
    ring(img, W + 40, 300, 340, (96, 26, 38), 2)
    header(img, True, "Agendamentos")
    d = ImageDraw.Draw(img)
    y = 330
    d.text((M, y), "Agende sua", font=lora(96), fill=CREAM, anchor="ls"); y += 120
    d.text((M - 4, y), "avaliação.", font=lora(128, italic=True), fill=GOLD, anchor="ls"); y += 70
    d.line([(M, y), (M + 90, y)], fill=GOLD, width=3); y += 100

    def item(label, value, vf, y):
        tracked(d, (M, y), label, inter(20, "SemiBold"), GOLD, 3)
        d.text((M, y + int(vf.size * 1.25)), value, font=vf, fill=CREAM, anchor="ls")
        return y + int(vf.size * 1.25) + 80
    y = item("WHATSAPP", WHATS, inter(64, "SemiBold"), y)
    y = item("SITE", SITE, inter(46, "Regular"), y)
    tracked(d, (M, y), "ENDEREÇO", inter(20, "SemiBold"), GOLD, 3)
    af = inter(32, "Light")
    for k, ln in enumerate(["Rua Gumercindo Inocêncio de Oliveira, 408",
                            "Jardim Santa Fé · Morrinhos - GO"]):
        d.text((M, y + 50 + k * 46), ln, font=af, fill=SOFT_D, anchor="ls")
    lg = logo_round(150)
    img.paste(lg, (W - M - 150, H - 140 - 50 - 150), lg)
    footer(img, True, total, total, left="Seg a sex · 9h às 19h · com horário marcado", right=" ")
    return img


os.makedirs(OUT, exist_ok=True)
for p in POSTS:
    total = len(p["slides"]) + 2
    d = os.path.join(OUT, p["slug"])
    os.makedirs(d, exist_ok=True)
    cover(p, total).save(f"{d}/1.jpg", quality=93, subsampling=0)
    for i in range(1, len(p["slides"]) + 1):
        content(p, i, total).save(f"{d}/{i + 1}.jpg", quality=93, subsampling=0)
    cta(p, total).save(f"{d}/{total}.jpg", quality=93, subsampling=0)
    print(p["slug"])
