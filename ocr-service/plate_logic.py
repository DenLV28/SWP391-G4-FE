"""
Assembles a Vietnamese license plate from raw PaddleOCR text fragments.
Pure stdlib — testable without paddle/cv2 installed.

A plate is series + number: "51G" + "12345" (cars, one line) or "29C1" +
"38383" (bikes, two stacked lines → the OCR returns two separate texts).
Output format matches the app's LICENSE_PLATE_REGEX (src/data/mockData.ts),
e.g. "29C1-38383".
"""

import re

SERIES_RE = re.compile(r"^\d{2}[A-Z]{1,2}\d{0,2}$")
NUMBER_LENGTHS = (5, 4)  # prefer the modern 5-digit number when both splits match

# Rec-model confusions that are safe to fix in positions that MUST be digits.
DIGIT_FIXES = str.maketrans({"O": "0", "Q": "0", "I": "1", "L": "1", "Z": "2", "S": "5", "B": "8"})


def _fix_digits(s: str) -> str:
    return s.translate(DIGIT_FIXES)


def _fix_series(s: str) -> str:
    # Only the leading 2 chars (province code) and trailing chars after the
    # letters are digits; the letters themselves are left untouched.
    m = re.match(r"^(..)([A-Z]{1,2})(.*)$", _fix_digits(s[:2]) + s[2:])
    if not m:
        return s
    return m.group(1) + m.group(2) + _fix_digits(m.group(3))


def _split_single_line(text: str):
    """'51G12345' → ('51G', '12345'); None if the text isn't a full plate."""
    for n in NUMBER_LENGTHS:
        if len(text) <= n:
            continue
        series, number = _fix_series(text[:-n]), _fix_digits(text[-n:])
        if SERIES_RE.fullmatch(series) and number.isdigit():
            return series, number
    return None


def _boxes_stacked(top_box, bottom_box) -> bool:
    """True when bottom_box sits below top_box with horizontal overlap (two-line plate)."""
    if top_box is None or bottom_box is None:
        return True  # no geometry available — trust the regex match alone
    tx1, _ty, tx2, tcy = top_box
    bx1, _by, bx2, bcy = bottom_box
    return bcy > tcy and min(tx2, bx2) - max(tx1, bx1) > 0


def extract_plate(texts, scores, boxes):
    """
    Returns (plate, confidence, contributing_indices) or ('', None, []).
    boxes[i] is (x1, y1, x2, center_y) or None.
    """
    candidates = []
    normalized = [re.sub(r"[^A-Z0-9]", "", t.upper()) for t in texts]

    # 1) Single text that is already a full plate (cars, or bikes read as one box)
    for i, text in enumerate(normalized):
        split = _split_single_line(text)
        if split:
            candidates.append((scores[i], f"{split[0]}-{split[1]}", [i]))

    # 2) Two stacked texts: series line above number line (motorbike plates)
    if not candidates:
        series_idx = [i for i, t in enumerate(normalized) if SERIES_RE.fullmatch(_fix_series(t))]
        number_idx = [
            i for i, t in enumerate(normalized)
            if len(t) in NUMBER_LENGTHS and _fix_digits(t).isdigit()
        ]
        for si in series_idx:
            for ni in number_idx:
                if si == ni or not _boxes_stacked(boxes[si], boxes[ni]):
                    continue
                score = (scores[si] + scores[ni]) / 2
                plate = f"{_fix_series(normalized[si])}-{_fix_digits(normalized[ni])}"
                candidates.append((score, plate, [si, ni]))

    if not candidates:
        return "", None, []
    score, plate, idx = max(candidates, key=lambda c: c[0])
    return plate, round(float(score), 4), idx
