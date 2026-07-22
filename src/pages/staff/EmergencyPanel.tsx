import React, { useMemo, useState } from 'react';
import {
  Send, Flame, Car, Server, ShieldAlert, HeartPulse, AlertTriangle, Bike, Monitor, Search, MapPin,
} from 'lucide-react';
import type { EmergencyLog, IncidentType, EmergencyStatus } from '../../types/staff';
import type { Slot, Reservation } from '../../data/mockData';
import ParkingFloorMap, { type MapSlot } from '../../components/ParkingFloorMap';
import { PARKING_LOTS, lotKeyOf } from '../../utils/parkingLots';

/**
 * "Sự cố Khẩn cấp" panel — báo cáo khẩn cấp + sơ đồ trực tiếp + nhật ký.
 * Lives on the staff Bảng điều khiển (StaffOverview).
 */

const statusPill: Record<EmergencyStatus, { label: string; cls: string }> = {
  NEW:      { label: 'MỚI',     cls: 'bg-amber-500   text-white'     },
  LOGGED:   { label: 'ĐÃ GHI',  cls: 'bg-slate-200   text-slate-700' },
  RESOLVED: { label: 'ĐÃ XỬ',   cls: 'bg-rose-600    text-white'     },
  FIXED:    { label: 'ĐÃ SỬA',  cls: 'bg-emerald-600 text-white'     },
};

const typeIcon: Record<string, { icon: React.ElementType; wrap: string }> = {
  'Fire / Smoke':      { icon: Flame,         wrap: 'bg-rose-50    text-rose-600'    },
  'Vehicle Collision': { icon: Car,           wrap: 'bg-blue-50    text-blue-600'    },
  'Equipment Failure': { icon: Server,        wrap: 'bg-violet-50  text-violet-600'  },
  'Security Breach':   { icon: ShieldAlert,   wrap: 'bg-slate-100  text-slate-600'   },
  'Medical Emergency': { icon: HeartPulse,    wrap: 'bg-emerald-50 text-emerald-600' },
  'Other':             { icon: AlertTriangle, wrap: 'bg-amber-50  text-amber-600'    },
};

const STATUS_VI: Record<string, string> = {
  Available:   'Trống',
  Occupied:    'Đang đỗ',
  Reserved:    'Đã đặt',
  Pending:     'Chờ duyệt',
  Maintenance: 'Bảo trì',
  Locked:      'Đã khóa',
};

// Staff can only flip a slot between the day-to-day states; Bảo trì/Đã khóa
// are reserved for Manager tooling.
const SLOT_STATUS_OPTIONS: { value: Slot['status']; label: string; cls: string }[] = [
  { value: 'Available', label: 'Trống',   cls: 'bg-white border border-blue-400 text-blue-700' },
  { value: 'Occupied',  label: 'Đang đỗ', cls: 'bg-emerald-600 text-white' },
  { value: 'Reserved',  label: 'Đã đặt',  cls: 'bg-amber-400 text-white' },
];

/** So khớp biển số bất chấp dấu gạch/chấm: "29C138383" tìm ra "29C1-383.83". */
const normalizePlate = (p: string) => p.toLowerCase().replace(/[^a-z0-9]/g, '');

interface EmergencyPanelProps {
  emergencyLogs: EmergencyLog[];
  onSubmit: (type: IncidentType, description: string, slotCode?: string, floor?: string) => void;
  /** Ô đỗ CỦA BÃI STAFF PHỤ TRÁCH (StaffDashboard đã lọc sẵn theo bãi). */
  slots?: Slot[];
  /** Đặt chỗ của bãi phụ trách — nguồn cho bảng "xe đang đỗ ở đâu". */
  reservations?: Reservation[];
  /** Bãi staff phụ trách — hiển thị cố định, staff không đổi được bãi. */
  assignedLot?: string;
  addToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onSetSlotStatus?: (slotCode: string, status: Slot['status']) => Promise<boolean>;
}

