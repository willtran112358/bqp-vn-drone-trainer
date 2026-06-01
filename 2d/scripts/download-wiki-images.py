#!/usr/bin/env python3
"""Tải thumbnail Wikipedia (CC) cho wiki UAV — ~320px, JPEG."""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "wiki"
# article_id -> Wikipedia article title (en or vi)
ARTICLES = {
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

UA = "Mozilla/5.0 (BQP-VN-Drone-Trainer/1.0; educational)"


def fetch_thumb(title: str, width: int = 360) -> dict | None:
    url = (
        "https://en.wikipedia.org/api/rest_v1/page/summary/"
        + urllib.parse.quote(title.replace(" ", "_"))
        + "?redirect=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode())
    thumb = data.get("thumbnail") or {}
    src = thumb.get("source")
    if not src:
        return None
    # Dùng URL thumbnail API trả về (đã đúng kích thước Wikimedia cho phép)
    return {
        "source": src,
        "title": data.get("title", title),
        "description": (data.get("description") or "")[:120],
    }


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    if len(data) < 500:
        return False
    dest.write_bytes(data)
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for aid, title in ARTICLES.items():
        dest = OUT / f"{aid}.jpg"
        if dest.exists() and dest.stat().st_size > 500:
            print(f"{aid} skip (exists)")
            continue
        print(f"{aid} <- {title} ...", end=" ", flush=True)
        try:
            info = fetch_thumb(title)
            if not info:
                print("NO THUMB")
                continue
            if download(info["source"], dest):
                meta[aid] = {
                    "file": f"assets/wiki/{aid}.jpg",
                    "credit": info["title"],
                    "alt": info["description"] or info["title"],
                }
                print(f"OK ({dest.stat().st_size // 1024} KB)")
            else:
                print("FAIL small")
        except Exception as e:
            print(f"ERR {e}")
        time.sleep(1.2)
    (OUT / "manifest.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Done: {len(meta)}/{len(ARTICLES)} images")


if __name__ == "__main__":
    main()
