#!/usr/bin/env python3
"""Sinh ảnh nền trên không tĩnh cho mô phỏng (không dùng tile API)."""
from __future__ import annotations

import math
import os
import random
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    raise SystemExit("Cần Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "2d" / "assets" / "maps"
W, H = 960, 720
COUNT = 16


def noise_fill(img: Image.Image, base: tuple[int, int, int], spread: int = 28) -> None:
    px = img.load()
    for y in range(H):
        for x in range(W):
            r = base[0] + random.randint(-spread, spread)
            g = base[1] + random.randint(-spread, spread)
            b = base[2] + random.randint(-spread, spread)
            px[x, y] = (
                max(0, min(255, r)),
                max(0, min(255, g)),
                max(0, min(255, b)),
            )


def draw_runway(d: ImageDraw.ImageDraw, cx: int, cy: int, length: int, width: int, angle: float) -> None:
    cos, sin = math.cos(angle), math.sin(angle)
    pts = []
    for sx, sy in [(-length / 2, -width / 2), (length / 2, -width / 2), (length / 2, width / 2), (-length / 2, width / 2)]:
        rx = cx + sx * cos - sy * sin
        ry = cy + sx * sin + sy * cos
        pts.append((rx, ry))
    d.polygon(pts, fill=(190, 188, 175))
    d.line([(pts[0][0], pts[0][1]), (pts[1][0], pts[1][1])], fill=(240, 240, 235), width=3)


def make_theme(idx: int) -> tuple[Image.Image, str]:
    random.seed(1000 + idx)
    themes = [
        ("Sân bay", (120, 128, 108)),
        ("Đồng ruộng", (95, 118, 72)),
        ("Ven biển", (88, 115, 128)),
        ("Đô thị", (108, 105, 98)),
        ("Cồn cát", (158, 142, 108)),
        ("Rừng mở", (62, 98, 58)),
        ("Bãi đất", (132, 118, 92)),
        ("Cảng nhỏ", (78, 102, 118)),
        ("Sông uốn", (90, 110, 85)),
        ("Khu công nghiệp", (115, 110, 100)),
        ("Đồi cỏ", (102, 125, 78)),
        ("Đầm lầy", (82, 105, 88)),
        ("Sa mạc đá", (145, 130, 105)),
        ("Sân tập", (125, 120, 100)),
        ("Đảo nhỏ", (72, 118, 135)),
        ("Cánh đồng", (108, 128, 75)),
    ]
    name, base = themes[idx % len(themes)]
    img = Image.new("RGB", (W, H))
    noise_fill(img, base, 22)
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    d = ImageDraw.Draw(img)

    if "Sân bay" in name or "Sân tập" in name:
        draw_runway(d, W // 2, H // 2, 420, 48, -0.15)
        draw_runway(d, W // 2 + 80, H // 2 + 60, 260, 32, 1.2)
    elif "Ven biển" in name or "Cảng" in name or "Đảo" in name:
        d.polygon([(W, 0), (W, H), (W - 280, H), (W - 120, 0)], fill=(45, 95, 125))
        d.rectangle([60, 200, 220, 520], fill=(135, 125, 110))
    elif "Đô thị" in name or "công nghiệp" in name:
        for _ in range(35):
            x, y = random.randint(40, W - 80), random.randint(40, H - 80)
            ww, hh = random.randint(30, 90), random.randint(25, 70)
            d.rectangle([x, y, x + ww, y + hh], fill=(145, 140, 132))
    elif "Sông" in name or "Đầm" in name:
        d.line([(0, H // 2 + 40), (W, H // 2 - 30)], fill=(55, 95, 115), width=55)
    elif "Rừng" in name:
        for _ in range(120):
            x, y = random.randint(0, W), random.randint(0, H)
            d.ellipse([x, y, x + 18, y + 14], fill=(48, 82, 52))
    else:
        for _ in range(18):
            x, y = random.randint(80, W - 80), random.randint(80, H - 80)
            d.ellipse([x - 40, y - 28, x + 40, y + 28], fill=(base[0] + 15, base[1] + 12, base[2] + 8))

    # Lưới đường mờ (giống ảnh huấn luyện)
    for gx in range(0, W, 80):
        d.line([(gx, 0), (gx, H)], fill=(255, 255, 255, 35), width=1)
    for gy in range(0, H, 80):
        d.line([(0, gy), (W, gy)], fill=(255, 255, 255, 35), width=1)

    return img, name


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for i in range(COUNT):
        img, label = make_theme(i)
        fname = f"map-{i + 1:02d}.jpg"
        path = OUT / fname
        img.save(path, "JPEG", quality=82, optimize=True)
        manifest.append({"file": fname, "label": label})
        print("wrote", path)
    print(f"Done: {COUNT} maps in {OUT}")


if __name__ == "__main__":
    main()