export default function EmergencyPanel({
  emergencyLogs,
  onSubmit,
  slots = [],
  reservations = [],
  assignedLot,
  addToast,
  onSetSlotStatus,
}: EmergencyPanelProps) {
  const [eDesc, setEDesc] = useState('');
  const [slotStatusSaving, setSlotStatusSaving] = useState(false);
  const [eAreaMode, setEAreaMode] = useState<'all' | 'car' | 'motorbike'>('all');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // ── Bãi phụ trách ───────────────────────────────────────────────────────────
  // Staff chỉ làm việc trên đúng bãi được Quản lý phân công — không còn dropdown
  // chọn bãi. Nhãn đầy đủ lấy từ danh mục bãi (vd. "ParkFlow Quận 9 - Lò Lu").
  const assignedLotLabel = useMemo(() => {
    const key = lotKeyOf(assignedLot);
    return PARKING_LOTS.find((l) => l.key === key)?.bookingLabel ?? assignedLot ?? '';
  }, [assignedLot]);
  const lotSlots = slots;
  // Bị phân công lại bãi khác giữa phiên → ô đang chọn (bãi cũ) không còn hợp lệ
  React.useEffect(() => {
    setSelectedSlot(null);
  }, [assignedLot]);

  // ── Tra cứu biển số → vị trí đỗ (trong bãi phụ trách) ───────────────────────
  const [searchPlate, setSearchPlate] = useState('');
  const parkedVehicles = useMemo(
    () => reservations.filter((r) => r.status === 'Checked-in' && r.slotCode),
    [reservations],
  );
  const matchedVehicles = useMemo(() => {
    const q = normalizePlate(searchPlate);
    if (!q) return parkedVehicles;
    return parkedVehicles.filter((r) => normalizePlate(r.licensePlate).includes(q));
  }, [parkedVehicles, searchPlate]);

  const mapSlotData: MapSlot[] = lotSlots.map((s) => ({
    id: s.slotCode,
    code: s.slotCode.split('-').pop() ?? s.slotCode,
    status: s.status as MapSlot['status'],
  }));

  const cleanSelectedSlot = selectedSlot?.startsWith('virtual-')
    ? selectedSlot.slice('virtual-'.length)
    : selectedSlot;

  const selectedSlotData = cleanSelectedSlot
    ? lotSlots.find((s) => s.slotCode === cleanSelectedSlot)
    : undefined;

  const handleSendEmergency = () => {
    if (!eDesc.trim()) { addToast?.('Vui lòng mô tả chi tiết sự cố.', 'error'); return; }
    onSubmit('Other', eDesc.trim(), cleanSelectedSlot ?? undefined, selectedSlotData?.floorName);
    setEDesc(''); setSelectedSlot(null);
  };

  const handleChangeSlotStatus = async (status: Slot['status']) => {
    if (!cleanSelectedSlot || !onSetSlotStatus) return;
    setSlotStatusSaving(true);
    await onSetSlotStatus(cleanSelectedSlot, status);
    setSlotStatusSaving(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Form */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        {/* Bãi phụ trách — cố định theo phân công của Quản lý, không chọn được */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Bãi đỗ phụ trách</label>
          <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">
              {assignedLotLabel || 'Chưa được phân công bãi'}
            </span>
          </div>
        </div>

        {/* Live parking floor map */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-600">Sơ đồ bãi đỗ — Trực tiếp</p>
              <p className="text-[11px] text-slate-400">Bấm vào ô để chọn vị trí sự cố</p>
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
              {([
                { key: 'all',       label: 'Tất cả', icon: Monitor },
                { key: 'car',       label: 'Ô tô',   icon: Car },
                { key: 'motorbike', label: 'Xe máy', icon: Bike },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setEAreaMode(key)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    eAreaMode === key ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <ParkingFloorMap
              slots={mapSlotData}
              selectedId={selectedSlot}
              onSelect={(id) => setSelectedSlot(id === selectedSlot ? null : id)}
              interactive={true}
              issueMode={true}
              areaMode={eAreaMode}
            />
          </div>
          {cleanSelectedSlot && (
            <div className="mt-2 rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-xs font-semibold text-rose-600">
                Vị trí đã chọn: <span className="font-bold">{selectedSlotData?.slotCode.split('-').pop() ?? cleanSelectedSlot}</span>
                {selectedSlotData && (
                  <span className="ml-2 font-normal text-slate-400">
                    ({selectedSlotData.floorName} · {STATUS_VI[selectedSlotData.status] ?? selectedSlotData.status})
                  </span>
                )}
              </p>
              {onSetSlotStatus && selectedSlotData && (
                <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                  <p className="mb-1.5 text-[11px] font-bold text-slate-500">Đổi trạng thái ô đỗ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SLOT_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={slotStatusSaving || selectedSlotData.status === opt.value}
                        onClick={() => handleChangeSlotStatus(opt.value)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${opt.cls}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">Mô tả chi tiết</label>
          <textarea
            value={eDesc}
            onChange={(e) => setEDesc(e.target.value)}
            placeholder="Cung cấp mô tả chi tiết về sự cố xảy ra..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSendEmergency}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white hover:bg-rose-700 transition"
          >
            <Send className="h-4 w-4" /> Gửi cảnh báo
          </button>
          <button
            onClick={() => { setEDesc(''); setSelectedSlot(null); }}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            Hủy bỏ
          </button>
        </div>
      </div>

      {/* Right column: recent emergency logs */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Nhật ký khẩn cấp gần đây</h3>
          </div>
          <div className="space-y-4">
            {emergencyLogs.slice(0, 5).map((log) => {
              const meta  = typeIcon[log.type] ?? typeIcon.Other;
              const Icon  = meta.icon;
              const badge = statusPill[log.status];
              return (
                <div key={log.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.wrap}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-snug">{log.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.createdAt}</p>
                        </div>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{log.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {emergencyLogs.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Chưa có sự cố khẩn cấp</p>
            )}
          </div>
        </div>

        {/* Tra cứu biển số → vị trí xe đang đỗ */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-800">Xe đang đỗ trong bãi</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600">
              {parkedVehicles.length} xe
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              placeholder="Tìm biển số (vd: 29C1-38383)..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm uppercase tracking-wider focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {matchedVehicles.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-2">Biển số</th>
                    <th className="py-2 pr-2">Vị trí</th>
                    <th className="py-2 text-right">Giờ đến</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedVehicles.map((v) => {
                    const isLocated = selectedSlot === v.slotCode;
                    return (
                      <tr
                        key={v.id}
                        // Bấm một xe → highlight đúng ô của nó trên sơ đồ bên trái
                        onClick={() => setSelectedSlot(isLocated ? null : v.slotCode ?? null)}
                        className={`cursor-pointer border-b border-slate-50 last:border-0 transition ${
                          isLocated ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                        title="Bấm để xem vị trí trên sơ đồ"
                      >
                        <td className="py-2.5 pr-2 font-mono font-bold text-slate-800">{v.licensePlate}</td>
                        <td className="py-2.5 pr-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                            <MapPin className="h-3.5 w-3.5" />
                            {v.slotCode?.split('-').pop() ?? v.slotCode}
                          </span>
                          <span className="block text-[10px] text-slate-400">{v.floor}</span>
                        </td>
                        <td className="py-2.5 text-right text-xs text-slate-500">
                          {v.date.split('T')[0]}
                          <span className="block font-semibold text-slate-700">{v.startTime.slice(0, 5)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                {parkedVehicles.length === 0
                  ? 'Chưa có xe nào đang đỗ trong bãi'
                  : `Không tìm thấy biển số "${searchPlate}"`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
