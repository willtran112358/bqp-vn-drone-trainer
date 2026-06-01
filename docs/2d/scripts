#!/usr/bin/env python3
"""Gộp manifest.json từ ảnh có trong assets/wiki/."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "wiki"
TITLES = {
    "sim-structure": "Unmanned aerial vehicle",
    "uav-khai-niem": "Quadcopter",
    "ucav": "Unmanned combat aerial vehicle",
    "vu-c2": "Loitering munition",
    "vn-uav-eco": "Viettel",
    "us-reaper": "General Atomics MQ-9 Reaper",
    "us-stealth-uav": "Kratos XQ-58 Valkyrie",
    "cn-wing-loong": "CAIG Wing Loong",
    "cn-j20-h20": "Chengdu J-20",
    "ru-orion": "Kronshtadt Orion",
    "tr-tb2": "Bayraktar TB2",
    "ir-shahed": "Shahed 129",
    "il-hermes": "Elbit Hermes 450",
    "stealth-tech": "Northrop Grumman B-2 Spirit",
    "bien-dong": "South China Sea",
    "bqp-doctrine": "People's Army of Vietnam",
}

meta = {}
for aid, title in TITLES.items():
    p = OUT / f"{aid}.jpg"
    if p.exists() and p.stat().st_size > 400:
        meta[aid] = {
            "file": f"assets/wiki/{aid}.jpg",
            "credit": f"Wikipedia — {title}",
            "alt": title,
        }
(OUT / "manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
js = Path(__file__).resolve().parent.parent / "wiki-images.js"
js.write_text(
    "/** Auto-generated from assets/wiki/manifest.json */\n"
    f"export const WIKI_IMAGES = {json.dumps(meta, ensure_ascii=False, indent=2)};\n",
    encoding="utf-8",
)
print(len(meta), "entries -> manifest.json + wiki-images.js")
