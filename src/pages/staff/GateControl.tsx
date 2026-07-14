import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Wallet,
  ShieldCheck,
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
} from 'lucide-react';
import type { Gate, ScanEvent, AccessLog, ScanDirection } from '../../types/staff';
import { manualVehicleOptions } from '../../types/staff';
import type { User, VehicleKey, PricingRule } from '../../data/mockData';
import { validateLicensePlate } from '../../data/mockData';
import { formatCurrency } from '../../utils/helpers';
import { readLicensePlateEx, checkOcrHealth, getOcrServiceUrl, type OcrEngine } from '../../services/ocrService';
import { fetchRfidInfo, linkRfidCard, type RfidInfo } from '../../services/rfidService';
import { createRfidScan, updateRfidScan, subscribeToRfidTaps } from '../../services/rfidScanService';

interface GateControlProps {
  gates: Gate[];
  liveScans: ScanEvent[];
  accessLogs: AccessLog[];
  iotStatus: 'connecting' | 'online' | 'offline' | 'simulated';
  iotTransport: string;
  pricingRules: PricingRule[];
  currentUser?: User;
  onConfirmScan: (scan: ScanEvent, vehicleType: VehicleKey, status: 'GRANTED' | 'OVERRIDE') => void;
  onDenyScan: (scan: ScanEvent) => void;
  onManualEntry: (gateId: string, plate: string, vehicleType: VehicleKey, direction: 'entry' | 'exit') => void;
  onRfidVerified: (gateId: string, direction: ScanDirection, plate: string, vehicleType: VehicleKey, ownerName: string, rfidUid: string) => void;
  onNavigate?: (view: string) => void;
}

const recognitionPill: Record<string, { label: string; cls: string }> = {
  subscriber: { label: 'Khách tháng',     cls: 'bg-emerald-100 text-emerald-700' },
  casual:     { label: 'Khách lượt',      cls: 'bg-blue-100   text-blue-700'     },
  unknown:    { label: 'Không nhận diện', cls: 'bg-rose-100   text-rose-700'     },
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  GRANTED: { label: 'CHẤP NHẬN', cls: 'text-emerald-600' },
  DENIED:  { label: 'TỪ CHỐI',   cls: 'text-rose-500'    },
  OVERRIDE:{ label: 'GHI ĐÈ',    cls: 'text-amber-600'   },
  PENDING: { label: 'CHỜ XỬ LÝ', cls: 'text-slate-500'   },
};

const actionVi: Record<string, string> = {
  'Auto-Recognized':          'Tự động nhận diện',
  'Staff Badge Sweep':        'Quẹt thẻ nhân viên',
  'OCR Recognition Failed':   'OCR lỗi nhận diện',
  'Manual Trigger (Chen)':    'Mở thủ công (Chon)',
  'Nhân viên xác nhận':       'Nhân viên xác nhận',
  'Nhận diện tự động':        'Nhận diện tự động',
};

function translateAction(action: string) {
  return actionVi[action] ?? action;
}

