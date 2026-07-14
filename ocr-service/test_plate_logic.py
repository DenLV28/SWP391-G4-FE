"""Unit tests for plate assembly — run with any Python 3.10+: python test_plate_logic.py"""

from plate_logic import extract_plate

# (name, texts, scores, boxes, expected_plate)
CASES = [
    # Car plate read as one box, formatted with dash and dot
    ("car one-line", ["51G-123.45"], [0.98], [None], "51G-12345"),
    # Same but no separators at all
    ("car raw", ["51G12345"], [0.97], [None], "51G-12345"),
    # Motorbike two-line: series on top, number below (stacked boxes)
    (
        "bike two-line",
        ["29-C1", "383.83"],
        [0.98, 0.96],
        [(100, 50, 200, 60), (100, 90, 200, 100)],
        "29C1-38383",
    ),
    # Two-line with noise text around the plate
    (
        "bike + noise",
        ["HONDA", "29-C1", "383.83", "VN"],
        [0.9, 0.98, 0.96, 0.8],
        [None, (100, 50, 200, 60), (100, 90, 200, 100), None],
        "29C1-38383",
    ),
    # Digit-position confusions: O→0 in number, I→1 in province code
    ("confusions", ["51G-123O5"], [0.9], [None], "51G-12305"),
    ("confusion series", ["5IG-12345"], [0.9], [None], "51G-12345"),
    # 4-digit legacy number
    ("legacy 4-digit", ["29A-4567"], [0.95], [None], "29A-4567"),
    # Detection order differs from visual order — geometry (series box above
    # number box) still decides the pairing
    (
        "detection order shuffled",
        ["383.83", "29-C1"],
        [0.96, 0.98],
        [(100, 90, 200, 100), (100, 50, 200, 60)],
        "29C1-38383",
    ),
    # Nothing plate-like in frame
    ("no plate", ["PARKING", "EXIT"], [0.9, 0.9], [None, None], ""),
    ("empty", [], [], [], ""),
]

failed = 0
for name, texts, scores, boxes, expected in CASES:
    plate, conf, idx = extract_plate(texts, scores, boxes)
    ok = plate == expected
    failed += 0 if ok else 1
    print(f"[{'OK ' if ok else 'FAIL'}] {name}: {plate!r} (expected {expected!r}, conf={conf})")

print(f"\n{len(CASES) - failed}/{len(CASES)} passed")
raise SystemExit(1 if failed else 0)
