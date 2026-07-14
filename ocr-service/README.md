# ParkFlow — PaddleOCR license-plate service

Dịch vụ HTTP nhỏ bọc quanh model **PaddleOCR** local (thư mục
`d:\FPT_ThNgwx\PaddleOCR-main`) để đọc biển số xe từ ảnh webcam mà trạm
Gate Control (module Staff) tự động chụp sau mỗi lần quẹt thẻ RFID.

## Luồng tự động hoàn chỉnh (RFID → Camera → OCR → Database)

```
[1] Quẹt thẻ RFID (ô nhập UID / đầu đọc bàn phím trên GateControl.tsx)
      └─ POST /api/rfid-scans            (backend Node — tạo bản ghi "Scanned")
[2] Tự động chụp ảnh từ webcam           (captureAndOCR() trong GateControl.tsx)
[3] POST http://localhost:8868/ocr/plate (service này — PaddleOCR đọc biển số)
[4] PATCH /api/rfid-scans/:id            (backend Node — lưu ảnh + biển số + hash,
                                          link vehicle_id → trạng thái "Captured"/"Linked")
```

## Cài đặt (một lần)

```powershell
# Cần Python 3.10–3.12 (nếu chưa có: winget install -e --id Python.Python.3.11)
cd ocr-service
powershell -ExecutionPolicy Bypass -File setup.ps1
```

`setup.ps1` tạo virtualenv `.venv`, cài PaddlePaddle (CPU) + FastAPI, và cài
PaddleOCR **từ thư mục source local của bạn** (fallback sang PyPI nếu lỗi).

## Chạy

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
# → http://localhost:8868  (lần chạy đầu sẽ tải model PP-OCRv5 mobile, ~vài chục MB)
```

Frontend đọc địa chỉ service từ `VITE_OCR_API_URL` trong `.env`
(mặc định `http://localhost:8868`). Nếu service không chạy, frontend tự
fallback sang Gemini (nếu có `VITE_GEMINI_API_KEY`).

## API

### `POST /ocr/plate`

```json
{ "image": "<base64 JPEG/PNG — chấp nhận cả data URL>" }
```

Trả về:

```json
{
  "plate": "29C1-38383",
  "confidence": 0.97,
  "rawTexts": [{ "text": "29-C1", "score": 0.98 }, { "text": "383.83", "score": 0.96 }],
  "engine": "paddleocr"
}
```

- `plate` đã chuẩn hóa theo định dạng của app (`LICENSE_PLATE_REGEX`:
  `29C1-38383`). Ghép được cả biển 2 dòng của xe máy (dòng series nằm trên
  dòng số). `plate` rỗng = không thấy biển số trong ảnh (không phải lỗi).
- `GET /health` → `{ "status": "ok", "modelLoaded": true }`.
