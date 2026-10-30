"""Generate editorial cover art and the default Open Graph image.

This is a local, build-time asset helper. It is not required to run or deploy the site.
The generated JPG/PNG files are committed under public/images.

Usage:
    python scripts/generate_assets.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
COVER_DIR = ROOT / "public" / "images" / "covers"
PUBLIC_IMG = ROOT / "public" / "images"
COVER_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_IMG.mkdir(parents=True, exist_ok=True)

FONT_SERIF = Path(r"C:\Windows\Fonts\simsun.ttc")
FONT_SANS = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_SANS_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_GEORGIA = Path(r"C:\Windows\Fonts\georgia.ttf")
FONT_GEORGIA_BOLD = Path(r"C:\Windows\Fonts\georgiab.ttf")

PALETTES = {
    "navy": {
        "bg": (11, 31, 51),
        "fg": (245, 242, 234),
        "muted": (166, 181, 190),
        "accent": (185, 148, 99),
        "line": (84, 104, 119),
    },
    "slate": {
        "bg": (19, 43, 61),
        "fg": (242, 239, 231),
        "muted": (157, 178, 190),
        "accent": (192, 158, 110),
        "line": (78, 105, 119),
    },
    "sand": {
        "bg": (231, 223, 207),
        "fg": (18, 38, 56),
        "muted": (101, 110, 114),
        "accent": (139, 92, 53),
        "line": (190, 178, 158),
    },
    "ice": {
        "bg": (222, 231, 230),
        "fg": (12, 37, 56),
        "muted": (88, 108, 116),
        "accent": (56, 96, 103),
        "line": (176, 194, 192),
    },
    "cream": {
        "bg": (247, 244, 236),
        "fg": (11, 31, 51),
        "muted": (98, 111, 118),
        "accent": (153, 105, 62),
        "line": (213, 204, 189),
    },
    "teal": {
        "bg": (24, 63, 70),
        "fg": (244, 241, 232),
        "muted": (167, 192, 190),
        "accent": (205, 172, 116),
        "line": (84, 118, 120),
    },
}

ARTICLES = [
    ("asset-allocation", "2026 资产配置框架：\n在低增长与高波动之间", "资产配置", "2026.10.18", "navy", "allocation"),
    ("ai-infrastructure", "AI 基础设施的下半场：\n从算力叙事到现金流", "行业研究", "2026.10.11", "slate", "network"),
    ("gold-role", "黄金在组合中的角色：\n保险、交易，还是货币替代？", "大类资产", "2026.09.29", "sand", "rings"),
    ("bond-duration", "利率下行期的债券配置：\n久期不是唯一的答案", "大类资产", "2026.09.16", "ice", "curve"),
    ("financial-reading", "产业链视角下的财报阅读：\n从收入质量到资本开支", "研究方法", "2026.09.03", "cream", "documents"),
    ("supply-chain", "供应链重构：\n三条被低估的产业线索", "行业研究", "2026.08.21", "teal", "routes"),
    ("rebalancing", "再平衡的纪律：\n为什么“什么都不做”往往最难", "组合管理", "2026.08.08", "sand", "balance"),
    ("valuation-probability", "估值不是锚，\n而是概率分布", "研究方法", "2026.07.25", "cream", "distribution"),
    ("consumption-brand", "消费分层时代：\n品牌溢价的边界", "行业研究", "2026.07.11", "sand", "layers"),
    ("dollar-liquidity", "美元、流动性与新兴市场：\n一个简化的观察框架", "宏观策略", "2026.06.27", "navy", "waves"),
    ("risk-drawdown", "从夏普比率到回撤预算：\n个人投资者的风险刻度", "组合管理", "2026.06.13", "ice", "drawdown"),
    ("semiconductor-cycle", "半导体周期的位置感：\n库存、资本开支与价格", "行业研究", "2026.05.30", "slate", "circuit"),
]


def font(path: Path, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size, index=index)


def alpha(color: tuple[int, int, int], opacity: int) -> tuple[int, int, int, int]:
    return color[0], color[1], color[2], opacity


def mix(a: tuple[int, int, int], b: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * ratio) for i in range(3))  # type: ignore[return-value]


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> float:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0]


def wrap_title(
    draw: ImageDraw.ImageDraw,
    title: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    lines: list[str] = []
    for raw_line in title.split("\n"):
        current = ""
        for char in raw_line:
            candidate = current + char
            if current and text_width(draw, candidate, fnt) > max_width:
                lines.append(current)
                current = char
            else:
                current = candidate
        if current:
            lines.append(current)
    return lines


def draw_header(
    draw: ImageDraw.ImageDraw,
    palette: dict[str, tuple[int, int, int]],
    category: str,
    index: int,
) -> None:
    fg, muted, accent = palette["fg"], palette["muted"], palette["accent"]
    draw.rectangle((80, 66, 112, 98), fill=accent)
    mark_font = font(FONT_SANS_BOLD, 20)
    mark_box = draw.textbbox((0, 0), "衡", font=mark_font)
    draw.text(
        (96 - (mark_box[2] - mark_box[0]) / 2, 80 - (mark_box[3] - mark_box[1]) / 2 - 1),
        "衡",
        font=mark_font,
        fill=palette["bg"],
    )
    draw.text((128, 64), "衡远研究", font=font(FONT_SANS_BOLD, 23), fill=fg)
    draw.text(
        (128, 94),
        "H E N G Y U A N   R E S E A R C H",
        font=font(FONT_GEORGIA, 10),
        fill=muted,
    )
    category_font = font(FONT_SANS, 19)
    draw.text((1520 - text_width(draw, category, category_font), 66), category, font=category_font, fill=muted)
    number_font = font(FONT_GEORGIA, 14)
    draw.text(
        (1520 - text_width(draw, f"No. {index:02d}", number_font), 94),
        f"No. {index:02d}",
        font=number_font,
        fill=accent,
    )
    draw.line((80, 124, 1520, 124), fill=alpha(muted, 90), width=1)


def draw_grid(
    overlay: Image.Image,
    palette: dict[str, tuple[int, int, int]],
    step: int = 80,
    opacity: int = 24,
) -> None:
    draw = ImageDraw.Draw(overlay)
    for x in range(80, 1521, step):
        draw.line((x, 140, x, 860), fill=alpha(palette["line"], opacity), width=1)
    for y in range(140, 861, step):
        draw.line((80, y, 1520, y), fill=alpha(palette["line"], opacity), width=1)


def draw_art(
    overlay: Image.Image,
    palette: dict[str, tuple[int, int, int]],
    variant: str,
    index: int,
) -> None:
    draw = ImageDraw.Draw(overlay)
    fg, accent, muted = palette["fg"], palette["accent"], palette["muted"]
    rng = random.Random(index * 97)

    if variant == "allocation":
        cx, cy, size = 1130, 380, 238
        draw.ellipse((cx - size, cy - size, cx + size, cy + size), outline=alpha(muted, 70), width=1)
        draw.ellipse((cx - size + 38, cy - size + 38, cx + size - 38, cy + size - 38), outline=alpha(muted, 40), width=1)
        segments = [
            (accent, 208, 325, 30),
            (alpha(fg, 220), 325, 382, 30),
            (alpha(muted, 190), 382, 500, 30),
            (alpha(accent, 120), 500, 558, 30),
        ]
        for color, start, end, width in segments:
            draw.arc((cx - 185, cy - 185, cx + 185, cy + 185), start=start, end=end, fill=color, width=width)
        for angle in (208, 325, 382, 500):
            rad = math.radians(angle)
            x1, y1 = cx + 167 * math.cos(rad), cy + 167 * math.sin(rad)
            x2, y2 = cx + 204 * math.cos(rad), cy + 204 * math.sin(rad)
            draw.line((x1, y1, x2, y2), fill=alpha(palette["bg"], 180), width=3)
        for i, (x, y) in enumerate([(690, 540), (770, 540), (850, 540), (930, 540)]):
            draw.rectangle((x, y, x + 52, y + 6), fill=alpha(fg, 140 - i * 18))

    elif variant == "network":
        nodes = [(860, 250), (1010, 205), (1170, 290), (1320, 225), (1420, 390), (1220, 440), (1020, 420), (880, 500)]
        for i, (x1, y1) in enumerate(nodes):
            for j, (x2, y2) in enumerate(nodes):
                if j <= i:
                    continue
                if rng.random() < 0.35:
                    draw.line((x1, y1, x2, y2), fill=alpha(muted, 55), width=1)
        for i, (x, y) in enumerate(nodes):
            radius = 10 if i % 3 else 17
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=alpha(accent if i % 4 == 0 else fg, 210))
            draw.ellipse((x - radius - 14, y - radius - 14, x + radius + 14, y + radius + 14), outline=alpha(muted, 80), width=1)
        draw.arc((640, 150, 1540, 700), 190, 330, fill=alpha(accent, 110), width=2)

    elif variant == "rings":
        cx, cy = 1130, 380
        for i in range(7):
            radius = 90 + i * 33
            color = accent if i in (2, 5) else fg if i == 3 else muted
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=alpha(color, 130 - i * 9), width=2 if i != 2 else 8)
        draw.ellipse((cx - 96, cy - 96, cx + 96, cy + 96), fill=alpha(accent, 35), outline=alpha(accent, 170), width=1)
        draw.line((710, cy, 1520, cy), fill=alpha(muted, 55), width=1)
        draw.line((cx, 170, cx, 590), fill=alpha(muted, 55), width=1)
        for i in range(5):
            draw.line((720 + i * 150, 560, 760 + i * 150, 600), fill=alpha(accent, 95), width=1)

    elif variant == "curve":
        points = [(720, 520), (790, 500), (860, 485), (930, 440), (1000, 430), (1070, 385), (1140, 372), (1210, 318), (1280, 300), (1350, 250), (1420, 238), (1490, 198)]
        for i in range(len(points) - 1):
            draw.line((points[i], points[i + 1]), fill=alpha(accent, 220), width=4)
        for x, y in points:
            draw.line((x, y, x, 560), fill=alpha(muted, 38), width=1)
            draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=alpha(fg, 210))
        draw.line((700, 560, 1520, 560), fill=alpha(fg, 110), width=1)
        for i, x in enumerate(range(720, 1500, 96)):
            draw.line((x, 560, x, 570), fill=alpha(muted, 120), width=1)

    elif variant == "documents":
        for i in range(3):
            x = 870 + i * 78
            y = 180 + i * 34
            draw.rectangle((x, y, x + 510, y + 360), fill=alpha((255, 255, 255), 70), outline=alpha(fg, 90), width=1)
            draw.rectangle((x + 34, y + 40, x + 220, y + 50), fill=alpha(fg, 140))
            draw.rectangle((x + 34, y + 68, x + 320, y + 75), fill=alpha(muted, 120))
            for row in range(5):
                draw.line((x + 34, y + 120 + row * 26, x + 430 - row * 24, y + 120 + row * 26), fill=alpha(muted, 65), width=1)
            for bar in range(4):
                height = 24 + bar * 16
                draw.rectangle((x + 34 + bar * 60, y + 330 - height, x + 70 + bar * 60, y + 330), fill=alpha(accent, 130))

    elif variant == "routes":
        nodes = [(760, 230), (1000, 340), (1280, 200), (1430, 430), (1110, 510), (820, 500)]
        for i in range(len(nodes)):
            a = nodes[i]
            b = nodes[(i + 1) % len(nodes)]
            steps = 30
            for step in range(steps):
                if step % 2 == 0:
                    t1, t2 = step / steps, (step + 1) / steps
                    x1 = a[0] + (b[0] - a[0]) * t1
                    y1 = a[1] + (b[1] - a[1]) * t1 + math.sin(t1 * math.pi) * 38
                    x2 = a[0] + (b[0] - a[0]) * t2
                    y2 = a[1] + (b[1] - a[1]) * t2 + math.sin(t2 * math.pi) * 38
                    draw.line((x1, y1, x2, y2), fill=alpha(muted, 100), width=1)
        for i, (x, y) in enumerate(nodes):
            draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill=alpha(palette["bg"], 230), outline=alpha(accent if i % 2 else fg, 230), width=3)
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=alpha(accent if i % 2 else fg, 220))

    elif variant == "balance":
        pivot_x, pivot_y = 1120, 350
        draw.line((820, pivot_y - 18, 1420, pivot_y + 18), fill=alpha(fg, 220), width=5)
        draw.polygon([(pivot_x, pivot_y + 92), (pivot_x - 34, pivot_y + 20), (pivot_x + 34, pivot_y + 20)], fill=alpha(accent, 220))
        draw.line((pivot_x, pivot_y + 20, pivot_x, 560), fill=alpha(muted, 140), width=2)
        draw.rectangle((790, pivot_y - 105, 900, pivot_y - 24), fill=alpha(fg, 100), outline=alpha(fg, 150))
        draw.rectangle((1330, pivot_y - 58, 1450, pivot_y + 10), fill=alpha(accent, 120), outline=alpha(accent, 180))
        for i in range(4):
            draw.line((1180 + i * 40, 470, 1180 + i * 40, 560), fill=alpha(muted, 70), width=1)
        draw.line((790, 560, 1470, 560), fill=alpha(fg, 100), width=1)

    elif variant == "distribution":
        base_y = 545
        points = []
        for step in range(121):
            x = 700 + step * 7
            z = (step - 60) / 22
            y = base_y - 300 * math.exp(-0.5 * z * z)
            points.append((x, y))
        polygon = [(700, base_y)] + points + [(1540, base_y)]
        draw.polygon(polygon, fill=alpha(accent, 36))
        draw.line(points, fill=alpha(fg, 220), width=3)
        for x in (930, 1120, 1310):
            draw.line((x, 220, x, base_y), fill=alpha(muted, 80), width=1)
            draw.ellipse((x - 4, 210, x + 4, 218), fill=alpha(accent, 220))
        draw.line((700, base_y, 1540, base_y), fill=alpha(fg, 120), width=1)
        for i in range(8):
            draw.line((720 + i * 112, base_y - 6, 720 + i * 112, base_y + 6), fill=alpha(muted, 100), width=1)

    elif variant == "layers":
        cx, cy = 1150, 380
        for i in range(6):
            radius = 70 + i * 42
            fill = alpha(accent, 35) if i == 2 else None
            outline = alpha(accent if i in (1, 4) else muted, 100)
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=fill, outline=outline, width=2)
        for i in range(3):
            x = 760 + i * 130
            y = 460 - i * 48
            draw.ellipse((x, y, x + 26, y + 26), fill=alpha(fg if i != 1 else accent, 200))
        draw.line((700, 570, 1490, 260), fill=alpha(muted, 55), width=1)

    elif variant == "waves":
        for band in range(7):
            points = []
            for step in range(101):
                x = 690 + step * 8.3
                y = 250 + band * 48 + math.sin(step / 9 + band * 0.7) * (22 + band * 2)
                points.append((x, y))
            draw.line(points, fill=alpha(accent if band == 2 else muted, 130 - band * 10), width=2 if band == 2 else 1)
        draw.line((980, 150, 980, 580), fill=alpha(fg, 70), width=1)
        draw.line((1320, 150, 1320, 580), fill=alpha(fg, 70), width=1)
        draw.ellipse((966, 366, 994, 394), fill=alpha(accent, 210))

    elif variant == "drawdown":
        values = [0, 12, 23, 37, 52, 64, 78, 88, 84, 70, 52, 38, 29, 35, 48, 60, 73, 85, 97, 104]
        points = [(700 + i * 42, 540 - value * 2.55) for i, value in enumerate(values)]
        for i in range(len(points) - 1):
            draw.line((points[i], points[i + 1]), fill=alpha(fg, 220), width=3)
        peak = max(points, key=lambda p: -p[1])
        trough = min(points[6:], key=lambda p: -p[1])
        draw.line((peak[0], peak[1], trough[0], trough[1]), fill=alpha(accent, 170), width=1)
        draw.polygon([(peak[0], peak[1]), trough, (trough[0], peak[1])], fill=alpha(accent, 32))
        draw.ellipse((trough[0] - 7, trough[1] - 7, trough[0] + 7, trough[1] + 7), fill=alpha(accent, 240))
        draw.line((700, 540, 1540, 540), fill=alpha(fg, 100), width=1)

    elif variant == "circuit":
        for x in range(700, 1540, 96):
            draw.line((x, 160, x, 560), fill=alpha(muted, 45), width=1)
        for y in range(160, 561, 80):
            draw.line((700, y, 1540, y), fill=alpha(muted, 45), width=1)
        for i in range(10):
            x = 700 + rng.randint(1, 8) * 96
            y = 160 + rng.randint(1, 4) * 80
            draw.line((x, y, x + 192, y), fill=alpha(accent, 170), width=2)
            draw.line((x + 192, y, x + 192, y + 80), fill=alpha(accent, 120), width=2)
            draw.rectangle((x - 5, y - 5, x + 5, y + 5), fill=alpha(fg, 220))
            draw.ellipse((x + 187, y + 75, x + 197, y + 85), fill=alpha(accent, 210))
        draw.rectangle((1080, 310, 1250, 390), fill=alpha(palette["bg"], 210), outline=alpha(fg, 150), width=2)
        draw.line((1100, 340, 1230, 340), fill=alpha(accent, 170), width=1)


def make_cover(index: int, item: tuple[str, str, str, str, str, str]) -> None:
    slug, title, category, date, palette_name, variant = item
    palette = PALETTES[palette_name]
    width, height = 1600, 1000

    base = Image.new("RGB", (width, height), palette["bg"])
    draw = ImageDraw.Draw(base)
    for y in range(height):
        ratio = y / height
        line_color = mix(palette["bg"], (0, 0, 0), 0.12 * ratio)
        draw.line((0, y, width, y), fill=line_color)

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_grid(overlay, palette)
    art_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw_art(art_layer, palette, variant, index)

    number_font = font(FONT_GEORGIA_BOLD, 210)
    num_text = f"{index:02d}"
    num_width = draw.textlength(num_text, font=number_font)
    draw.text((1518 - num_width, 150), num_text, font=number_font, fill=palette["line"], stroke_width=0)

    base = Image.alpha_composite(base.convert("RGBA"), overlay)
    base = Image.alpha_composite(base, art_layer)
    draw = ImageDraw.Draw(base)

    draw_header(draw, palette, category, index)
    draw.text((80, 570), category, font=font(FONT_SANS, 20), fill=palette["accent"])
    draw.line((80, 602, 1520, 602), fill=alpha(palette["muted"], 80), width=1)

    title_font = font(FONT_SERIF, 64, index=0)
    lines = wrap_title(draw, title, title_font, 1390)
    y = 644
    for line in lines[:3]:
        draw.text((80, y), line, font=title_font, fill=palette["fg"], stroke_width=0)
        y += 78

    draw.line((80, 902, 1520, 902), fill=alpha(palette["muted"], 80), width=1)
    draw.text((80, 924), date, font=font(FONT_GEORGIA, 18), fill=palette["muted"])
    footer = "RESEARCH NOTE / HENGYUAN"
    draw.text(
        (1520 - text_width(draw, footer, font(FONT_GEORGIA, 14)), 927),
        footer,
        font=font(FONT_GEORGIA, 14),
        fill=palette["accent"],
    )

    final = base.convert("RGB")
    final.save(COVER_DIR / f"{slug}.jpg", quality=92, optimize=True, progressive=True)


def draw_spaced_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    spacing: int = 3,
) -> None:
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=fnt, fill=fill)
        x += text_width(draw, char, fnt) + spacing


def make_og_image() -> None:
    width, height = 1200, 630
    palette = PALETTES["navy"]
    img = Image.new("RGB", (width, height), palette["bg"])
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        draw.line((0, y, width, y), fill=mix(palette["bg"], (0, 0, 0), 0.16 * ratio))

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for x in range(50, 1201, 58):
        od.line((x, 0, x, height), fill=alpha(palette["line"], 28), width=1)
    for y in range(0, 631, 58):
        od.line((0, y, 1200, y), fill=alpha(palette["line"], 28), width=1)
    cx, cy = 985, 330
    for i in range(5):
        radius = 100 + i * 34
        od.arc(
            (cx - radius, cy - radius, cx + radius, cy + radius),
            start=205 + i * 12,
            end=340 + i * 8,
            fill=alpha(palette["accent"] if i % 2 == 0 else palette["muted"], 145 - i * 18),
            width=16,
        )
    od.ellipse((cx - 74, cy - 74, cx + 74, cy + 74), outline=alpha(palette["muted"], 65), width=1)
    od.line((50, 109, 1150, 109), fill=alpha(palette["muted"], 70), width=1)
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(img)

    draw.rectangle((50, 40, 78, 68), fill=palette["accent"])
    draw.text((56, 44), "衡", font=font(FONT_SANS_BOLD, 17), fill=palette["bg"])
    draw.text((90, 38), "衡远研究", font=font(FONT_SANS_BOLD, 22), fill=palette["fg"])
    draw_spaced_text(draw, (90, 69), "HENGYUAN RESEARCH", font(FONT_GEORGIA, 9), palette["muted"], spacing=2)

    label_font = font(FONT_SANS, 14)
    draw.text((50, 148), "ASSET ALLOCATION  /  INDUSTRY RESEARCH  /  PORTFOLIO", font=label_font, fill=palette["accent"])
    title_font = font(FONT_SERIF, 61)
    draw.text((50, 196), "在噪声之外，", font=title_font, fill=palette["fg"])
    draw.text((50, 278), "建立自己的资产坐标。", font=title_font, fill=palette["fg"])
    draw.text(
        (52, 388),
        "独立研究 · 长期视角 · 可验证的框架",
        font=font(FONT_SANS, 21),
        fill=palette["muted"],
    )
    draw.line((50, 512, 1150, 512), fill=alpha(palette["muted"], 80), width=1)
    draw.text((50, 536), "HENGYUAN RESEARCH", font=font(FONT_GEORGIA, 14), fill=palette["accent"])
    draw.text((975, 536), "RESEARCH NOTE", font=font(FONT_GEORGIA, 13), fill=palette["muted"])

    img.convert("RGB").save(PUBLIC_IMG / "og-default.jpg", quality=92, optimize=True, progressive=True)


def main() -> None:
    for index, item in enumerate(ARTICLES, start=1):
        make_cover(index, item)
        print(f"cover {index:02d}: {item[0]}.jpg")
    make_og_image()
    print("og-default.jpg")


if __name__ == "__main__":
    main()
