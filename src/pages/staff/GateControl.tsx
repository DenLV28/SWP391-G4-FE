import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  CameraOff,
  ScanLine,
  Check,
  X,
  ArrowRight,
  Scan,
  Loader2,
  AlertCircle,
  CreditCard,
  UserCheck,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  Siren,
  RefreshCw,
  IdCard,
  Radio,
  QrCode,
  CalendarCheck,
} from 'lucide-react';
import jsQR from 'jsqr';
import type { Gate, ScanEvent, ScanDirection } from '../../types/staff';
import { manualVehicleOptions } from '../../types/staff';
import type { User, VehicleKey, PricingRule, Reservation, Payment } from '../../data/mockData';
import { validateLicensePlate } from '../../data/mockData';
import { formatCurrency } from '../../utils/helpers';
import { readLicensePlateEx, checkOcrHealth, getOcrServiceUrl, type OcrEngine } from '../../services/ocrService';
import { fetchRfidInfo, linkRfidCard, type RfidInfo } from '../../services/rfidService';
import { createRfidScan, updateRfidScan, subscribeToRfidTaps, sendGateCommand } from '../../services/rfidScanService';
import { perVisitOverstay, overstayDue, isReservationPaid } from '../../utils/reservationPricing';
import panoramaImg from '../../assets/images/bai-xe-quan-9.jpg';

interface GateControlProps {
  gates: Gate[];
  liveScans: ScanEvent[];
  iotStatus: 'connecting' | 'online' | 'offline' | 'simulated';
  iotTransport: string;
  pricingRules: PricingRule[];
  currentUser?: User;
  /** Lượt gửi (đã lọc theo bãi của staff) — tra giờ vào & tính tiền khi xe ra. */
  reservations?: Reservation[];
  payments?: Payment[];
  onConfirmScan: (scan: ScanEvent, vehicleType: VehicleKey, status: 'GRANTED' | 'OVERRIDE') => void;
  onDenyScan: (scan: ScanEvent) => void;
  onManualEntry: (gateId: string, plate: string, vehicleType: VehicleKey, direction: 'entry' | 'exit') => void;
  onRfidVerified: (gateId: string, direction: ScanDirection, plate: string, vehicleType: VehicleKey, ownerName: string, rfidUid: string) => void;
  /** Lệnh rào chắn gửi xuống tầng IoT (ESP32/simulator). */
  onGateCommand?: (gateId: string, command: 'open' | 'close') => boolean;
  /** Báo động khẩn cấp — ghi vào nhật ký sự cố & báo quản lý. */
  onAlarm?: (description: string) => void;
  addToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const recognitionPill: Record<string, { label: string; cls: string }> = {
  subscriber: { label: 'Khách tháng',     cls: 'bg-emerald-100 text-emerald-700' },
  casual:     { label: 'Khách lượt',      cls: 'bg-blue-100   text-blue-700'     },
  unknown:    { label: 'Không nhận diện', cls: 'bg-rose-100   text-rose-700'     },
};

/** Maps a DB-stored vehicle type label (e.g. "Ô tô 4-7 chỗ (Xăng)") back to a VehicleKey. */
function labelToVehicleKey(label: string): VehicleKey {
  return manualVehicleOptions.find((o) => o.label === label)?.key ?? 'motorbike';
}

const normPlate = (p: string) => p.toLowerCase().replace(/[^a-z0-9]/g, '');

// ── QR thẻ tháng ──────────────────────────────────────────────────────────────
// Payload do trang "Đặt chỗ của tôi" của driver sinh ra (MyReservations):
//   PARKFLOW-MONTHLY|<reservationCode>|<licensePlate>|<ngày bắt đầu>|<ngày hết hạn>
// Chỉ tin 2 trường đầu để tra hồ sơ; hạn dùng luôn TÍNH LẠI từ ngày đăng ký
// trong DB (date + 1 tháng) — khách sửa ngày trong QR không qua mặt được.
function parseMonthlyQr(text: string): { code: string; plate: string } | null {
  const parts = text.trim().split('|');
  if (parts.length < 3 || parts[0] !== 'PARKFLOW-MONTHLY') return null;
  const code = parts[1].trim();
  const plate = parts[2].trim();
  return code && plate ? { code, plate } : null;
}

/** Cùng công thức "+1 tháng" với trang đặt chỗ của driver. */
function addOneMonth(value: string): string {
  const d = new Date(value.split('T')[0]);
  if (isNaN(d.getTime())) return value;
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

/** YYYY-MM-DD theo giờ máy (không dùng toISOString để khỏi lệch múi giờ). */
function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type QrResult =
  | { ok: true; res: Reservation; start: string; end: string; daysLeft: number }
  | { ok: false; reason: string };

function fmtClock(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDuration(ms: number) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  return `${String(Math.floor(mins / 60)).padStart(2, '0')} giờ ${String(mins % 60).padStart(2, '0')} phút`;
}

type OcrStatus = 'idle' | 'scanning' | 'done' | 'error' | 'no_plate';
type RfidStatus = 'idle' | 'scanning' | 'found' | 'not_found' | 'error';

const DIRECTION_TABS: { key: ScanDirection; label: string; icon: typeof LogIn }[] = [
  { key: 'entry', label: 'Trạm OCR — Xe Vào', icon: LogIn },
  { key: 'exit',  label: 'Trạm OCR — Xe Ra',  icon: LogOut },
];

export default function GateControl({
  gates,
  liveScans,
  iotStatus,
  iotTransport: _iotTransport,
  pricingRules,
  currentUser,
  reservations = [],
  payments = [],
  onConfirmScan,
  onDenyScan,
  onManualEntry,
  onRfidVerified,
  onGateCommand,
  onAlarm,
  addToast,
}: GateControlProps) {
  // Which OCR screen is active — Entry gate or Exit gate.
  const [activeDirection, setActiveDirection] = useState<ScanDirection>('entry');
  const gate = gates.find((g) => g.direction === activeDirection) ?? gates[0];

  const [plate, setPlate] = useState('');
  const [manualType, setManualType] = useState<VehicleKey>('motorbike');

  // Đồng hồ trực tiếp cho overlay camera + thời gian ra/tổng thời gian
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrError, setOcrError] = useState('');
  const [lastSnapshot, setLastSnapshot] = useState<string>('');
  // Which engine produced the last result + its confidence, and whether the
  // local PaddleOCR service answered its health ping (null = still checking).
  const [ocrEngine, setOcrEngine] = useState<OcrEngine | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [paddleOnline, setPaddleOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkOcrHealth().then((ok) => { if (!cancelled) setPaddleOnline(ok); });
    return () => { cancelled = true; };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebcamActive(false);
    setWebcamError('');
    setOcrStatus('idle');
    setLastSnapshot('');
  }, []);

