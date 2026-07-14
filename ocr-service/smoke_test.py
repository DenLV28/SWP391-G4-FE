"""
End-to-end smoke test: renders synthetic Vietnamese plates, sends them through
POST /ocr/plate, and checks the normalized plate comes back.

    .venv\\Scripts\\python.exe smoke_test.py [http://localhost:8868]
"""

import base64
import json
import sys
import urllib.request

import cv2
import numpy as np

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8868"


def make_plate_img(lines: list[str]) -> np.ndarray:
    """Rough render of a VN plate: white background, black border, block digits."""
    font, scale, thick = cv2.FONT_HERSHEY_DUPLEX, 4.0, 10
    line_sizes = [cv2.getTextSize(line, font, scale, thick)[0] for line in lines]
    line_h = max(s[1] for s in line_sizes)
    pad, gap = 70, 55
    w = max(s[0] for s in line_sizes) + 2 * pad
    h = len(lines) * line_h + (len(lines) - 1) * gap + 2 * pad
    img = np.full((h + 160, w + 200, 3), (90, 105, 120), np.uint8)  # dull backdrop
    x0, y0 = 100, 80
    cv2.rectangle(img, (x0, y0), (x0 + w, y0 + h), (255, 255, 255), -1)
    cv2.rectangle(img, (x0, y0), (x0 + w, y0 + h), (0, 0, 0), 8)
    for i, line in enumerate(lines):
        tx = x0 + (w - line_sizes[i][0]) // 2
        ty = y0 + pad + line_h + i * (line_h + gap)
        cv2.putText(img, line, (tx, ty), font, scale, (10, 10, 10), thick, cv2.LINE_AA)
    return img


def post_plate(img: np.ndarray) -> dict:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    assert ok
    body = json.dumps({"image": base64.b64encode(buf.tobytes()).decode()}).encode()
    req = urllib.request.Request(
        f"{BASE}/ocr/plate", data=body, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        return json.load(res)


CASES = [
    (["51G-12345"], "51G-12345"),          # car, one line
    (["29-C1", "38383"], "29C1-38383"),    # motorbike, two stacked lines
]

failed = 0
for lines, expected in CASES:
    out = post_plate(make_plate_img(lines))
    status = "OK " if out.get("plate") == expected else "FAIL"
    if status == "FAIL":
        failed += 1
    print(f"[{status}] {lines} -> plate={out.get('plate')!r} conf={out.get('confidence')} raw={[t['text'] for t in out.get('rawTexts', [])]}")

sys.exit(1 if failed else 0)
