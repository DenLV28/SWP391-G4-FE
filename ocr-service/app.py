"""
ParkFlow — RapidOCR license-plate microservice (Python 3.14 compatible).

Replaces the PaddleOCR backend with rapidocr-onnxruntime which supports
Python 3.14 and uses lightweight ONNX models (~5 MB, no GPU needed).

    POST /ocr/plate   { "image": "<base64 JPEG/PNG, with or without data-URL prefix>" }
    →                 { "plate": "29C1-38383", "confidence": 0.97,
                        "rawTexts": [...], "engine": "rapidocr" }

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

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        from rapidocr_onnxruntime import RapidOCR
        log.info("Loading RapidOCR engine…")
        _engine = RapidOCR()
        log.info("RapidOCR ready.")
    return _engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_engine()
    yield


app = FastAPI(title="ParkFlow RapidOCR service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    engine: str = "rapidocr"


@app.get("/health")
def health():
    return {"status": "ok", "modelLoaded": _engine is not None}


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

    result, _ = get_engine()(img)
    texts, scores, boxes = [], [], []
    if result:
        for item in result:
            # item: [box_points, text, score]
            box_pts = np.asarray(item[0], dtype=float)
            text    = str(item[1])
            score   = float(item[2]) if item[2] is not None else 0.0
            texts.append(text)
            scores.append(score)
            xs, ys = box_pts[:, 0], box_pts[:, 1]
            boxes.append((xs.min(), ys.min(), xs.max(), float(ys.mean())))

    plate, confidence, _ = extract_plate(texts, scores, boxes)
    log.info("RapidOCR read %d text(s) → plate=%r conf=%s", len(texts), plate, confidence)
    return OcrResponse(
        plate=plate,
        confidence=confidence,
        rawTexts=[RawText(text=t, score=round(s, 4)) for t, s in zip(texts, scores)],
    )