  // Switching between the Entry and Exit OCR screens tears down the previous
  // screen's camera session — each screen starts fresh, like a separate station.
  useEffect(() => {
    stopWebcam();
    setPlate('');
    setOcrConfidence(null);
  }, [activeDirection, stopWebcam]);

  const startWebcam = async () => {
    setWebcamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setWebcamError(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Trình duyệt chưa cấp quyền camera. Vui lòng cho phép trong cài đặt.'
          : `Không mở được webcam: ${msg}`,
      );
    }
  };

  // Cleanup on unmount
  useEffect(() => () => stopWebcam(), [stopWebcam]);

  // Returns what it captured/read so the automated RFID pipeline can reuse it —
  // the manual "Chụp & OCR" button just calls this and ignores the return value.
  const captureAndOCR = async (): Promise<{ image: string; plate: string }> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !webcamActive) return { image: '', plate: '' };

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { image: '', plate: '' };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    setLastSnapshot(dataUrl);

    setOcrStatus('scanning');
    setOcrError('');

    try {
      const result = await readLicensePlateEx(base64, 'image/jpeg');
      setOcrEngine(result.engine);
      setOcrConfidence(result.confidence);
      if (result.plate) {
        setPlate(result.plate);
        setOcrStatus('done');
        return { image: dataUrl, plate: result.plate };
      } else {
        setOcrStatus('no_plate');
        return { image: dataUrl, plate: '' };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setOcrError(msg);
      setOcrStatus('error');
      return { image: dataUrl, plate: '' };
    }
  };

  const selectedPricing = pricingRules.find((p) => p.vehicleType === manualType);

  const handleManualSubmit = () => {
    if (!plate.trim()) return;
    const plateErr = validateLicensePlate(plate);
    if (plateErr) { alert(plateErr); return; }
    onManualEntry(gate.id, plate.trim().toUpperCase(), manualType, activeDirection);
    addToast?.(
      activeDirection === 'entry'
        ? `Đã xác nhận cho xe ${plate.trim().toUpperCase()} vào cổng.`
        : `Đã ghi nhận xe ${plate.trim().toUpperCase()} ra cổng.`,
      'success',
    );
    handleRefresh();
  };

  const handleRefresh = () => {
    setPlate('');
    setOcrStatus('idle');
    setOcrError('');
    setLastSnapshot('');
    setOcrConfidence(null);
    resetRfid();
    resetQr();
  };

  // ---- RFID verification ----
  const [rfidInput, setRfidInput] = useState('');
  const [rfidStatus, setRfidStatus] = useState<RfidStatus>('idle');
  const [rfidError, setRfidError] = useState('');
  const [rfidInfo, setRfidInfo] = useState<RfidInfo | null>(null);
  const [linkPlate, setLinkPlate] = useState('');
  const [linking, setLinking] = useState(false);
  const [autoPipelineNote, setAutoPipelineNote] = useState('');

  const resetRfid = () => {
    setRfidInput('');
    setRfidStatus('idle');
    setRfidError('');
    setRfidInfo(null);
    setLinkPlate('');
    setAutoPipelineNote('');
  };

  // Trigger: RFID card tapped — manually (UID typed) or pushed by the Arduino
  // reader over the backend's IoT relay. Runs the full automated pipeline —
  //   1) Initial Save        → POST /api/rfid-scans
  //   2) Auto-Capture & OCR  → captureAndOCR() (PaddleOCR) if the camera is on
  //   3) UI auto-fill        → OCR'd plate lands in the recognition card
  //   4) Final Data Link     → PATCH the scan row with photo + plate + vehicle
  const runRfidPipeline = async (
    uid: string,
    opts?: { gateId?: string; direction?: ScanDirection; source?: 'manual' | 'iot' },
  ) => {
    if (!uid) return;
    const fromIot = opts?.source === 'iot';
    setRfidStatus('scanning');
    setRfidError('');
    setRfidInfo(null);
    setAutoPipelineNote(fromIot ? '📡 Thẻ quét từ đầu đọc IoT — đang xử lý...' : '');

    const scanRecord = await createRfidScan({
      rfidUid: uid,
      gateId: opts?.gateId || gate.id,
      direction: opts?.direction ?? activeDirection,
      scannedById: currentUser?.id ?? '',
      scannedByName: currentUser?.fullName ?? '',
    });

    if (webcamActive) setAutoPipelineNote('Đang tự động chụp ảnh & nhận diện biển số...');

    const [{ image, plate: ocrPlate }, lookupResult] = await Promise.all([
      webcamActive ? captureAndOCR() : Promise.resolve({ image: '', plate: '' }),
      fetchRfidInfo(uid),
    ]);

    if (lookupResult.ok === true) {
      setRfidInfo(lookupResult.data);
      setRfidStatus('found');
    } else if (lookupResult.ok === false) {
      setRfidError(lookupResult.error);
      setRfidStatus('not_found');
    }

    const matchedVehicleId = lookupResult.ok === true ? lookupResult.data.vehicle.id : '';
    if (scanRecord) {
      updateRfidScan(scanRecord.id, {
        imageData: image || undefined,
        licensePlate: ocrPlate || undefined,
        vehicleId: matchedVehicleId || undefined,
      }).catch(() => {});
    }

    const prefix = fromIot ? '📡 ' : '';
    setAutoPipelineNote(
      !scanRecord
        ? `${prefix}Không lưu được lượt quét vào hệ thống — kiểm tra kết nối backend.`
        : ocrPlate
          ? `${prefix}Đã nhận diện biển số "${ocrPlate}" & lưu vào hồ sơ lượt quét.`
          : webcamActive
            ? `${prefix}Đã lưu lượt quét, nhưng không đọc được biển số từ camera.`
            : `${prefix}Đã lưu lượt quét. Bật camera để tự động chụp & nhận diện biển số.`,
    );
  };

  const handleRfidScan = () => runRfidPipeline(rfidInput.trim());

  // ── IoT bridge: Arduino tap → auto pipeline ────────────────────────────────
  const runPipelineRef = useRef(runRfidPipeline);
  useEffect(() => { runPipelineRef.current = runRfidPipeline; });
  const rfidBusyRef = useRef(false);
  useEffect(() => { rfidBusyRef.current = rfidStatus === 'scanning'; }, [rfidStatus]);

  useEffect(() => {
    const unsubscribe = subscribeToRfidTaps((tap) => {
      if (rfidBusyRef.current) return;
      setRfidInput(tap.rfidUid);
      runPipelineRef.current(tap.rfidUid, {
        gateId: tap.gateId || undefined,
        direction: tap.direction,
        source: 'iot',
      });
    });
    return unsubscribe;
  }, []);

  const handleRfidConfirm = () => {
    if (!rfidInfo) return;
    onRfidVerified(
      gate.id,
      activeDirection,
      rfidInfo.vehicle.licensePlate,
      labelToVehicleKey(rfidInfo.vehicle.vehicleType),
      rfidInfo.owner.fullName || 'Chủ thẻ RFID',
      rfidInfo.rfidUid,
    );
    addToast?.(`Đã xác thực thẻ & mở cổng cho xe ${rfidInfo.vehicle.licensePlate}.`, 'success');
    resetRfid();
  };

  const handleLinkCard = async () => {
    const uid = rfidInput.trim();
    if (!uid || !linkPlate.trim()) return;
    const plateErr = validateLicensePlate(linkPlate);
    if (plateErr) { setRfidError(plateErr); return; }
    setLinking(true);
    const result = await linkRfidCard(uid, linkPlate.trim().toUpperCase());
    setLinking(false);
    if (result.ok) {
      await runRfidPipeline(uid);
    } else {
      setRfidError(result.error ?? 'Không thể liên kết thẻ.');
    }
  };

  // ── Quét QR thẻ tháng ───────────────────────────────────────────────────────
  // Khách gửi tháng đưa mã QR (màn hình "Đặt chỗ của tôi") vào camera; hoặc
  // staff dán nội dung mã vào ô nhập khi dùng đầu quét QR rời (bắn chuỗi).
  const [qrScanning, setQrScanning] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<QrResult | null>(null);
  const qrTimersRef = useRef<{ interval?: ReturnType<typeof setInterval>; timeout?: ReturnType<typeof setTimeout> }>({});

  const stopQrScan = useCallback(() => {
    if (qrTimersRef.current.interval) clearInterval(qrTimersRef.current.interval);
    if (qrTimersRef.current.timeout) clearTimeout(qrTimersRef.current.timeout);
    qrTimersRef.current = {};
    setQrScanning(false);
  }, []);

  const resetQr = useCallback(() => {
    stopQrScan();
    setQrInput('');
    setQrResult(null);
  }, [stopQrScan]);

  useEffect(() => () => stopQrScan(), [stopQrScan]);

  // Đổi trạm Vào/Ra → phiên quét QR cũ không còn ý nghĩa
  useEffect(() => {
    resetQr();
  }, [activeDirection, resetQr]);

  const verifyMonthlyQr = useCallback((text: string) => {
    stopQrScan();
    const parsed = parseMonthlyQr(text);
    if (!parsed) {
      setQrResult({ ok: false, reason: 'Mã QR không đúng định dạng thẻ tháng ParkFlow.' });
      return;
    }
    // reservations đã được lọc theo bãi staff phụ trách — thẻ tháng của bãi
    // khác sẽ không tra ra ở đây (đúng nguyên tắc cô lập theo bãi).
    const res = reservations.find((r) => r.reservationCode === parsed.code);
    if (!res) {
      setQrResult({ ok: false, reason: `Không tìm thấy thẻ tháng ${parsed.code} trong bãi này — kiểm tra khách có đăng ký ở bãi khác không.` });
      return;
    }
    if (res.note !== 'Theo tháng') {
      setQrResult({ ok: false, reason: `${parsed.code} là đặt chỗ thường, không phải thẻ gửi tháng.` });
      return;
    }
    if (res.status === 'Cancelled' || res.status === 'Expired') {
      setQrResult({ ok: false, reason: `Thẻ tháng ${parsed.code} đã bị ${res.status === 'Cancelled' ? 'hủy' : 'đánh dấu hết hạn'}.` });
      return;
    }
    if (normPlate(res.licensePlate) !== normPlate(parsed.plate)) {
      setQrResult({ ok: false, reason: `Biển số trên QR (${parsed.plate}) không khớp hồ sơ đăng ký (${res.licensePlate}).` });
      return;
    }
    const start = res.date.split('T')[0];
    const end = addOneMonth(res.date);
    const today = todayLocal();
    if (today < start) {
      setQrResult({ ok: false, reason: `Thẻ tháng chưa có hiệu lực — bắt đầu từ ngày ${start}.` });
      return;
    }
    if (today > end) {
      setQrResult({ ok: false, reason: `Thẻ tháng đã hết hạn ngày ${end}. Hướng dẫn khách gia hạn ở mục Đặt chỗ.` });
      return;
    }
    const daysLeft = Math.max(0, Math.round((new Date(end).getTime() - new Date(today).getTime()) / 86_400_000));
    setQrResult({ ok: true, res, start, end, daysLeft });
  }, [reservations, stopQrScan]);

  // Quét liên tục khung hình webcam (~2.5 fps) tới khi jsQR bắt được mã hoặc
  // hết 20 giây. Dùng canvas riêng để không giẫm lên canvas chụp OCR.
  const startQrScan = async () => {
    setQrResult(null);
    setQrInput('');
    if (!webcamActive) await startWebcam();
    setQrScanning(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    qrTimersRef.current.interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !ctx || !video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(img.data, img.width, img.height);
      if (found?.data) {
        setQrInput(found.data);
        verifyMonthlyQr(found.data);
      }
    }, 400);
    qrTimersRef.current.timeout = setTimeout(() => {
      stopQrScan();
      setQrResult({ ok: false, reason: 'Không bắt được mã QR sau 20 giây — đưa mã lại gần camera rồi quét lại.' });
    }, 20_000);
  };

  // Thẻ hợp lệ → ghi nhật ký ra/vào (StaffDashboard mở rào simulator) + đẩy
  // lệnh mở rào xuống hàng đợi ESP32 thật.
  const handleQrConfirm = () => {
    if (!qrResult?.ok) return;
    const { res } = qrResult;
    onManualEntry(gate.id, res.licensePlate, res.vehicleType, activeDirection);
    sendGateCommand(gate.id, 'open');
    addToast?.(
      `Thẻ tháng hợp lệ — đã mở rào cho xe ${res.licensePlate} ${activeDirection === 'entry' ? 'vào' : 'ra'} cổng.`,
      'success',
    );
    resetQr();
  };

  // ── Rào chắn & báo động ─────────────────────────────────────────────────────
  const [barrier, setBarrier] = useState<'open' | 'closed'>('closed');

  const handleBarrier = (cmd: 'open' | 'close') => {
    const sent = onGateCommand?.(gate.id, cmd) ?? false;
    setBarrier(cmd === 'open' ? 'open' : 'closed');
    // Push command to backend queue → ESP32 polls and controls servo
    sendGateCommand(gate.id, cmd);
    addToast?.(
      `${cmd === 'open' ? 'Đã mở rào' : 'Đã đóng rào'} tại ${gate.name}${sent ? '' : ' (thiết bị IoT chưa kết nối — trạng thái mô phỏng)'}.`,
      cmd === 'open' ? 'success' : 'info',
    );
  };

  const handleAlarm = () => {
    onAlarm?.(`BÁO ĐỘNG thủ công tại ${gate.name} (${activeDirection === 'entry' ? 'cổng vào' : 'cổng ra'})${plate ? ` — biển số liên quan: ${plate}` : ''}.`);
    addToast?.('Đã kích hoạt báo động — thông tin đã gửi tới quản lý & an ninh.', 'error');
  };

  // ── Thông tin lượt gửi cho thẻ "Biển số nhận diện" ─────────────────────────
  // Xe RA: tra lượt gửi Checked-in theo biển số → giờ vào, tổng thời gian và
  // tổng tiền (giá vé gói, cộng phụ phí quá giờ, trừ phần đã thanh toán).
  const matchedRes = useMemo(() => {
    const p = normPlate(plate);
    if (!p) return undefined;
    return reservations.find((r) => r.status === 'Checked-in' && normPlate(r.licensePlate) === p);
  }, [reservations, plate]);

  const feeInfo = useMemo(() => {
    if (!matchedRes) return null;
    const fee = perVisitOverstay(matchedRes, pricingRules, now);
    const paid = isReservationPaid(matchedRes, payments);
    const due = fee.overstayed ? overstayDue(fee, paid) : paid ? 0 : fee.base;
    const entry = new Date(`${matchedRes.date.split('T')[0]}T${matchedRes.startTime.slice(0, 5)}:00`);
    return { fee, paid, due, entry: Number.isNaN(entry.getTime()) ? null : entry };
  }, [matchedRes, pricingRules, payments, now]);

  const confidencePct =
    ocrStatus === 'done' && ocrConfidence != null ? Math.round(ocrConfidence * 100) : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {activeDirection === 'entry' ? 'Trạm OCR - Xe vào' : 'Trạm OCR - Xe ra'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {gate.name} · {gate.location} — nhận diện biển số PaddleOCR, điều khiển rào chắn và ghi nhận lượt xe.
          </p>
        </div>
        {/* Entry / Exit station switcher */}
        <div className="flex gap-2">
          {DIRECTION_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveDirection(key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeDirection === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

        {/* ── LEFT: hai khung camera + điều khiển thủ công ── */}
        <div className="space-y-5">

          {/* CAM-01 — cận biển (webcam + PaddleOCR) */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${webcamActive ? 'opacity-100' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!webcamActive && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-800">
                {webcamError ? (
                  <>
                    <AlertCircle className="h-10 w-10 text-rose-400" />
                    <p className="max-w-70 text-center text-xs text-rose-300">{webcamError}</p>
                    <button
                      onClick={startWebcam}
                      className="mt-1 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      Thử lại
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-slate-500" />
                    <p className="text-xs text-slate-400">Nhấn "Bật Camera" để mở CAM-01 (cận biển)</p>
                    <button
                      onClick={startWebcam}
                      className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Bật Camera
                    </button>
                  </>
                )}
              </div>
            )}

            {/* REC badge */}
            <div className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold text-white ${webcamActive ? 'bg-rose-600' : 'bg-slate-600/80'}`}>
              <span className={`h-1.5 w-1.5 rounded-full bg-white ${webcamActive ? 'animate-pulse' : ''}`} />
              {webcamActive ? 'REC: CAM-01 (CẬN BIỂN)' : 'CAM-01 (CẬN BIỂN) — TẮT'}
            </div>
            {/* Timestamp overlay */}
            <div className="absolute right-3 top-3 z-10 text-right text-[10px] font-semibold tracking-wider text-white/90">
              {fmtClock(new Date(now))}
              <span className="block">{gate.camLabel || 'CAM 1: PLATE'}</span>
            </div>

            {/* OCR scanning overlay */}
            {ocrStatus === 'scanning' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-xs font-semibold text-white">Đang nhận diện biển số (PaddleOCR)...</p>
                <div className="absolute inset-x-8 top-1/2 h-px animate-bounce bg-blue-400/80 shadow-[0_0_8px_2px_rgba(96,165,250,0.8)]" />
              </div>
            )}

            {/* Camera controls */}
            <div className="absolute bottom-3 right-3 z-10 flex gap-2">
              {webcamActive && ocrStatus !== 'scanning' && (
                <button
                  onClick={captureAndOCR}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-blue-700 transition"
                >
                  <Scan className="h-3.5 w-3.5" /> Chụp & OCR
                </button>
              )}
              {webcamActive && (
                <button
                  onClick={stopWebcam}
                  title="Tắt camera"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-700/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-slate-600 transition"
                >
                  <CameraOff className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Snapshot thumbnail */}
            {lastSnapshot && ocrStatus !== 'idle' && (
              <img
                src={lastSnapshot}
                alt="Ảnh chụp"
                className="absolute bottom-3 left-3 z-10 h-14 w-20 rounded-lg border-2 border-white/60 object-cover shadow-lg"
              />
            )}
          </div>

          {/* CAM-02 — toàn cảnh (minh họa) */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm aspect-[21/9]">
            <img src={panoramaImg} alt="Toàn cảnh cổng" className="h-full w-full object-cover opacity-90" />
            <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded bg-slate-900/70 px-2 py-1 text-[10px] font-bold text-white">
              CAM-02 (TOÀN CẢNH)
            </div>
            <div className="absolute bottom-3 right-3 z-10 text-[10px] font-semibold tracking-wider text-white/90">
              {fmtClock(new Date(now))}
            </div>
          </div>

          {/* Điều khiển thủ công */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 pb-2.5 text-sm font-bold text-slate-700">
                <Radio className="h-4 w-4 text-blue-600" />
                Điều khiển thủ công
              </div>
              <div className="min-w-36 flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Biển số xe</label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Nhập biển số..."
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm tracking-wider focus:outline-none transition ${
                    ocrStatus === 'done'
                      ? 'border-blue-400 bg-blue-50 font-bold text-blue-700 focus:border-blue-500'
                      : 'border-slate-200 focus:border-blue-400'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Loại phương tiện</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as VehicleKey)}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                >
                  {manualVehicleOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!plate.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {activeDirection === 'entry' ? 'Xác nhận vào cổng' : 'Xác nhận ra cổng'}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                <RefreshCw className="h-4 w-4" /> Làm mới
              </button>
            </div>

            {/* Quẹt thẻ RFID thủ công (đầu đọc IoT tự kích hoạt qua backend) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <IdCard className="h-4 w-4 text-slate-400" />
              <input
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRfidScan()}
                placeholder="UID thẻ RFID (vd: 04A2B1C3)..."
                className="min-w-0 w-56 rounded-xl border border-slate-200 px-3 py-2 text-xs tracking-wider focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={handleRfidScan}
                disabled={!rfidInput.trim() || rfidStatus === 'scanning'}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-40"
              >
                {rfidStatus === 'scanning' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
                Quét thẻ
              </button>
              <span className="text-[11px] text-slate-400">
                Đầu đọc Arduino quẹt thẻ sẽ tự kích hoạt chụp ảnh & OCR.
              </span>
            </div>
            {autoPipelineNote && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                {rfidStatus === 'scanning' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                {autoPipelineNote}
              </p>
            )}

            {/* Quét QR thẻ tháng — khách đưa mã trên màn hình điện thoại vào camera */}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <QrCode className="h-4 w-4 text-slate-400" />
                <button
                  onClick={qrScanning ? stopQrScan : startQrScan}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    qrScanning
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {qrScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                  {qrScanning ? 'Đang quét QR... (bấm để dừng)' : 'Quét QR thẻ tháng'}
                </button>
                <input
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && qrInput.trim() && verifyMonthlyQr(qrInput)}
                  placeholder="hoặc dán nội dung mã QR (PARKFLOW-MONTHLY|...)..."
                  className="min-w-0 flex-1 basis-64 rounded-xl border border-slate-200 px-3 py-2 text-xs tracking-wide focus:border-violet-400 focus:outline-none"
                />
                <button
                  onClick={() => verifyMonthlyQr(qrInput)}
                  disabled={!qrInput.trim()}
                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 transition disabled:opacity-40"
                >
                  Kiểm tra
                </button>
              </div>
              {qrScanning && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Nhờ khách đưa mã QR thẻ tháng (mục "Đặt chỗ của tôi" trên điện thoại) vào giữa khung camera phía trên.
                </p>
              )}

              {/* Kết quả xác thực thẻ tháng */}
              {qrResult?.ok === true && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wide">Thẻ tháng hợp lệ</span>
                    <span className="ml-auto rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Còn {qrResult.daysLeft} ngày
                    </span>
                  </div>
                  <div className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                    <p><span className="text-slate-400">Mã thẻ:</span> <span className="font-mono font-bold text-slate-800">{qrResult.res.reservationCode}</span></p>
                    <p><span className="text-slate-400">Biển số:</span> <span className="font-mono font-bold text-slate-800">{qrResult.res.licensePlate}</span></p>
                    <p><span className="text-slate-400">Loại xe:</span> <span className="font-semibold text-slate-700">{manualVehicleOptions.find((o) => o.key === qrResult.res.vehicleType)?.label ?? qrResult.res.vehicleType}</span></p>
                    <p><span className="text-slate-400">Hiệu lực:</span> <span className="font-semibold text-slate-700">{qrResult.start} → {qrResult.end}</span></p>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2 border-t border-emerald-100 pt-2.5">
                    <button
                      onClick={handleQrConfirm}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      Mở rào — xe {activeDirection === 'entry' ? 'vào' : 'ra'} cổng
                    </button>
                    <button
                      onClick={resetQr}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              )}
              {qrResult?.ok === false && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-rose-700">Không cho xe qua cổng</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-rose-600">{qrResult.reason}</p>
                  </div>
                  <button
                    onClick={resetQr}
                    className="shrink-0 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition"
                  >
                    Quét lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: biển số nhận diện + rào chắn ── */}
        <div className="space-y-5">

          {/* Biển số nhận diện */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-blue-700">
                <CreditCard className="h-4 w-4" /> Biển số nhận diện
              </h3>
              {ocrStatus === 'scanning' ? (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang quét
                </span>
              ) : confidencePct != null ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  KHỚP {confidencePct}%
                </span>
              ) : ocrStatus === 'done' && ocrEngine === 'gemini' ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Gemini dự phòng</span>
              ) : ocrStatus === 'no_plate' ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Không thấy biển</span>
              ) : ocrStatus === 'error' ? (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">Lỗi OCR</span>
              ) : null}
            </div>

            {/* Plate display */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50/70 px-4 py-3">
              <span className="text-xs font-semibold text-slate-500">Biển số xe</span>
              <span className="font-mono text-lg font-black tracking-wider text-blue-700">
                {plate || '— — —'}
              </span>
            </div>
            {ocrStatus === 'error' && (
              <p className="mt-2 text-[11px] text-rose-500">{ocrError}</p>
            )}

            {/* Thời gian & phí */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-400">Thời gian vào</p>
                <p className="font-semibold text-slate-800">
                  {feeInfo?.entry ? fmtClock(feeInfo.entry) : activeDirection === 'entry' && plate ? fmtClock(new Date(now)) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Thời gian ra</p>
                <p className="font-semibold text-slate-800">
                  {activeDirection === 'exit' && feeInfo?.entry ? fmtClock(new Date(now)) : '—'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Tổng thời gian</span>
              <span className="font-bold text-slate-800">
                {feeInfo?.entry ? fmtDuration(now - feeInfo.entry.getTime()) : '—'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">Tổng tiền</span>
              {feeInfo ? (
                <span className={`text-lg font-black ${feeInfo.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {feeInfo.due > 0 ? formatCurrency(feeInfo.due) : 'Đã thanh toán'}
                </span>
              ) : activeDirection === 'entry' && plate ? (
                <span className="text-lg font-black text-slate-700">
                  {formatCurrency(selectedPricing?.firstHourPrice ?? 0)}
                  <span className="ml-1 text-[10px] font-medium text-slate-400">/lượt (dự kiến)</span>
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            {feeInfo?.fee.overstayed && (
              <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                Xe gửi quá giờ — đã cộng phụ phí 40% ({formatCurrency(feeInfo.fee.surcharge)}).
              </p>
            )}
            {activeDirection === 'exit' && plate && !matchedRes && (
              <p className="mt-1.5 text-[11px] text-slate-400">
                Không tìm thấy lượt gửi đang hoạt động cho biển số này trong bãi.
              </p>
            )}

            {/* RFID owner info */}
            {rfidStatus === 'found' && rfidInfo && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Thẻ RFID hợp lệ</span>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-mono font-bold text-slate-800">{rfidInfo.vehicle.licensePlate}</span>
                  {' · '}{rfidInfo.vehicle.vehicleType}
                  <span className="block">{rfidInfo.owner.fullName || '—'} · {rfidInfo.owner.phone || '—'}</span>
                </p>
                <button
                  onClick={handleRfidConfirm}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <Check className="h-3.5 w-3.5" /> Xác nhận & Mở cổng
                </button>
              </div>
            )}
            {rfidStatus === 'not_found' && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" /> {rfidError}
                </p>
                <div className="flex gap-2">
                  <input
                    value={linkPlate}
                    onChange={(e) => setLinkPlate(e.target.value.toUpperCase())}
                    placeholder="Liên kết biển số: 29C1-38383"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs uppercase focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    onClick={handleLinkCard}
                    disabled={!linkPlate.trim() || linking}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-40"
                  >
                    {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Liên kết'}
                  </button>
                </div>
              </div>
            )}

            {/* PaddleOCR service status */}
            {paddleOnline === false ? (
              <p className="mt-3 flex items-center gap-1 text-[11px] text-amber-600">
                <AlertCircle className="h-3 w-3" />
                PaddleOCR ({getOcrServiceUrl()}) chưa chạy — chạy ocr-service/start.ps1 để bật.
              </p>
            ) : paddleOnline === true ? (
              <p className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600">
                <Check className="h-3 w-3" /> PaddleOCR sẵn sàng ({getOcrServiceUrl()})
              </p>
            ) : null}
          </div>

          {/* Rào chắn + báo động */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleBarrier('open')}
              className={`flex flex-col items-center gap-2 rounded-2xl px-3 py-5 text-sm font-bold transition ${
                barrier === 'open'
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                  : 'bg-blue-600 text-white shadow hover:bg-blue-700'
              }`}
            >
              <Unlock className="h-6 w-6" />
              Mở rào
            </button>
            <button
              onClick={() => handleBarrier('close')}
              className={`flex flex-col items-center gap-2 rounded-2xl px-3 py-5 text-sm font-bold transition ${
                barrier === 'closed'
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Lock className="h-6 w-6" />
              Đóng rào
            </button>
            <button
              onClick={handleAlarm}
              className="flex flex-col items-center gap-2 rounded-2xl bg-rose-100 px-3 py-5 text-sm font-bold text-rose-600 transition hover:bg-rose-200"
            >
              <Siren className="h-6 w-6" />
              Báo động
            </button>
          </div>

          {/* Trạng thái rào + IoT */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              {barrier === 'open'
                ? <><Unlock className="h-3.5 w-3.5 text-emerald-600" /> Rào chắn: <span className="text-emerald-600 font-bold">ĐANG MỞ</span></>
                : <><Lock className="h-3.5 w-3.5 text-slate-500" /> Rào chắn: <span className="font-bold">ĐÓNG</span></>}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 font-bold ${
              iotStatus === 'online' ? 'bg-emerald-100 text-emerald-700'
              : iotStatus === 'simulated' ? 'bg-blue-100 text-blue-700'
              : iotStatus === 'connecting' ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-500'
            }`}>
              IoT: {iotStatus === 'online' ? 'Trực tuyến' : iotStatus === 'simulated' ? 'Mô phỏng' : iotStatus === 'connecting' ? 'Đang nối' : 'Ngoại tuyến'}
            </span>
          </div>
        </div>
      </div>

      {/* Live scan queue (simulator/hardware pushes) */}
      {liveScans.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <ScanLine className="h-5 w-5 text-blue-600" /> Lượt quét đang chờ xử lý
            </h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              {liveScans.length} mới
            </span>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto px-5 pb-5">
            {liveScans.map((scan) => {
              const pill = recognitionPill[scan.recognition];
              return (
                <div key={scan.id} className="rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {scan.gateId}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {scan.licensePlate || 'BIỂN SỐ KHÔNG ĐỌC ĐƯỢC'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {scan.direction === 'entry' ? 'Vào' : 'Ra'}
                          {scan.confidence != null ? ` · OCR ${Math.round(scan.confidence * 100)}%` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onConfirmScan(scan, scan.vehicleType ?? 'motorbike', 'GRANTED')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Cho qua & ghi nhận
                    </button>
                    {scan.recognition === 'unknown' && (
                      <button
                        onClick={() => onConfirmScan(scan, scan.vehicleType ?? 'motorbike', 'OVERRIDE')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <ArrowRight className="h-3.5 w-3.5" /> Mở thủ công
                      </button>
                    )}
                    <button
                      onClick={() => onDenyScan(scan)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-3.5 w-3.5" /> Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
