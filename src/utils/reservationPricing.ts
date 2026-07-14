import type { Reservation, PricingRule, Payment } from '../data/mockData';

/**
 * Quy tắc gửi quá giờ cho vé đặt chỗ có giờ hẹn (Fixed-time):
 * - "Gửi theo lượt"  : quá giờ tính từ SAU 24 GIỜ kể từ giờ đến dự kiến;
 *                      phụ phí = 40% × giá gửi theo lượt.
 * - "Qua đêm"        : quá giờ tính từ SAU 24:00 CỦA NGÀY HÔM SAU ngày đến;
 *                      phụ phí = 40% × giá gửi qua đêm.
 * (base = giá vé gói đã chốt lúc đặt, nên "40% giá vé" đúng theo từng gói.)
 * - Vé CHƯA thanh toán → còn phải thu = giá vé + phụ phí.
 * - Vé ĐÃ thanh toán   → còn phải thu = chỉ phụ phí.
 */
export const PER_VISIT_OVERSTAY_HOURS = 24;
export const PER_VISIT_OVERSTAY_RATE = 0.4;

/** Gói "Gửi theo lượt" (Fixed-time có khung giờ). */
export function isPerVisitReservation(r: Reservation): boolean {
  if (r.note?.startsWith('Gửi theo lượt')) return true;
  return r.reservationType === 'Fixed-time' && !!r.endTime;
}

/** Gói "Qua đêm" (Fixed-time không có endTime — xe có thể ở nhiều ngày). */
export function isOvernightReservation(r: Reservation): boolean {
  if (r.note?.startsWith('Qua đêm')) return true;
  return r.reservationType === 'Fixed-time' && !r.endTime;
}

export type PerVisitOverstay = {
  overstayed: boolean;
  /** Giá vé đã chốt lúc đặt (theo lượt hoặc qua đêm). */
  base: number;
  /** Phụ phí quá giờ = 40% × base. */
  surcharge: number;
  /** base + surcharge — số phải thu khi vé CHƯA thanh toán. */
  total: number;
};

export function perVisitOverstay(
  r: Reservation,
  rules: PricingRule[] = [],
  at: number = Date.now(),
): PerVisitOverstay {
  const rule = rules.find((x) => x.vehicleType === r.vehicleType) ?? rules[0];
  const perVisit = isPerVisitReservation(r);
  const overnight = !perVisit && isOvernightReservation(r);
  const fallback = overnight ? rule?.overnightPrice : rule?.firstHourPrice;
  const base = r.estimatedCost != null && r.estimatedCost > 0 ? r.estimatedCost : fallback ?? 0;
  const none: PerVisitOverstay = { overstayed: false, base, surcharge: 0, total: base };

  if (!perVisit && !overnight) return none; // vé tháng (Flexible) không áp quy tắc này
  // Only a car that's actually still in the lot can overstay — bookings that
  // never checked in are handled by the 2-hour no-show auto-cancel instead.
  if (r.status !== 'Checked-in') return none;

  const dateOnly = r.date.split('T')[0];
  let deadline: number;
  if (overnight) {
    // Qua đêm: ân hạn tới hết 24:00 của ngày hôm sau ngày đến (00:00 ngày +2)
    const d = new Date(`${dateOnly}T00:00:00`);
    if (Number.isNaN(d.getTime())) return none;
    d.setDate(d.getDate() + 2);
    deadline = d.getTime();
  } else {
    const arrival = new Date(`${dateOnly}T${r.startTime.slice(0, 5)}:00`).getTime();
    if (!Number.isFinite(arrival)) return none;
    deadline = arrival + PER_VISIT_OVERSTAY_HOURS * 3_600_000;
  }
  if (at <= deadline) return none;

  const surcharge = Math.round(base * PER_VISIT_OVERSTAY_RATE);
  return { overstayed: true, base, surcharge, total: base + surcharge };
}

/** Vé đã có giao dịch Paid gắn với nó chưa (reservationCode giữ nguyên qua check-in; ticketCode cho bản ghi cũ). */
export function isReservationPaid(r: Reservation, payments: Payment[] = []): boolean {
  return payments.some(
    (p) =>
      p.status === 'Paid' &&
      (p.reservationCode === r.reservationCode || p.ticketCode === r.reservationCode),
  );
}

/** Số tiền còn phải thu khi quá giờ: đã thanh toán → chỉ phụ phí; chưa → giá vé + phụ phí. */
export function overstayDue(info: PerVisitOverstay, paid: boolean): number {
  return paid ? info.surcharge : info.total;
}
