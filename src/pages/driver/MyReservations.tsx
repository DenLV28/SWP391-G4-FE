import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CarFront,
  CheckCircle,
  ChevronRight,
  Gift,
  History,
  MapPin,
  ParkingSquare,
  Ticket,
  UserCircle2,
  X,
} from 'lucide-react';
import {
  Area,
  Floor,
  ParkingSession,
  Reservation,
  SavedVehicle,
  Slot,
  SystemConfig,
  User,
} from '../../data/mockData';
import ConfirmModal from '../../components/ConfirmModal';
import parkingHeroImage from '../../assets/images/parkflow_bg_1779336618673.png';

export default function MyReservations({
  reservations,
  onAddReservation: _onAddReservation,
  onCancelReservation,
  floors: _floors,
  areas,
  slots,
  driverStatus,
  savedVehicles,
  systemConfig: _systemConfig,
  onCheckInReservation,
  onExpireReservation,
  setView,
  currentUser,
  currentSession,
}: {
  reservations: Reservation[];
  onAddReservation: (reservation: any) => void;
  onCancelReservation: (id: string) => void;
  floors: Floor[];
  areas: Area[];
  slots: Slot[];
  driverStatus: string;
  savedVehicles: SavedVehicle[];
  systemConfig: SystemConfig;
  onCheckInReservation: (reservationId: string) => { success: boolean; ticketCode?: string; slotCode?: string; error?: string };
  onExpireReservation: (id: string) => void;
  setView: (view: string) => void;
  currentUser: User;
  currentSession: ParkingSession;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);
  const [checkInSuccessData, setCheckInSuccessData] = useState<{ ticketCode: string; slotCode: string; floor: string; area: string } | null>(null);

  const reservationStats = useMemo(() => {
    return reservations.reduce(
      (acc, reservation) => {
        acc.total += 1;
        if (reservation.status === 'Confirmed') acc.confirmed += 1;
        if (reservation.status === 'Pending') acc.pending += 1;
        if (reservation.status === 'Completed') acc.completed += 1;
        if (reservation.status === 'Checked-in') acc.checkedIn += 1;
        return acc;
      },
      { total: 0, confirmed: 0, pending: 0, completed: 0, checkedIn: 0 },
    );
  }, [reservations]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const first = new Date(`${b.date}T${b.startTime}:00`).getTime();
      const second = new Date(`${a.date}T${a.startTime}:00`).getTime();
      return first - second;
    });
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return sortedReservations.filter((reservation) => {
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      const matchesVehicle = vehicleFilter === 'all' || reservation.vehicleType === vehicleFilter;
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        reservation.reservationCode.toLowerCase().includes(query) ||
        reservation.licensePlate.toLowerCase().includes(query) ||
        trimAreaName(reservation.area).toLowerCase().includes(query);

      return matchesStatus && matchesVehicle && matchesSearch;
    });
  }, [searchText, sortedReservations, statusFilter, vehicleFilter]);
  const nextReservation = useMemo(() => {
    return [...reservations]
      .filter((reservation) => reservation.status === 'Confirmed' || reservation.status === 'Pending')
      .sort((a, b) => {
        const first = new Date(`${a.date}T${a.startTime}:00`).getTime();
        const second = new Date(`${b.date}T${b.startTime}:00`).getTime();
        return first - second;
      })[0] ?? null;
  }, [reservations]);

  const defaultVehicle = savedVehicles.find((vehicle) => vehicle.isDefault) ?? savedVehicles[0] ?? null;
  const activeSession = currentSession.sessionStatus === 'Active' ? currentSession : null;
  const availableSlotCount = slots.filter((slot) => slot.status === 'Available').length;
  const occupancyRate = Math.round(((slots.length - availableSlotCount) / Math.max(1, slots.length)) * 100);

  const heroStatusText = activeSession
    ? `Xe đang đỗ tại: ${trimAreaName(activeSession.area)} - Vị trí ${activeSession.slotCode}`
    : nextReservation
    ? `Lượt gần nhất: ${formatDate(nextReservation.date)} • ${nextReservation.startTime}${nextReservation.endTime ? ` - ${nextReservation.endTime}` : ''}`
    : 'Chưa có lượt đỗ nào được xác nhận.';

  const heroStatusDetail = activeSession
    ? `${activeSession.floor} • ${trimAreaName(activeSession.area)}`
    : nextReservation
    ? `${nextReservation.floor} • ${trimAreaName(nextReservation.area)}`
    : 'Bạn có thể đặt chỗ mới ngay từ danh sách bãi trống.';

  const handleCancelClick = (reservation: Reservation) => {
    const startDate = new Date(`${reservation.date}T${reservation.startTime}:00`);
    if (startDate.getTime() - Date.now() < 15 * 60 * 1000) {
      alert('Chỉ có thể hủy đặt chỗ trước ít nhất 15 phút so với giờ bắt đầu.');
      return;
    }
    setCancelConfirmId(reservation.id);
  };

  const handleSimulateCheckIn = (reservation: Reservation) => {
    if (reservation.status !== 'Confirmed') {
      alert(statusMessage(reservation.status));
      return;
    }
    if (driverStatus !== 'Active') {
      alert('Tài khoản hiện không hoạt động.');
      return;
    }

    const [year, month, day] = reservation.date.split('-').map(Number);
    const [hour, minute] = reservation.startTime.split(':').map(Number);
    const startDateTime = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const windowStart = new Date(startDateTime.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(startDateTime.getTime() + 15 * 60 * 1000);

    if (now < windowStart) {
      alert('Quá sớm để vào bãi.');
      return;
    }
    if (now > windowEnd) {
      alert('Đã quá thời gian vào bãi.');
      return;
    }

    const areaRecord = areas.find((area) => area.areaName === reservation.area);
    if (!areaRecord) {
      alert('Khu vực đặt trước không còn hợp lệ hoặc không tồn tại.');
      return;
    }
    if (areaRecord.vehicleType !== reservation.vehicleType) {
      alert('Khu vực đã chọn không hỗ trợ loại xe này.');
      return;
    }

    const result = onCheckInReservation(reservation.id);
    if (result.success && result.ticketCode && result.slotCode) {
      setCheckInSuccessData({
        ticketCode: result.ticketCode,
        slotCode: result.slotCode,
        floor: reservation.floor,
        area: reservation.area,
      });
      setDetailReservation(null);
    } else {
      alert(result.error || 'Không thể vào bãi.');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-[26px] border border-white/40 bg-[#1f67db] shadow-[0_18px_48px_rgba(31,103,219,0.18)]">
        <img
          src={parkingHeroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(20,96,218,0.96)_0%,rgba(31,103,219,0.94)_55%,rgba(53,126,232,0.9)_100%)]" />
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-24 h-44 w-44 rounded-full bg-sky-200/10 blur-3xl" />

        <div className="relative px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
          <div className="max-w-4xl">
            <h1 className="max-w-3xl text-[34px] font-black tracking-tight text-white sm:text-[42px] sm:leading-[1.08]">
              Chào mừng, {currentUser.fullName}!
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/84 sm:text-[16px]">
              Theo dõi và quản lý phương tiện của bạn một cách thông minh. Tiết kiệm thời gian và tận hưởng sự tiện lợi.
            </p>

            <div className="mt-8 max-w-[700px] rounded-[22px] border border-white/20 bg-white/12 p-4 shadow-[0_12px_24px_rgba(7,35,92,0.12)] backdrop-blur-sm sm:p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-white shadow-inner">
                  <ParkingSquare className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    TRẠNG THÁI HIỆN TẠI
                  </p>
                  <p className="mt-2 text-[20px] font-bold leading-8 text-white sm:text-[25px]">
                    {heroStatusText}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-6 text-white/78">
                    {heroStatusDetail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-6 xl:max-w-[400px]">
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,42,81,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f67db]/10 text-[#1f67db]">
                <span className="text-[18px] font-extrabold leading-none">P</span>
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Số chỗ trống</h2>
            </div>

            <div className="mt-6 rounded-[18px] bg-[#f3f7ff] px-5 py-6 text-center">
              <div className="flex items-end justify-center gap-2">
                <span className="text-[62px] font-black leading-none text-[#1f67db]">
                  {availableSlotCount}
                </span>
                <span className="pb-2 text-[26px] font-semibold leading-none text-slate-700">
                  / {slots.length}
                </span>
              </div>
              <p className="mt-3 text-[14px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                Chỗ trống hiện tại
              </p>

              <div className="mt-7 h-2 rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-[#1f67db]"
                  style={{ width: `${Math.max(6, availableSlotCount > 0 ? (availableSlotCount / Math.max(1, slots.length)) * 100 : 6)}%` }}
                />
              </div>
            </div>

            <p className="mt-5 text-center text-[14px] italic text-slate-500">
              * Dữ liệu được cập nhật theo thời gian thực
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Đang chiếm" value={slots.length - availableSlotCount} tone="blue" />
              <MiniMetric label="Tỉ lệ lấp đầy" value={`${occupancyRate}%`} tone="slate" />
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,42,81,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f67db]/10 text-[#1f67db]">
                <UserCircle2 className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Thông tin cá nhân</h2>
            </div>

            <div className="mt-6 rounded-[18px] border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1f67db]">
                  <CarFront className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-slate-500">Biển số xe</p>
                  <p className="mt-1 text-[30px] font-black tracking-tight text-slate-950">
                    {defaultVehicle?.licensePlate ?? 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Loại xe" value={vehicleLabel(defaultVehicle?.vehicleType ?? 'car')} />
              <InfoCard label="Dòng xe" value={defaultVehicle ? `${defaultVehicle.brand} ${defaultVehicle.model}` : 'Chưa cập nhật'} />
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,42,81,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f67db]/10 text-[#1f67db]">
                <History className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Lịch sử đỗ xe</h2>
            </div>
            <button
              type="button"
              onClick={() => setView('slots')}
              className="self-start text-[14px] font-medium text-[#1f67db] transition hover:text-[#0f57cb]"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid gap-3 border-b border-slate-100 px-6 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-7">
            <FilterField label="Trạng thái">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Pending">Đang chờ</option>
                <option value="Checked-in">Đã vào bãi</option>
                <option value="Completed">Hoàn tất</option>
                <option value="Expired">Hết hạn</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </FilterField>

            <FilterField label="Loại xe">
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="car">Ô tô</option>
                <option value="motorbike">Xe máy</option>
                <option value="bicycle">Xe đạp</option>
                <option value="electric vehicle">Xe điện</option>
              </select>
            </FilterField>

            <div className="sm:col-span-2">
              <FilterField label="Tìm kiếm">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Mã đặt chỗ, biển số, khu vực"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                />
              </FilterField>
            </div>
          </div>

          <div className="grid gap-3 px-6 py-4 xl:hidden sm:px-7">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((reservation) => {
                const statusMeta = getReservationStatusMeta(reservation.status);
                return (
                  <article
                    key={reservation.id}
                    onClick={() => setDetailReservation(reservation)}
                    className="cursor-pointer rounded-[18px] border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-slate-950">
                          {reservation.status === 'Pending' ? 'Đang chờ xác nhận' : formatDateTimeLine(reservation.date, reservation.startTime)}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-500">
                          {trimAreaName(reservation.area)} • {reservation.floor}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <CompactInfo label="Thời lượng" value={durationLabel(reservation)} />
                      <CompactInfo label="Chi phí" value={formatMoney(estimateReservationCost(reservation))} accent />
                      <CompactInfo label="Biển số" value={reservation.licensePlate} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="px-1 py-10 text-center">
                <p className="text-[15px] text-slate-500">Chưa có lịch sử phù hợp.</p>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto px-6 py-2 xl:block sm:px-7">
            {filteredReservations.length > 0 ? (
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[16px] font-medium text-slate-700">
                    <th className="pb-5 pr-6 font-medium">Thời gian</th>
                    <th className="pb-5 pr-6 font-medium">Vị trí</th>
                    <th className="pb-5 pr-6 font-medium">Thời lượng</th>
                    <th className="pb-5 pr-6 font-medium">Chi phí</th>
                    <th className="pb-5 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => {
                    const statusMeta = getReservationStatusMeta(reservation.status);
                    return (
                      <tr
                        key={reservation.id}
                        onClick={() => setDetailReservation(reservation)}
                        className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="border-t border-slate-100 py-5 pr-6 align-top">
                          <div className="text-[16px] font-semibold text-slate-950">
                            {reservation.status === 'Pending' ? 'Đang chờ' : formatDateTimeLine(reservation.date, reservation.startTime)}
                          </div>
                          <div className="mt-1 text-[14px] text-slate-500">
                            {reservation.date ? formatDate(reservation.date) : ''}
                          </div>
                        </td>
                        <td className="border-t border-slate-100 py-5 pr-6 align-top">
                          <div className="text-[16px] text-slate-900">{trimAreaName(reservation.area)}</div>
                          <div className="mt-1 text-[14px] text-slate-500">
                            {reservation.floor}
                          </div>
                        </td>
                        <td className="border-t border-slate-100 py-5 pr-6 align-top">
                          <div className="text-[16px] text-slate-900">{durationLabel(reservation)}</div>
                        </td>
                        <td className="border-t border-slate-100 py-5 pr-6 align-top">
                          <div className="text-[22px] font-semibold tracking-tight text-[#1f67db]">
                            {formatMoney(estimateReservationCost(reservation))}
                          </div>
                        </td>
                        <td className="border-t border-slate-100 py-5 align-top">
                          <span className={`inline-flex rounded-full px-4 py-1.5 text-[14px] font-medium ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-1 py-10 text-center">
                <p className="text-[15px] text-slate-500">Chưa có lịch sử đỗ xe phù hợp.</p>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-2 sm:px-7">
            <div className="rounded-[24px] border border-blue-100 bg-[#e7f0ff] px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#cfe0ff] text-[#1f67db]">
                    <Gift className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-[28px] font-bold tracking-tight text-[#1f67db]">
                      Ưu đãi thành viên
                    </h3>
                    <p className="mt-1 max-w-2xl text-[16px] leading-7 text-slate-600">
                      Nạp thêm 500.000đ để nhận ngay voucher giảm 20% phí đỗ xe tháng tới.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setView('payments')}
                  className="inline-flex min-w-[150px] items-center justify-center self-start rounded-[16px] bg-[#1260cc] px-7 py-4 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(18,96,204,0.24)] transition hover:bg-[#0f57bb] xl:self-auto"
                >
                  <span className="block text-center">
                    Nạp
                    <br />
                    ngay
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={cancelConfirmId !== null}
        title="Hủy đặt chỗ"
        message="Bạn có chắc muốn hủy chỗ đặt này? Ô đỗ đã giữ trước sẽ được trả lại cho hệ thống ngay lập tức."
        onConfirm={() => {
          if (cancelConfirmId) {
            onCancelReservation(cancelConfirmId);
            setCancelConfirmId(null);
          }
        }}
        onCancel={() => setCancelConfirmId(null)}
      />

      {detailReservation && (
        <ReservationDetailModal
          reservation={detailReservation}
          onClose={() => setDetailReservation(null)}
          onCancel={() => handleCancelClick(detailReservation)}
          onCheckIn={() => handleSimulateCheckIn(detailReservation)}
          onExpire={() => onExpireReservation(detailReservation.id)}
          onOpenSession={() => setView('session')}
        />
      )}

      {checkInSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Check-in thành công</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Mã vé gửi xe của bạn là <span className="font-mono font-bold text-blue-600">{checkInSuccessData.ticketCode}</span>.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs">
              <DetailRow label="Tầng" value={checkInSuccessData.floor} />
              <DetailRow label="Khu vực" value={trimAreaName(checkInSuccessData.area)} />
              <DetailRow label="Ô đỗ" value={checkInSuccessData.slotCode} tone="blue" />
            </div>

            <p className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-[11px] font-bold text-amber-600">
              Vui lòng di chuyển ngay đến ô {checkInSuccessData.slotCode}.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCheckInSuccessData(null)}
                className="w-1/2 cursor-pointer rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setCheckInSuccessData(null);
                  setView('session');
                }}
                className="w-1/2 cursor-pointer rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
              >
                Xem lượt gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTimeLine(date: string, time: string) {
  return `${formatDate(date)} • ${time}`;
}

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

function trimAreaName(value: string) {
  return value.split(' - ')[1] || value;
}

function durationLabel(reservation: Reservation) {
  if (!reservation.endTime) return '01:00:00';
  const startMinutes = toMinutes(reservation.startTime);
  const endMinutes = toMinutes(reservation.endTime);
  const diff = Math.max(30, endMinutes - startMinutes);
  return toDuration(diff);
}

function estimateReservationCost(reservation: Reservation) {
  const durationMinutes = reservation.endTime ? Math.max(30, toMinutes(reservation.endTime) - toMinutes(reservation.startTime)) : 60;
  const durationHours = Math.max(1, Math.ceil(durationMinutes / 60));
  const rateMap: Record<string, number> = {
    car: 15000,
    motorbike: 8000,
    bicycle: 5000,
    'electric vehicle': 12000,
  };
  const baseRate = rateMap[reservation.vehicleType] ?? 10000;
  return durationHours * baseRate;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function toDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function vehicleLabel(value: string) {
  switch (value) {
    case 'car':
      return 'Ô tô';
    case 'motorbike':
      return 'Xe máy';
    case 'bicycle':
      return 'Xe đạp';
    case 'electric vehicle':
      return 'Xe điện';
    default:
      return value;
  }
}

function getReservationStatusMeta(status: Reservation['status']) {
  switch (status) {
    case 'Confirmed':
      return { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700' };
    case 'Pending':
      return { label: 'Đang chờ', className: 'bg-amber-50 text-amber-700' };
    case 'Cancelled':
      return { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700' };
    case 'Completed':
      return { label: 'Hoàn tất', className: 'bg-slate-100 text-slate-700' };
    case 'Checked-in':
      return { label: 'Đã vào bãi', className: 'bg-blue-50 text-blue-700' };
    case 'Expired':
      return { label: 'Hết hạn', className: 'bg-slate-100 text-slate-600' };
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700' };
  }
}

function statusMessage(status: Reservation['status']) {
  switch (status) {
    case 'Cancelled':
      return 'Đặt chỗ đã bị hủy.';
    case 'Expired':
      return 'Đặt chỗ đã hết hạn.';
    case 'Checked-in':
      return 'Đặt chỗ đã được ghi nhận vào bãi trước đó.';
    case 'Completed':
      return 'Đặt chỗ đã hoàn tất.';
    default:
      return `Trạng thái đặt chỗ hiện tại là ${status}.`;
  }
}

function MiniMetric({ label, value, tone }: { label: string; value: React.ReactNode; tone: 'blue' | 'slate' }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${tone === 'blue' ? 'border-blue-100 bg-blue-50/70' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-[26px] font-black ${tone === 'blue' ? 'text-[#1f67db]' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function CompactInfo({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1 text-[14px] font-semibold ${accent ? 'text-[#1f67db]' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-1 text-[18px] font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'blue' | 'amber' | 'rose' }) {
  return (
    <div className={`flex justify-between border-b border-slate-100 pb-1.5 ${tone === 'blue' ? 'text-blue-600' : tone === 'amber' ? 'text-amber-600' : tone === 'rose' ? 'text-rose-600' : ''}`}>
      <span className="text-slate-400">{label}:</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

function ReservationDetailModal({
  reservation,
  onClose,
  onCancel,
  onCheckIn,
  onExpire,
  onOpenSession,
}: {
  reservation: Reservation;
  onClose: () => void;
  onCancel: () => void;
  onCheckIn: () => void;
  onExpire: () => void;
  onOpenSession: () => void;
}) {
  const statusMeta = getReservationStatusMeta(reservation.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-100 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f67db]">Chi tiết đặt chỗ</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">{reservation.reservationCode}</h3>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow label="Ngày đặt" value={formatDate(reservation.date)} />
          <DetailRow label="Khung giờ" value={`${reservation.startTime}${reservation.endTime ? ` - ${reservation.endTime}` : ''}`} />
          <DetailRow label="Tầng / khu" value={`${reservation.floor} • ${trimAreaName(reservation.area)}`} />
          <DetailRow label="Loại xe" value={vehicleLabel(reservation.vehicleType)} />
          <DetailRow label="Biển số" value={reservation.licensePlate} />
          <DetailRow label="Ô được gán" value={reservation.slotCode || 'Sẽ được gán tự động'} />
        </div>

        {reservation.note && (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-900">Ghi chú: </span>
            {reservation.note}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {reservation.status === 'Confirmed' && (
            <>
              <ActionButton tone="blue" onClick={onCheckIn}>Check-in</ActionButton>
              <ActionButton tone="rose" onClick={onCancel}>Hủy đặt chỗ</ActionButton>
              <ActionButton tone="slate" onClick={onExpire}>Đánh dấu hết hạn</ActionButton>
            </>
          )}
          {reservation.status === 'Pending' && (
            <ActionButton tone="rose" onClick={onCancel}>Hủy đặt chỗ</ActionButton>
          )}
          {reservation.status === 'Checked-in' && (
            <ActionButton tone="blue" onClick={onOpenSession}>Xem lượt gửi hiện tại</ActionButton>
          )}
        </div>

        <button onClick={onClose} className="w-full cursor-pointer rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800">
          Đóng
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  children,
  tone = 'slate',
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'slate' | 'rose' | 'blue';
}) {
  const style =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
      : tone === 'blue'
      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${style}`}
    >
      {children}
    </button>
  );
}
