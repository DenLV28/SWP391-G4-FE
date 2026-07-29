import React, { useMemo, useState } from 'react';
import { BadgeInfo, CheckCircle, Clock, Lock, Ticket, Unlock, X } from 'lucide-react';
import { ParkingSession, PricingRule, User, Slot, Payment } from '../../data/mockData';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import SectionTitle from '../../components/SectionTitle';

type PaymentMethod = 'Cash' | 'Card' | 'E-Wallet' | 'QR Banking';

interface CurrentSessionProps {
  currentSession: ParkingSession;
  setView: (view: string) => void;
  onCheckOutSession: (ticketCode: string, paymentMethod: PaymentMethod, finalAmount: number) => boolean;
  pricingRules: PricingRule[];
  currentUser: User;
  slots: Slot[];
  payments?: Payment[];
}

function formatMoney(value: number) {
  return value.toLocaleString('vi-VN') + 'đ';
}

function formatDuration(startTime: string, endTime?: string) {
  if (!endTime) return 'Đang diễn ra';
  const start = new Date(startTime.replace(' ', 'T'));
  const end = new Date(endTime.replace(' ', 'T'));
  const diffMins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
  if (diffMins < 60) return `${diffMins} phút`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours} giờ ${mins} phút`;
}

export default function CurrentSession({
  currentSession,
  setView,
  onCheckOutSession,
  pricingRules,
  currentUser,
  slots,
}: CurrentSessionProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkOutTimeInput, setCheckOutTimeInput] = useState(() =>
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR Banking');
  const [barrierStatus, setBarrierStatus] = useState<'Closed' | 'Opened'>('Closed');
  const [paymentStatus, setPaymentStatus] = useState<'Unpaid' | 'Partially Paid' | 'Paid' | 'Failed'>('Unpaid');

  const pricingRule = useMemo(
    () => pricingRules.find((rule) => rule.vehicleType === currentSession.vehicleType) ?? pricingRules[0],
    [pricingRules, currentSession.vehicleType]
  );

  const estimatedFee = useMemo(() => currentSession.estimatedFee || pricingRule.firstHourPrice + pricingRule.extraServiceFee, [currentSession.estimatedFee, pricingRule]);
  const stayDuration = useMemo(() => formatDuration(currentSession.checkInTime, currentSession.checkOutTime), [currentSession.checkInTime, currentSession.checkOutTime]);
  const hasSession =
    currentSession &&
    currentSession.ticketCode &&
    (currentSession.sessionStatus === 'Active' || currentSession.sessionStatus === 'Completed');

  const openCheckout = () => {
    if (currentSession.sessionStatus !== 'Active') {
      alert('Lượt gửi đã hoàn tất hoặc đã bị hủy.');
      return;
    }
    if (!currentUser || currentUser.status !== 'Active') {
      alert('Tài khoản hiện không hoạt động.');
      return;
    }
    const matchedSlot = slots.find((slot) => slot.slotCode === currentSession.slotCode);
    if (!matchedSlot) {
      alert('Thiếu thông tin ô đỗ xe.');
      return;
    }
    setCheckOutTimeInput(new Date().toISOString().slice(0, 16).replace('T', ' '));
    setPaymentMethod('QR Banking');
    setBarrierStatus('Closed');
    setPaymentStatus(currentSession.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid');
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = () => {
    const success = onCheckOutSession(currentSession.ticketCode, paymentMethod, estimatedFee);
    if (!success) {
      setPaymentStatus('Failed');
      alert('Giao dịch thanh toán thất bại.');
      return;
    }
    setPaymentStatus('Paid');
    setBarrierStatus('Opened');
    setTimeout(() => setShowCheckoutModal(false), 1200);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Lượt gửi hiện tại" subtitle="Theo dõi giờ vào, ô đỗ, phí tạm tính và thao tác khi xe ra" />

      {hasSession ? (
        <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-50 pb-4 sm:flex-row">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mã vé gửi xe</span>
              <h3 className="mt-0.5 text-xl font-bold text-slate-800">{currentSession.ticketCode}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={currentSession.sessionStatus} />
              <StatusBadge status={currentSession.paymentStatus} />
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                  currentSession.barrierStatus === 'Opened'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-rose-100 bg-rose-50 text-rose-700'
                }`}
              >
                {currentSession.barrierStatus === 'Opened' ? 'Barie mở' : 'Barie đóng'}
              </span>
            </div>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox title="Biển số xe" value={currentSession.licensePlate} />
            <InfoBox title="Loại xe" value={currentSession.vehicleType} />
            <InfoBox title="Giờ vào" value={currentSession.checkInTime} />
            {currentSession.expectedEndTime ? <InfoBox title="Giờ kết thúc dự kiến" value={currentSession.expectedEndTime} tone="blue" /> : <InfoBox title="Phí tạm tính" value={formatMoney(estimatedFee)} tone="emerald" />}
            {currentSession.expectedEndTime && currentSession.sessionStatus === 'Completed' && currentSession.checkOutTime ? (
              <InfoBox title="Giờ ra" value={currentSession.checkOutTime} tone="emerald" />
            ) : null}
            <InfoBox title="Tòa nhà" value="Tòa bãi đỗ trung tâm" />
            <InfoBox title="Tầng / khu" value={`${currentSession.floor} • ${currentSession.area.split(' - ')[1] || currentSession.area}`} />
            <InfoBox title="Ô đỗ được gán" value={currentSession.slotCode} tone="blue" />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800">Dòng thời gian lượt gửi</h4>
            <div className="relative space-y-4 pl-6 text-xs">
              <div className="absolute bottom-1 top-1 left-[5px] w-px bg-slate-200" />

              {currentSession.sessionStatus === 'Completed' && currentSession.checkOutTime && (
                <TimelineItem
                  icon={<CheckCircle className="h-2 w-2" />}
                  tone="emerald"
                  time={currentSession.checkOutTime}
                  title="Thanh toán khi ra thành công"
                  description="Lượt gửi đã kết thúc. Barie đã mở và ô đỗ đã được trả về danh sách trống."
                />
              )}

              <TimelineItem
                icon={null}
                tone="blue"
                time={currentSession.checkInTime}
                title="Xe đã vào cổng"
                description={`Quét barie vào tự động hoàn tất tại ${currentSession.entryGate}.`}
              />

              <TimelineItem
                icon={null}
                tone="blue"
                time={currentSession.checkInTime}
                title="Đã gán ô đỗ"
                description={`Hệ thống đã cấp ô ${currentSession.slotCode} tại ${currentSession.floor}.`}
              />

              {currentSession.sessionStatus === 'Active' && (
                <TimelineItem
                  icon={null}
                  tone="indigo"
                  time="Đang diễn ra"
                  title="Xe đang đỗ trong bãi"
                  description="Phí sẽ tăng theo thời gian theo quy định của bãi."
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {currentSession.sessionStatus === 'Active' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQRModal(true)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Xem mã QR vé xe
                </button>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
                >
                  Mô phỏng quét khi ra
                </button>
              </>
            )}
            {currentSession.sessionStatus === 'Completed' && (
              <button
                type="button"
                onClick={() => setView('myparking')}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Quay lại trang của tôi
              </button>
            )}
          </div>
        </div>
      ) : (
        <EmptyState icon={Ticket} title="Chưa có lượt gửi đang hoạt động" description="Dữ liệu vào bãi sẽ được tạo tự động từ lịch sử quét cổng." />
      )}

      {showQRModal && (
        <Modal onClose={() => setShowQRModal(false)} title="Vé quét khi ra" subtitle={currentSession.ticketCode}>
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
            <div className="space-y-1.5 p-2">
              <span className="block font-mono text-[9px] text-slate-400">MÃ QR ĐIỆN TỬ</span>
              <span className="block font-mono text-xs font-bold text-slate-700">{currentSession.ticketCode}</span>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-4 text-left text-[11px] text-slate-500">
            <Row label="Biển số" value={currentSession.licensePlate} />
            <Row label="Tầng / khu" value={`${currentSession.floor} • ${currentSession.slotCode}`} />
            <Row label="Giờ vào" value={currentSession.checkInTime} />
          </div>
          <p className="text-[9px] italic text-slate-400">Vui lòng quét tại làn ra để hoàn tất thanh toán.</p>
        </Modal>
      )}

      {showCheckoutModal && (
        <Modal onClose={() => setShowCheckoutModal(false)} title="Mô phỏng quét khi xe ra" subtitle="Tóm tắt hóa đơn thanh toán">
          <div className="rounded-2xl border border-indigo-100/50 bg-indigo-50/50 p-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn thời điểm xe ra</label>
              <input
                type="datetime-local"
                value={checkOutTimeInput.replace(' ', 'T')}
                onChange={(e) => setCheckOutTimeInput(e.target.value.replace('T', ' '))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
              {['+30 phút', '+2 giờ', '+1 ngày (qua đêm)'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const next = new Date(now.getTime() + (label.includes('30') ? 30 : label.includes('2 giờ') ? 120 : 1440) * 60000);
                    setCheckOutTimeInput(next.toISOString().slice(0, 16).replace('T', ' '));
                  }}
                  className="cursor-pointer rounded bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-2.5">
            <Row label="Mã vé" value={currentSession.ticketCode} />
            <Row label="Biển số / loại xe" value={`${currentSession.licensePlate} (${currentSession.vehicleType})`} />
            <Row label="Giờ vào" value={currentSession.checkInTime} />
            <Row label="Giờ ra thực tế" value={checkOutTimeInput} />
            <Row label="Thời gian gửi xe" value={formatDuration(currentSession.checkInTime, checkOutTimeInput)} />
            <Row label="Phí gửi xe cơ bản" value={formatMoney(estimatedFee)} />
            {currentSession.expectedEndTime && <Row label="Giờ kết thúc dự kiến" value={currentSession.expectedEndTime} />}
            <Row label="Thời gian ân hạn" value="15 phút" />
            <Row label="Trạng thái thanh toán" value={<StatusBadge status={paymentStatus} />} />
            <Row
              label="Trạng thái barie"
              value={
                <span
                  className={`inline-flex items-center gap-1 rounded border border-dashed bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                    barrierStatus === 'Opened' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {barrierStatus === 'Opened' ? (
                    <>
                      <Unlock className="h-2.5 w-2.5" /> Mở
                    </>
                  ) : (
                    <>
                      <Lock className="h-2.5 w-2.5" /> Đóng
                    </>
                  )}
                </span>
              }
            />
          </div>

          {paymentStatus === 'Unpaid' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'QR Banking' as PaymentMethod, label: 'Chuyển khoản QR' },
                  { key: 'E-Wallet' as PaymentMethod, label: 'Ví điện tử' },
                  { key: 'Card' as PaymentMethod, label: 'Thẻ' },
                  { key: 'Cash' as PaymentMethod, label: 'Tiền mặt' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPaymentMethod(item.key)}
                    className={`cursor-pointer rounded-xl border p-3 text-center font-bold transition ${
                      paymentMethod === item.key ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentStatus === 'Failed' && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600">
              <BadgeInfo className="mt-0.5 h-4 w-4 shrink-0" />
              Giao dịch thanh toán thất bại.
            </div>
          )}

          {currentSession.paymentStatus === 'Paid' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              Thanh toán đã hoàn tất trước đó, barie sẽ mở ngay sau khi xác nhận.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCheckoutModal(false)}
              className="w-1/2 cursor-pointer rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy mô phỏng
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckout}
              className="flex w-1/2 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white transition hover:bg-indigo-500"
            >
              <Unlock className="h-3.5 w-3.5" />
              {currentSession.paymentStatus === 'Paid' ? 'Quét QR ra cổng và mở barie' : 'Xác nhận thanh toán và mở barie'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoBox({ title, value, tone }: { title: string; value: React.ReactNode; tone?: 'blue' | 'emerald' }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <span className={`block text-[9px] font-semibold uppercase ${tone === 'blue' ? 'text-blue-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-400'}`}>{title}</span>
      <span className="mt-1 block font-bold text-slate-850">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-200/50 pb-1">
      <span className="text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function TimelineItem({
  icon,
  tone,
  time,
  title,
  description,
}: {
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'indigo';
  time: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-6 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
          tone === 'emerald' ? 'bg-emerald-600' : tone === 'indigo' ? 'bg-indigo-500' : 'bg-blue-600'
        } text-white shadow-sm`}
      >
        {icon}
      </div>
      <div>
        <span className={`block text-[10px] font-semibold ${tone === 'emerald' ? 'text-emerald-600' : tone === 'indigo' ? 'text-indigo-500' : 'text-slate-400'}`}>{time}</span>
        <span className="block font-bold text-slate-800">{title}</span>
        <p className="mt-0.5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <span className="text-[10px] font-semibold uppercase text-slate-400">{subtitle}</span>}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}
