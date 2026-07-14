import React, { useState } from 'react';
import {
  Send, Flame, Car, Server, ShieldAlert, HeartPulse, AlertTriangle, Bike, Monitor,
} from 'lucide-react';
import type { EmergencyLog, IncidentType, EmergencyStatus } from '../../types/staff';
import type { Slot } from '../../data/mockData';
import ParkingFloorMap, { type MapSlot } from '../../components/ParkingFloorMap';

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

interface EmergencyPanelProps {
  emergencyLogs: EmergencyLog[];
  onSubmit: (type: IncidentType, description: string, slotCode?: string, floor?: string) => void;
  slots?: Slot[];
  addToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onSetSlotStatus?: (slotCode: string, status: Slot['status']) => Promise<boolean>;
}

export default function EmergencyPanel({
  emergencyLogs,
  onSubmit,
  slots = [],
  addToast,
  onSetSlotStatus,
}: EmergencyPanelProps) {
  const [eDesc, setEDesc] = useState('');
  const [slotStatusSaving, setSlotStatusSaving] = useState(false);
  const [eAreaMode, setEAreaMode] = useState<'all' | 'car' | 'motorbike'>('all');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const mapSlotData: MapSlot[] = slots.map((s) => ({
    id: s.slotCode,
    code: s.slotCode.split('-').pop() ?? s.slotCode,
    status: s.status as MapSlot['status'],
  }));

  const cleanSelectedSlot = selectedSlot?.startsWith('virtual-')
    ? selectedSlot.slice('virtual-'.length)
    : selectedSlot;

  const selectedSlotData = cleanSelectedSlot
    ? slots.find((s) => s.slotCode === cleanSelectedSlot)
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
      </div>
    </div>
  );
}
