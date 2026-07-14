"""
ParkFlow — PaddleOCR license-plate microservice.

Wraps the local PaddleOCR repo (d:/FPT_ThNgwx/PaddleOCR-main) behind one HTTP
endpoint the staff Gate Control screen calls after an RFID tap auto-captures a
webcam frame:

    POST /ocr/plate   { "image": "<base64 JPEG/PNG, with or without data-URL prefix>" }
    →                 { "plate": "29C1-38383", "confidence": 0.97,
                        "rawTexts": [...], "engine": "paddleocr" }

`plate` is normalized to the app's canonical format (see LICENSE_PLATE_REGEX in
src/data/mockData.ts): 2 digits + 1-2 letters + 0-2 digits, dash, 4-5 digits.
An empty `plate` means "no plate found in frame" (not an error).

Run:  uvicorn app:app --host 0.0.0.0 --port 8868
"""

import base64
import logging
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ocr-service")

# ── PaddleOCR pipeline ────────────────────────────────────────────────────────
# Mobile det/rec models: fast enough for CPU-only gate stations, accurate enough
# for plates (Latin letters + digits). Doc-orientation / unwarping stages are
# for scanned documents — dead weight on webcam frames, so they're disabled.
PIPELINE_KWARGS = dict(
    text_detection_model_name="PP-OCRv5_mobile_det",
    text_recognition_model_name="PP-OCRv5_mobile_rec",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=True,
    device="cpu",
)

_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from paddleocr import PaddleOCR  # slow import — deferred so /health works instantly

        log.info("Loading PaddleOCR pipeline (first run downloads models)…")
        _pipeline = PaddleOCR(**PIPELINE_KWARGS)
        log.info("PaddleOCR pipeline ready.")
    return _pipeline


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_pipeline()  # load at startup so the first RFID scan isn't slow
    yield


app = FastAPI(title="ParkFlow PaddleOCR service", lifespan=lifespan)

# The Vite dev server / staff stations call this cross-origin on the LAN.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Vietnamese plate assembly lives in plate_logic.py (pure stdlib, unit-testable
# without paddle installed).
from plate_logic import extract_plate


# ── HTTP endpoints ────────────────────────────────────────────────────────────
class OcrRequest(BaseModel):
    image: str  # base64, optionally prefixed with "data:image/...;base64,"


class RawText(BaseModel):
    text: str
    score: float


class OcrResponse(BaseModel):
    plate: str
    confidence: float | None
    rawTexts: list[RawText]
    engine: str = "paddleocr"


@app.get("/health")
def health():
    return {"status": "ok", "modelLoaded": _pipeline is not None}


@app.post("/ocr/plate", response_model=OcrResponse)
def ocr_plate(req: OcrRequest):
    payload = req.image.split(",", 1)[-1]  # tolerate a data-URL prefix
    try:
        img_bytes = base64.b64decode(payload, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Ảnh không phải base64 hợp lệ.")

    img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Không giải mã được ảnh (cần JPEG/PNG).")

    result = get_pipeline().predict(img)
    texts, scores, boxes = [], [], []
    for res in result:
        rec_texts = res.get("rec_texts") or []
        rec_scores = res.get("rec_scores") or []
        rec_polys = res.get("rec_polys")
        for i, text in enumerate(rec_texts):
            texts.append(str(text))
            scores.append(float(rec_scores[i]) if i < len(rec_scores) else 0.0)
            if rec_polys is not None and i < len(rec_polys):
                poly = np.asarray(rec_polys[i], dtype=float)
                xs, ys = poly[:, 0], poly[:, 1]
                boxes.append((xs.min(), ys.min(), xs.max(), float(ys.mean())))
            else:
                boxes.append(None)

    plate, confidence, _ = extract_plate(texts, scores, boxes)
    log.info("OCR read %d text(s) → plate=%r conf=%s", len(texts), plate, confidence)
    return OcrResponse(
        plate=plate,
        confidence=confidence,
        rawTexts=[RawText(text=t, score=round(s, 4)) for t, s in zip(texts, scores)],
    )
