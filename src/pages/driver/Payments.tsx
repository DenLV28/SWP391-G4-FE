import React, { useState } from 'react';
import { Receipt, X } from 'lucide-react';
import { Payment } from '../../data/mockData';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import SectionTitle from '../../components/SectionTitle';

type PaymentMethod = 'Cash' | 'Card' | 'E-Wallet' | 'QR Banking';

export default function Payments({
  payments,
  onConfirmPayment,
}: {
  payments: Payment[];
  onConfirmPayment: (id: string, method: PaymentMethod) => void;
}) {
  const [filter, setFilter] = useState<'Tất cả' | 'Paid' | 'Unpaid' | 'Failed'>('Tất cả');
  const [selectedMethods, setSelectedMethods] = useState<Record<string, PaymentMethod | ''>>({});
  const [activeQR, setActiveQR] = useState<Payment | null>(null);

  const filtered = payments.filter((payment) => {
    if (filter === 'Tất cả') return true;
    return payment.status === filter;
  });

  const handlePayConfirm = (id: string) => {
    const matchedMethod = selectedMethods[id];
    if (!matchedMethod) {
      alert('Vui lòng chọn phương thức thanh toán trước khi xác nhận.');
      return;
    }
    onConfirmPayment(id, matchedMethod);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Thanh toán" subtitle="Theo dõi phí, xử lý hóa đơn còn nợ và xem lịch sử thanh toán" />

      <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs">
        {(['Tất cả', 'Paid', 'Unpaid', 'Failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-4 py-2 font-bold transition ${filter === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {tab === 'Tất cả' ? 'Tất cả' : tab === 'Paid' ? 'Đã thanh toán' : tab === 'Unpaid' ? 'Chưa thanh toán' : 'Thanh toán lỗi'}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filtered.map((payment) => (
            <div key={payment.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <span className="block text-[9px] font-bold uppercase text-slate-400">Mã hóa đơn / vé xe</span>
                  <span className="text-sm font-bold text-slate-800">{payment.id} ({payment.ticketCode})</span>
                </div>
                <StatusBadge status={payment.status} />
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-b border-slate-50 pb-3 text-slate-500">
                <Row label="Phí gửi xe" value={payment.parkingFee} />
                <Row label="Phí dịch vụ" value={payment.extraServiceFee} />
                <Row label="Phí mất thẻ" value={payment.lostTicketFee} />
                {payment.overtimeFee !== undefined && payment.overtimeFee > 0 && <Row label="Phí quá giờ" value={payment.overtimeFee} tone="rose" />}
                <div className="flex justify-between text-[13px] font-bold text-blue-600">
                  <span>Tổng tiền</span>
                  <span>{formatMoney(payment.totalAmount)}</span>
                </div>
              </div>

              {payment.status === 'Unpaid' ? (
                <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Phương thức:</span>
                    <select
                      value={selectedMethods[payment.id] || ''}
                      onChange={(e) => setSelectedMethods((prev) => ({ ...prev, [payment.id]: e.target.value as PaymentMethod }))}
                      className="rounded-lg border border-slate-200 px-2 py-1 font-semibold text-slate-700 outline-none"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="QR Banking">Chuyển khoản QR</option>
                      <option value="E-Wallet">Ví điện tử</option>
                      <option value="Card">Thẻ</option>
                      <option value="Cash">Tiền mặt</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handlePayConfirm(payment.id)}
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white transition hover:bg-blue-500"
                  >
                    Xác nhận thanh toán
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] text-slate-400">
                  <div className="flex flex-col gap-1">
                    <span>
                      Phương thức: <strong className="text-slate-600">{payment.method || 'Chưa ghi nhận'}</strong>
                    </span>
                    {payment.paidAt && (
                      <span>
                        Đã thanh toán lúc: <strong className="text-slate-600">{payment.paidAt}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveQR(payment)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Xem QR ra cổng
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Receipt} title="Chưa có hóa đơn nào" description="Khi thanh toán hoàn tất, các hóa đơn phù hợp bộ lọc sẽ hiển thị tại đây." />
      )}

      {activeQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xs space-y-5 rounded-2xl bg-white p-6 text-center shadow-xl">
            <button
              onClick={() => setActiveQR(null)}
              className="absolute right-4 top-4 cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-600">Thẻ ra cổng hợp lệ</span>
              <h4 className="mt-0.5 text-base font-extrabold text-slate-800">{activeQR.ticketCode}</h4>
            </div>

            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-800">
              <div className="space-y-1.5 p-2">
                <span className="block font-mono text-[9px] font-bold uppercase text-emerald-600">Mã QR hợp lệ</span>
                <div className="mx-auto my-2 h-12 w-12 rounded-md border-2 border-current opacity-80" />
                <span className="block font-mono text-xs font-bold">{activeQR.id}</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 text-left text-[11px] text-slate-500">
              <Row label="Thời gian thanh toán" value={activeQR.paidAt || 'Chưa có'} />
              <Row label="Hiệu lực đến" value={getExpiryText(activeQR.paidAt)} tone="rose" />
            </div>

            <div className="flex gap-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-left text-[10px] font-medium text-rose-700">
              <p>
                Bạn có đúng <strong>15 phút</strong> để quét mã QR này tại barie ra cổng. Quá thời gian sẽ phát sinh phí quá giờ.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function Row({ label, value, tone }: { label: string; value: number | string; tone?: 'rose' }) {
  return (
    <div className={`flex justify-between ${tone === 'rose' ? 'font-bold text-rose-600' : ''}`}>
      <span>{label}:</span>
      <span className="font-bold text-slate-700">{typeof value === 'number' ? formatMoney(value) : value}</span>
    </div>
  );
}

function getExpiryText(paidAt?: string) {
  if (!paidAt) return 'Không xác định';
  const [datePart, timePart] = paidAt.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hrs, mins] = timePart.split(':').map(Number);
  const expiry = new Date(year, month - 1, day, hrs, mins + 15);
  const yyyy = expiry.getFullYear();
  const mm = String(expiry.getMonth() + 1).padStart(2, '0');
  const dd = String(expiry.getDate()).padStart(2, '0');
  const hh = String(expiry.getHours()).padStart(2, '0');
  const mi = String(expiry.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
