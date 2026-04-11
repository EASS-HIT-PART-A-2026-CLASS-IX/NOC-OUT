"""
Static Android device specs for QA Lab lookup (codenames, API levels, typical hardware).
Search is fuzzy over market names, model codes, and codenames.
"""

from __future__ import annotations

import random
from typing import Any

DEVICE_CATALOG: list[dict[str, Any]] = [
    {
        "market_name": "Samsung Galaxy S23",
        "model_codes": ["SM-S911B", "SM-S911U", "SM-S911E"],
        "codename": "dm1q",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 6.1",
        "chipset": "Snapdragon 8 Gen 2 (SM8550) or Exynos 2300 (region)",
        "display": '6.1" FHD+ Dynamic AMOLED 2X (1080×2340, 120Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Samsung Galaxy S23 Ultra",
        "model_codes": ["SM-S918B", "SM-S918U"],
        "codename": "dm3q",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 6.1",
        "chipset": "Snapdragon 8 Gen 2",
        "display": '6.8" QHD+ Dynamic AMOLED 2X (1440×3088, 120Hz)',
        "ram": "8GB / 12GB",
    },
    {
        "market_name": "Samsung Galaxy S24",
        "model_codes": ["SM-S921B", "SM-S921U"],
        "codename": "e1s",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 6.1",
        "chipset": "Snapdragon 8 Gen 3 (SM8650-AB) or Exynos 2400",
        "display": '6.2" FHD+ LTPO AMOLED (1080×2340, 120Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Samsung Galaxy S22",
        "model_codes": ["SM-S901B", "SM-S901U"],
        "codename": "r0q",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 6.0",
        "chipset": "Snapdragon 8 Gen 1 / Exynos 2200",
        "display": '6.1" FHD+ AMOLED (1080×2340, 120Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Google Pixel 7",
        "model_codes": ["GVU6C", "GQML3"],
        "codename": "panther",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Pixel UI (stock Android)",
        "chipset": "Google Tensor G2",
        "display": '6.3" FHD+ OLED (1080×2400, 90Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Google Pixel 7 Pro",
        "model_codes": ["GP4BC", "GE2AE"],
        "codename": "cheetah",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Pixel UI",
        "chipset": "Google Tensor G2",
        "display": '6.7" QHD+ LTPO OLED (1440×3120, 120Hz)',
        "ram": "12GB",
    },
    {
        "market_name": "Google Pixel 8",
        "model_codes": ["GKWS6", "G9BQD"],
        "codename": "shiba",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Pixel UI",
        "chipset": "Google Tensor G3",
        "display": '6.2" FHD+ OLED (1080×2400, 120Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Google Pixel 8 Pro",
        "model_codes": ["GC3VE", "G1MNW"],
        "codename": "husky",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Pixel UI",
        "chipset": "Google Tensor G3",
        "display": '6.7" QHD+ LTPO OLED (1344×2992, 120Hz)',
        "ram": "12GB",
    },
    {
        "market_name": "Google Pixel 9",
        "model_codes": ["G2YBB", "GUR25"],
        "codename": "tokay",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Pixel UI",
        "chipset": "Google Tensor G4",
        "display": '6.3" OLED (1080×2424, 120Hz)',
        "ram": "12GB",
    },
    {
        "market_name": "Google Pixel 6a",
        "model_codes": ["GB62Z", "GX7AS"],
        "codename": "bluejay",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "Pixel UI",
        "chipset": "Google Tensor",
        "display": '6.1" FHD+ OLED (1080×2400, 60Hz)',
        "ram": "6GB",
    },
    {
        "market_name": "OnePlus 11",
        "model_codes": ["CPH2449", "PHB110"],
        "codename": "udon",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "OxygenOS 14",
        "chipset": "Snapdragon 8 Gen 2",
        "display": '6.7" QHD+ LTPO3 AMOLED (1440×3216, 120Hz)',
        "ram": "8GB / 16GB",
    },
    {
        "market_name": "OnePlus 12",
        "model_codes": ["CPH2573", "PJD110"],
        "codename": "waffle",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "OxygenOS 15",
        "chipset": "Snapdragon 8 Gen 3",
        "display": '6.82" QHD+ LTPO AMOLED (1440×3168, 120Hz)',
        "ram": "12GB / 16GB",
    },
    {
        "market_name": "Xiaomi 13",
        "model_codes": ["2211133G", "2211133C"],
        "codename": "fuxi",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "MIUI 14 / HyperOS",
        "chipset": "Snapdragon 8 Gen 2",
        "display": '6.36" FHD+ AMOLED (1080×2400, 120Hz)',
        "ram": "8GB / 12GB",
    },
    {
        "market_name": "Xiaomi 14",
        "model_codes": ["23127PN0CG"],
        "codename": "houji",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "HyperOS 2",
        "chipset": "Snapdragon 8 Gen 3",
        "display": '6.36" LTPO AMOLED (1200×2670, 120Hz)',
        "ram": "12GB",
    },
    {
        "market_name": "Nothing Phone (2)",
        "model_codes": ["A065"],
        "codename": "pong",
        "android_version": "15",
        "api_level": 35,
        "os_skin": "Nothing OS 3",
        "chipset": "Snapdragon 8 Gen 2",
        "display": '6.7" FHD+ LTPO OLED (1080×2412, 120Hz)',
        "ram": "8GB / 12GB",
    },
    {
        "market_name": "Motorola Edge 40",
        "model_codes": ["XT2303-2"],
        "codename": "manaus",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "My UX",
        "chipset": "MediaTek Dimensity 8020",
        "display": '6.55" pOLED (1080×2400, 144Hz)',
        "ram": "8GB",
    },
    {
        "market_name": "Samsung Galaxy A54 5G",
        "model_codes": ["SM-A546B"],
        "codename": "a54x",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 6.1",
        "chipset": "Exynos 1380",
        "display": '6.4" FHD+ Super AMOLED (1080×2340, 120Hz)',
        "ram": "6GB / 8GB",
    },
    {
        "market_name": "Samsung Galaxy Z Fold 5",
        "model_codes": ["SM-F946B"],
        "codename": "q5q",
        "android_version": "14",
        "api_level": 34,
        "os_skin": "One UI 5.1.1 / 6.x",
        "chipset": "Snapdragon 8 Gen 2",
        "display": '7.6" QXGA+ foldable + 6.2" cover',
        "ram": "12GB",
    },
]


def _blob(d: dict[str, Any]) -> str:
    parts = [
        d.get("market_name", ""),
        d.get("codename", ""),
        " ".join(d.get("model_codes") or []),
    ]
    return " ".join(parts).lower()


def lookup_devices(query: str, limit: int = 8) -> list[dict[str, Any]]:
    q = (query or "").strip().lower()
    if not q:
        return []

    q_compact = q.replace(" ", "")
    tokens = [t for t in q.replace("-", " ").split() if len(t) >= 2]

    scored: list[tuple[int, dict[str, Any]]] = []
    for d in DEVICE_CATALOG:
        blob = _blob(d)
        score = 0
        if q in blob or q_compact in blob.replace(" ", ""):
            score += 50
        for t in tokens:
            if t in blob:
                score += 8
            for code in d.get("model_codes") or []:
                if t in code.lower():
                    score += 12
        if d.get("codename") and d["codename"].lower() in q:
            score += 15
        if score > 0:
            scored.append((score, d))

    scored.sort(key=lambda x: (-x[0], x[1]["market_name"]))
    return [d for _, d in scored[:limit]]


def random_device_entry() -> dict[str, Any]:
    return random.choice(DEVICE_CATALOG)
