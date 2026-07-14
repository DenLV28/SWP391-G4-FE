import { GoogleGenAI } from '@google/genai';

// ── Engine 1 (primary): local PaddleOCR microservice ─────────────────────────
// See ocr-service/README.md — wraps the PaddleOCR repo at
// d:\FPT_ThNgwx\PaddleOCR-main behind POST /ocr/plate and returns the plate
// already normalized to the app's canonical format (e.g. "29C1-38383").
const PADDLE_URL: string = (import.meta.env.VITE_OCR_API_URL as string) || 'http://localhost:8868';
// First request right after service start can still be warming up the model.
const PADDLE_TIMEOUT_MS = 45_000;

export type OcrEngine = 'paddleocr' | 'gemini';

export interface OcrReadResult {
  plate: string; // '' = no plate found in the image (not an error)
  engine: OcrEngine;
  confidence: number | null; // PaddleOCR reports one; Gemini doesn't
}

async function readWithPaddle(imageBase64: string): Promise<OcrReadResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PADDLE_TIMEOUT_MS);
  try {
    const res = await fetch(`${PADDLE_URL}/ocr/plate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `OCR service trả về lỗi HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      plate: typeof data.plate === 'string' ? data.plate : '',
      engine: 'paddleocr',
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Engine 2 (fallback): Gemini Vision — used only when the PaddleOCR service
// is unreachable and a VITE_GEMINI_API_KEY is configured. ────────────────────
const PROMPT = `Bạn là hệ thống đọc biển số xe Việt Nam.
Nhìn vào ảnh, hãy tìm và đọc biển số xe (nếu có nhiều xe, lấy biển số xe rõ nhất / gần nhất).
Chỉ trả về chuỗi biển số xe (ví dụ: 51G-123.45 hoặc 29A-456.78).
Không giải thích, không thêm bất kỳ chữ nào khác.
Nếu không tìm thấy biển số, chỉ trả về: KHÔNG_TÌM_THẤY`;

const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function shouldTryNextModel(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('429') ||
    msg.toLowerCase().includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('404') ||
    msg.includes('NOT_FOUND') ||
    msg.toLowerCase().includes('not found')
  );
}

// A missing/revoked/copy-pasted-wrong key still reaches the API and comes back
// as a 401 UNAUTHENTICATED — surface that as an actionable message instead of
// the raw Google error JSON.
function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('401') ||
    msg.includes('UNAUTHENTICATED') ||
    msg.includes('API_KEY_INVALID') ||
    msg.toLowerCase().includes('invalid authentication')
  );
}

async function readWithGemini(imageBase64: string, mimeType: string): Promise<OcrReadResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  let lastError: unknown = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
      });
      const text = (response.text ?? '').trim();
      const plate = !text || text === 'KHÔNG_TÌM_THẤY' ? '' : text;
      return { plate, engine: 'gemini', confidence: null };
    } catch (err) {
      lastError = err;
      if (isAuthError(err)) {
        throw new Error(
          'API key Gemini không hợp lệ hoặc đã bị thu hồi. Vui lòng lấy lại key tại https://aistudio.google.com/apikey và cập nhật VITE_GEMINI_API_KEY trong file .env.',
        );
      }
      if (!shouldTryNextModel(err)) throw err;
    }
  }
  void lastError;
  throw new Error(
    'Tài khoản/Project Gemini của bạn chưa có hạn mức (quota) sử dụng. Kiểm tra tại https://aistudio.google.com/apikey hoặc thử lại sau vài phút. Vui lòng nhập biển số thủ công trong lúc chờ.',
  );
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Reads a license plate from a base64 image: local PaddleOCR first, Gemini as
 * automatic fallback when the service is down. Throws (with a Vietnamese,
 * actionable message) only when no engine could process the image at all.
 */
export async function readLicensePlateEx(
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<OcrReadResult> {
  let paddleError: unknown = null;
  try {
    return await readWithPaddle(imageBase64);
  } catch (err) {
    paddleError = err; // service down / timeout / bad response → try fallback
  }

  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return readWithGemini(imageBase64, mimeType);
  }

  const detail = paddleError instanceof Error ? paddleError.message : String(paddleError);
  throw new Error(
    `Không kết nối được dịch vụ PaddleOCR tại ${PADDLE_URL} (${detail}). ` +
      'Khởi động service: chạy start.ps1 trong thư mục ocr-service, hoặc cấu hình VITE_OCR_API_URL trong .env.',
  );
}

/** Back-compat wrapper — returns only the plate string. */
export async function readLicensePlate(imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  return (await readLicensePlateEx(imageBase64, mimeType)).plate;
}

export function getOcrServiceUrl(): string {
  return PADDLE_URL;
}

/** Quick ping so the Gate Control screen can show whether PaddleOCR is up. */
export async function checkOcrHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    const res = await fetch(`${PADDLE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:image/jpeg;base64,XXXX"
      const [header, base64] = result.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