/** Maps a DB-stored vehicle type label (e.g. "Ô tô 4-7 chỗ (Xăng)") back to a VehicleKey. */
function labelToVehicleKey(label: string): VehicleKey {
  return manualVehicleOptions.find((o) => o.label === label)?.key ?? 'motorbike';
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
  accessLogs,
  iotStatus: _iotStatus,
  iotTransport: _iotTransport,
  pricingRules,
  currentUser,
  onConfirmScan,
  onDenyScan,
  onManualEntry,
  onRfidVerified,
  onNavigate,
}: GateControlProps) {
  // Which OCR screen is active — Entry gate or Exit gate.
  const [activeDirection, setActiveDirection] = useState<ScanDirection>('entry');
  const gate = gates.find((g) => g.direction === activeDirection) ?? gates[0];

  const [plate, setPlate] = useState('');
  const [manualType, setManualType] = useState<VehicleKey>('motorbike');

  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>('idle');
  const [ocrError, setOcrError] = useState('');
  const [lastSnapshot, setLastSnapshot] = useState<string>('');
  // Which engine produced the last result, and whether the local PaddleOCR
  // service answered its health ping (null = still checking).
  const [ocrEngine, setOcrEngine] = useState<OcrEngine | null>(null);
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
  // the manual "Chụp & OCR" button just calls this and ignores the return value,
  // so its existing behavior (state updates below) is unchanged.
  const captureAndOCR = async (): Promise<{ image: string; plate: string }> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !webcamActive) return { image: '', plate: '' };

    // Draw current frame to canvas
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { image: '', plate: '' };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 (without the data:image/jpeg;base64, prefix)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    setLastSnapshot(dataUrl);

    setOcrStatus('scanning');
    setOcrError('');

    try {
      const result = await readLicensePlateEx(base64, 'image/jpeg');
      setOcrEngine(result.engine);
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
    setPlate('');
    setOcrStatus('idle');
    setLastSnapshot('');
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

  // Trigger: RFID card tapped — manually (UID typed/scanned into the input) or
  // pushed by the Arduino reader over the backend's IoT relay. Runs the full
  // automated pipeline —
  //   1) Initial Save        → POST /api/rfid-scans (row exists before anything else happens)
  //   2) Auto-Capture & OCR  → reuses captureAndOCR() if the camera is already on
  //   3) UI auto-fill        → the OCR'd plate is written into the manual plate field
  //   4) Final Data Link     → PATCH the scan row with the photo + plate (+ matched vehicle, if any);
  //                            the server derives the plate hash — the UI always shows the real plate text.
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
      // The hardware reader knows which gate/direction it is bolted to — its
      // values win over whatever tab the staff screen happens to show.
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
          ? `${prefix}Đã tự động điền biển số "${ocrPlate}" từ camera & lưu vào hồ sơ lượt quét.`
          : webcamActive
            ? `${prefix}Đã lưu lượt quét, nhưng không đọc được biển số từ camera.`
            : `${prefix}Đã lưu lượt quét. Bật camera để tự động chụp & nhận diện biển số ở lần quét sau.`,
    );
  };

  const handleRfidScan = () => runRfidPipeline(rfidInput.trim());

  // ── IoT bridge: Arduino tap → auto pipeline ────────────────────────────────
  // Keep a ref to the latest pipeline (it closes over webcam/gate state) so
  // the one-time SSE subscription always calls the current version.
  const runPipelineRef = useRef(runRfidPipeline);
  useEffect(() => { runPipelineRef.current = runRfidPipeline; });
  const rfidBusyRef = useRef(false);
  useEffect(() => { rfidBusyRef.current = rfidStatus === 'scanning'; }, [rfidStatus]);

  useEffect(() => {
    const unsubscribe = subscribeToRfidTaps((tap) => {
      // A tap arriving mid-pipeline is dropped — the reader debounces card
      // contact, so this only happens when two cards tap back-to-back.
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
      // Re-fetch so staff sees the now-linked vehicle/owner before confirming.
      await handleRfidScan();
    } else {
      setRfidError(result.error ?? 'Không thể liên kết thẻ.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hệ thống Quản lý Cổng</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Theo dõi video thời gian thực, quản lý rào chắn và ghi nhận giao thức truy cập tại khu phức hợp bãi xe chính.
          </p>
        </div>
      </div>

      {/* Entry / Exit OCR screen switcher */}
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

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* Gate panel */}
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">

          {/* Camera feed */}
          <div className="relative overflow-hidden bg-slate-900 aspect-video">
            {/* Webcam video (shown when active) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${webcamActive ? 'opacity-100' : 'hidden'}`}
            />
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Placeholder image (shown when webcam is off) */}
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
                    <p className="text-xs text-slate-400">Nhấn "Bật Camera" để xem webcam</p>
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

            {/* LIVE badge */}
            {webcamActive && (
              <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </div>
            )}

            {/* OCR scanning overlay */}
            {ocrStatus === 'scanning' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-xs font-semibold text-white">Đang nhận diện biển số...</p>
                {/* Scanning line animation */}
                <div className="absolute inset-x-8 top-1/2 h-px animate-bounce bg-blue-400/80 shadow-[0_0_8px_2px_rgba(96,165,250,0.8)]" />
              </div>
            )}

            {/* Cam label */}
            <div className="absolute bottom-3 left-3 z-10 text-[11px] font-semibold text-white/90 tracking-widest">
              {gate.camLabel || 'CAM_R_ENTRANCE'}
            </div>

            {/* Capture button overlay (shown when webcam is active) */}
            {webcamActive && ocrStatus !== 'scanning' && (
              <button
                onClick={captureAndOCR}
                title="Chụp & nhận diện biển số"
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-blue-700 transition"
              >
                <Scan className="h-3.5 w-3.5" /> Chụp & OCR
              </button>
            )}
          </div>

          {/* OCR result snapshot preview */}
          {lastSnapshot && ocrStatus !== 'idle' && (
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <img
                  src={lastSnapshot}
                  alt="Ảnh chụp"
                  className="h-14 w-20 rounded-lg object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Kết quả OCR ({ocrEngine === 'gemini' ? 'Gemini AI — dự phòng' : 'PaddleOCR'})
                  </p>
                  {ocrStatus === 'done' && (
                    <p className="mt-0.5 text-lg font-bold tracking-widest text-blue-700">{plate}</p>
                  )}
                  {ocrStatus === 'no_plate' && (
                    <p className="mt-0.5 text-sm text-slate-500">Không tìm thấy biển số trong ảnh</p>
                  )}
                  {ocrStatus === 'error' && (
                    <p className="mt-0.5 text-xs text-rose-500">{ocrError}</p>
                  )}
                </div>
                <button
                  onClick={() => { setLastSnapshot(''); setOcrStatus('idle'); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="p-4">
            {/* Gate name + status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{gate.name}</h3>
                <p className="text-xs text-slate-400">{gate.location}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Hoạt động
              </span>
            </div>

            {/* Camera controls */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {/* Webcam toggle */}
              <button
                onClick={webcamActive ? stopWebcam : startWebcam}
                title={webcamActive ? 'Tắt camera' : 'Bật camera'}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition ${
                  webcamActive
                    ? 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {webcamActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {webcamActive ? 'Tắt camera' : 'Bật camera'}
              </button>
              {/* Capture & OCR button */}
              <button
                onClick={captureAndOCR}
                disabled={!webcamActive || ocrStatus === 'scanning'}
                title="Chụp ảnh & nhận diện biển số"
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {ocrStatus === 'scanning'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Scan className="h-4 w-4" />
                }
                Chụp & OCR
              </button>
            </div>

            <div className="my-4 border-t border-slate-100" />

            {/* Manual plate entry */}
            <label className="text-xs font-semibold text-slate-500">Nhập biển số thủ công</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="29C1-38383"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm tracking-wider focus:outline-none transition ${
                  ocrStatus === 'done'
                    ? 'border-blue-400 bg-blue-50 font-bold text-blue-700 focus:border-blue-500'
                    : 'border-slate-200 focus:border-blue-400'
                }`}
              />
              <button
                onClick={handleManualSubmit}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
              >
                Gửi
              </button>
            </div>
            {ocrStatus === 'done' && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-blue-600">
                <Check className="h-3 w-3" /> Biển số được điền tự động từ OCR — kiểm tra lại trước khi gửi
              </p>
            )}
            {paddleOnline === false && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {import.meta.env.VITE_GEMINI_API_KEY
                  ? `PaddleOCR (${getOcrServiceUrl()}) chưa chạy — sẽ dùng Gemini dự phòng. Chạy ocr-service/start.ps1 để bật.`
                  : `PaddleOCR (${getOcrServiceUrl()}) chưa chạy — chạy ocr-service/start.ps1 để nhận diện biển số.`}
              </p>
            )}
            {paddleOnline === true && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                <Check className="h-3 w-3" /> PaddleOCR sẵn sàng ({getOcrServiceUrl()})
              </p>
            )}

            <label className="mt-3 block text-xs font-semibold text-slate-500">Loại xe</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as VehicleKey)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
            >
              {manualVehicleOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>

            <div className="my-4 border-t border-slate-100" />

            {/* Pricing — only meaningful at the exit station, fee is settled there */}
            {activeDirection === 'exit' ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                  <Wallet className="h-4 w-4" /> Chi tiết giá (Lối ra)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-blue-50/60 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Gửi theo lượt</p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(selectedPricing?.firstHourPrice ?? 5000).replace('₫', 'đ')}
                      <span className="text-[10px] font-medium text-slate-400"> /lượt</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Gửi qua đêm</p>
                    <p className="text-lg font-bold text-slate-700">
                      {formatCurrency(selectedPricing?.overnightPrice ?? 30000).replace('₫', 'đ')}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-4 w-4" /> Khách tháng (Thuê bao)
                  </span>
                  <span className="text-sm font-bold text-emerald-700">0đ</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                <Wallet className="h-4 w-4 text-slate-400" />
                Phí gửi xe sẽ được tính tại trạm OCR Xe Ra.
              </div>
            )}
          </div>
        </div>

        {/* Right column: RFID verification + live scans + activity log */}
        <div className="space-y-5">

          {/* RFID card verification */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <CreditCard className="h-5 w-5 text-blue-600" /> Xác thực thẻ RFID
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Quẹt thẻ tại đầu đọc Arduino (tự kích hoạt qua IoT) hoặc nhập mã UID để tra cứu
              thông tin phương tiện & chủ xe. Bật camera trước để hệ thống tự chụp & đọc biển số.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRfidScan()}
                placeholder="Quẹt thẻ hoặc nhập UID (vd: 04A2B1C3)"
                autoFocus
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm tracking-wider focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={handleRfidScan}
                disabled={!rfidInput.trim() || rfidStatus === 'scanning'}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-40"
              >
                {rfidStatus === 'scanning' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                Quét
              </button>
            </div>

            {autoPipelineNote && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                {rfidStatus === 'scanning' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                {autoPipelineNote}
              </p>
            )}

            {/* Found: show vehicle + owner for verification */}
            {rfidStatus === 'found' && rfidInfo && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Đã tìm thấy phương tiện</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400">Biển số</span>
                    <span className="font-mono font-bold text-slate-800">{rfidInfo.vehicle.licensePlate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400">Loại xe</span>
                    <span className="text-slate-700">{rfidInfo.vehicle.vehicleType}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] font-semibold text-slate-400">Chủ xe</span>
                    <span className="text-slate-700">{rfidInfo.owner.fullName || '—'} · {rfidInfo.owner.phone || '—'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetRfid}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-white transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleRfidConfirm}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <Check className="h-3.5 w-3.5" /> Xác nhận & Mở cổng
                  </button>
                </div>
              </div>
            )}

            {/* Not found: offer to link the card to a plate */}
            {rfidStatus === 'not_found' && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-bold">{rfidError}</span>
                </div>
                <p className="text-xs text-slate-500">Liên kết thẻ này với một biển số đã đăng ký:</p>
                <div className="flex gap-2">
                  <input
                    value={linkPlate}
                    onChange={(e) => setLinkPlate(e.target.value.toUpperCase())}
                    placeholder="29C1-38383"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-400 focus:outline-none"
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

            {rfidStatus === 'error' && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" /> {rfidError}
              </p>
            )}
          </div>

          {/* Live scan queue */}
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

          {/* Activity log */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-bold text-slate-800">Hoạt động vào ra gần đây</h3>
              <button
                onClick={() => onNavigate?.('activitylog')}
                className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
              >
                Xem toàn bộ lịch sử <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Cổng</th>
                    <th className="px-5 py-3">Biển số</th>
                    <th className="px-5 py-3">Hành động</th>
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-5 py-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.slice(0, 6).map((log) => {
                    const st = statusLabel[log.status] ?? { label: log.status, cls: 'text-slate-500' };
                    const denied = log.status === 'DENIED';
                    return (
                      <tr key={log.id} className="border-b border-slate-50 last:border-0">
                        <td className={`px-5 py-3 font-semibold ${denied ? 'text-rose-500' : 'text-slate-700'}`}>
                          Cổng {log.gateId}
                        </td>
                        <td className={`px-5 py-3 font-bold ${denied ? 'text-rose-500' : 'text-slate-800'}`}>
                          {log.vehicleId}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{translateAction(log.action)}</td>
                        <td className="px-5 py-3 text-slate-500">{log.time}</td>
                        <td className={`px-5 py-3 text-right text-xs font-bold ${st.cls}`}>
                          {st.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
