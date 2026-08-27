#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tests" / "e2e" / "brand-visual.spec.ts-snapshots"
OUTPUT = ROOT / "qa" / "brand-contact-sheets"
OUTPUT.mkdir(parents=True, exist_ok=True)

surfaces = ["dashboard", "teachings", "teaching-detail", "courses", "apps", "admin"]
viewports = ["mobile-320", "mobile-430", "tablet-768", "desktop-1440"]
font = ImageFont.load_default()

for surface in surfaces:
    panels = []
    for viewport in viewports:
        matches = sorted(SOURCE.glob(f"{surface}-{viewport}-*-linux.png"))
        if not matches:
            raise SystemExit(f"Missing snapshot for {surface} / {viewport}")
        image = Image.open(matches[0]).convert("RGB")
        target_width = 360
        scale = target_width / image.width
        resized = image.resize((target_width, max(1, int(image.height * scale))), Image.Resampling.LANCZOS)
        panel = Image.new("RGB", (target_width, resized.height + 34), "#fdfaf5")
        panel.paste(resized, (0, 34))
        draw = ImageDraw.Draw(panel)
        draw.text((10, 11), viewport, fill="#1e234c", font=font)
        panels.append(panel)

    height = max(panel.height for panel in panels)
    sheet = Image.new("RGB", (sum(panel.width for panel in panels) + 18 * (len(panels) - 1), height), "#e9e1d3")
    x = 0
    for panel in panels:
        sheet.paste(panel, (x, 0))
        x += panel.width + 18
    sheet.save(OUTPUT / f"{surface}-four-viewports.jpg", quality=92, optimize=True)

print(f"Created {len(surfaces)} contact sheets in {OUTPUT}")
