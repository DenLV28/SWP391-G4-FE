import { useEffect, useState } from 'react';
import { AlertTriangle, X, Loader2, History, ShieldAlert, RefreshCw } from 'lucide-react';
import type { Slot } from '../data/mockData';
import { fetchForceClearLogs, type ForceClearLog } from '../services/slotService';

interface Props {
  slots: Slot[];
  /** Performs the force-clear against the backend; returns whether it succeeded. */
  onForceClear: (slotCode: string, reason: string) => Promise<boolean>;
}

/**
 * Staff/Manager-only panel: lists every currently Occupied slot with a
 * "Buộc dọn ô đỗ" action, for cases where a vehicle has already left but the
 * slot (or its sensor) is still stuck showing Occupied.
 */
export default function OccupiedSlotsPanel({ slots, onForceClear }: Props) {
  const occupied = slots.filter((s) => s.status === 'Occupied');

  const [target, setTarget] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [logs, setLogs] = useState<ForceClearLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadLogs = () => {
    setLogsLoading(true);
    fetchForceClearLogs(10)
      .then(setLogs)
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    if (showLogs) loadLogs();
  }, [showLogs]);

  const closeModal = () => {
    setTarget(null);
    setReason('');
    setFormError('');
  };

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    setFormError('');
    const ok = await onForceClear(target.slotCode, reason.trim());
    setSubmitting(false);
    if (ok) {
      closeModal();
      if (showLogs) loadLogs();
    } else {
      setFormError('Không thể buộc dọn ô đỗ. Vui lòng thử lại.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <ShieldAlert className="h-5 w-5 text-rose-600" /> Ô đỗ đang có xe (Occupied)
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Dùng khi xe đã rời bãi nhưng hệ thống/cảm biến vẫn báo ô đỗ đang bị chiếm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
            {occupied.length} ô
          </span>
          <button
            onClick={() => setShowLogs((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <History className="h-3.5 w-3.5" /> Nhật ký
          </button>
        </div>
      </div>

      {occupied.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-slate-400">Không có ô đỗ nào đang bị chiếm.</div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto px-5 pb-5">
          {occupied.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-mono font-bold text-slate-800 text-sm">{slot.slotCode}</p>
                <p className="truncate text-xs text-slate-400">{slot.floorName} · {slot.areaName}</p>
              </div>
              <button
                onClick={() => setTarget(slot)}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                Buộc dọn ô đỗ
              </button>
            </div>
          ))}
        </div>
      )}

      {showLogs && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lịch sử buộc dọn gần đây</p>
            <button onClick={loadLogs} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có thao tác buộc dọn nào được ghi nhận.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700">{log.slotCode}</span>
                    <span className="text-slate-400">{log.createdAt}</span>
                  </div>
                  <p className="mt-0.5 text-slate-500">
                    {log.performedByName || 'Không rõ'} ({log.performedByRole})
                    {log.licensePlate && <> · Xe {log.licensePlate}</>}
                  </p>
                  {log.reason && <p className="mt-0.5 italic text-slate-400">"{log.reason}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h4 className="text-base font-bold text-slate-800">Buộc dọn ô đỗ {target.slotCode}?</h4>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Chỉ dùng khi ô đỗ bị đánh dấu sai là đang có xe, hoặc bạn đã xác minh thủ công rằng xe đã rời bãi.
              Nếu ô đỗ này đang gắn với một phiên gửi xe, phiên đó sẽ được đóng lại tự động.
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Lý do (khuyến nghị)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="VD: Cảm biến báo sai, đã xác minh xe rời bãi lúc 14:30"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
              />
            </div>
            {formError && <p className="text-xs text-rose-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xác nhận buộc dọn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
