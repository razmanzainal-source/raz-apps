#!/usr/bin/env python3
"""Jana kad OG 1200x630 untuk setiap app (pratonton kongsi WhatsApp/FB/X).

Guna: python3 scripts/make-og.py
Output: assets/og/<slug>.png
"""
import json
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

BG = (9, 11, 17)
WHITE = (244, 246, 252)
MUTED = (166, 174, 194)


def font(path, size):
    return ImageFont.truetype(path, size)


def text_w(draw, text, f):
    return draw.textbbox((0, 0), text, font=f)[2]


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_w(draw, trial, f) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def accent_from(icon):
    im = icon.convert("RGB").resize((32, 32))
    px = list(im.getdata())
    # Ambil warna paling terang/berwarna, bukan putih/hitam.
    scored = sorted(
        px,
        key=lambda c: (max(c) - min(c)) * 2 + sum(c) / 3 - abs(max(c) - min(c)) * 0.15,
        reverse=True,
    )
    return scored[max(0, len(scored) // 12)]


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def blob(size, color, alpha):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([size[0], size[1], size[2], size[3]], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(110))


def build(app):
    icon_path = os.path.join(ROOT, app["icon"])
    try:
        icon = Image.open(icon_path).convert("RGBA")
    except Exception:
        icon = Image.new("RGBA", (256, 256), (90, 70, 200, 255))

    accent = accent_from(icon)
    accent2 = tuple(max(0, min(255, int(c * 0.55 + 40))) for c in accent[::-1])

    bg = Image.new("RGB", (W, H), BG).convert("RGBA")
    bg = Image.alpha_composite(bg, blob((250, -260, 900, 300), accent, 110))
    bg = Image.alpha_composite(bg, blob((780, 210, 1320, 780), accent2, 90))

    # Jalur halus di kiri.
    d = ImageDraw.Draw(bg)
    for x in range(0, 6):
        d.rectangle([0, 0, 3, H], fill=accent + (255,))

    # Ikon.
    ic = icon.resize((132, 132), Image.LANCZOS)
    shadow = Image.new("RGBA", (170, 170), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([19, 19, 151, 151], 36, fill=(0, 0, 0, 150))
    bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)), (60, 106))
    bg.alpha_composite(rounded(ic, 30), (72, 110))

    d = ImageDraw.Draw(bg)
    d.text((224, 112), "RazApps", font=font(BOLD, 30), fill=MUTED)

    # Nama app (maks 2 baris, saiz menyesuaikan).
    name = app["name"]
    size = 72
    nf = font(BOLD, size)
    while text_w(d, name, nf) > 690 and size > 46:
        size -= 4
        nf = font(BOLD, size)
    lines = wrap(d, name, nf, 690)

    y = 300 if len(lines) == 1 else 264
    for line in lines[:2]:
        d.text((72, y), line, font=nf, fill=WHITE)
        y += int(size * 1.1)

    # Tagline.
    tf = font(REG, 34)
    ty = max(y + 10, 402)
    for line in wrap(d, app.get("tagline", ""), tf, 680)[:2]:
        d.text((72, ty), line, font=tf, fill=MUTED)
        ty += 44

    # Cip.
    chips = []
    if app.get("version"):
        chips.append("v" + str(app["version"]))
    if app.get("apk"):
        chips.append("Android APK")
    if app.get("ios"):
        chips.append("App Store")
    if app.get("web"):
        chips.append("Web")
    if app.get("comingSoon"):
        chips.append("Coming soon")

    cx = 72
    cf = font(BOLD, 22)
    for chip in chips[:4]:
        cw = text_w(d, chip, cf) + 34
        d.rounded_rectangle([cx, 520, cx + cw, 566], 23, fill=(255, 255, 255, 18),
                            outline=(255, 255, 255, 46), width=1)
        d.text((cx + 17, 530), chip, font=cf, fill=WHITE)
        cx += cw + 12

    d.text((72, 584), "raz-apps.pages.dev", font=font(REG, 24), fill=(124, 132, 152))

    # Telefon / tangkapan skrin di kanan.
    shots = app.get("shots") or []
    panel_x, panel_w = 830, 300
    if shots:
        try:
            shot = Image.open(os.path.join(ROOT, shots[0])).convert("RGB")
            ph = 690
            pw = int(shot.width * ph / shot.height)
            shot = shot.resize((pw, ph), Image.LANCZOS)
            shot = rounded(shot.convert("RGBA"), 34)
            px = panel_x + (panel_w - pw) // 2
            shadow = Image.new("RGBA", (pw + 60, ph + 60), (0, 0, 0, 0))
            ImageDraw.Draw(shadow).rounded_rectangle([30, 30, pw + 30, ph + 30], 40, fill=(0, 0, 0, 170))
            bg.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(22)), (px - 30, 12))
            bg.alpha_composite(shot, (px, 42))
            # Bingkai nipis.
            d = ImageDraw.Draw(bg)
            d.rounded_rectangle([px, 42, px + pw, 42 + ph], 34, outline=(255, 255, 255, 56), width=2)
        except Exception:
            shots = []

    if not shots:
        big = rounded(icon.resize((300, 300), Image.LANCZOS), 66)
        bg.alpha_composite(big, (panel_x + 10, 170))

    # Vignette bawah supaya teks lembut.
    grad = Image.new("L", (1, H))
    for yy in range(H):
        grad.putpixel((0, yy), int(150 * max(0, (yy - 360) / (H - 360))))
    grad = grad.resize((W, H))
    black = Image.new("RGBA", (W, H), (3, 4, 8, 255))
    black.putalpha(grad)
    bg = Image.alpha_composite(bg, black)

    out = os.path.join(ROOT, "assets", "og", app["slug"] + ".png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bg.convert("RGB").save(out, "PNG", optimize=True)
    return out


def main():
    with open(os.path.join(ROOT, "data", "apps.json")) as f:
        apps = json.load(f)["apps"]
    for app in apps:
        print(build(app))


if __name__ == "__main__":
    main()
