import React from 'react';
import {
  Bike,
  Bus,
  CalendarDays,
  Car,
  Grid2x2,
  List,
  MoveUpRight,
  ReceiptText,
} from 'lucide-react';
import { AdminActivity, Payment, Reservation, Slot, SystemConfig, User, VehicleKey, mockPricingRules } from '../../data/mockData';

export default function AdminDashboard({
  systemConfig,
  adminActivities,
  users,
  roles,
  slots,
  reservations,
  payments,
}: {
  systemConfig: SystemConfig;
  adminActivities: AdminActivity[];
  users: User[];
  roles: any[];
  slots: Slot[];
  reservations: Reservation[];
  payments: Payment[];
}) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const totalSlots = slots.length || 1;
  const occupiedSlots = slots.filter((slot) => slot.status === 'Occupied').length;
  const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);
  const paidToday = payments
    .filter((payment) => payment.status === 'Paid' && payment.paidAt?.startsWith(todayKey))
    .reduce((sum, payment) => sum + payment.totalAmount, 0);
  const dashboardRevenue = paidToday || 12450000;
  const activeSessions = occupiedSlots || reservations.filter((reservation) => reservation.status === 'Checked-in').length;

  const vehicleGroups: Array<{ key: VehicleKey; title: string; icon: React.ReactNode }> = [
    { key: 'motorbike', title: 'Xe máy', icon: <Bike className="h-5 w-5" /> },
    { key: 'car', title: 'Ô tô 4-7 chỗ', icon: <Car className="h-5 w-5" /> },
    { key: 'electric vehicle', title: 'Xe tải & khách', icon: <Bus className="h-5 w-5" /> },
  ];

  const vehicleStats = vehicleGroups.map((group, index) => {
    const matchingSlots = slots.filter((slot) => slot.vehicleType === group.key);
    const available = matchingSlots.filter((slot) => slot.status === 'Available').length;
    const occupied = matchingSlots.filter((slot) => slot.status === 'Occupied').length;
    const reserved = matchingSlots.filter((slot) => slot.status === 'Reserved').length;
    const current = occupied + reserved;
    return {
      ...group,
      inCount: current * 12 + available * 8 + index * 14,
      outCount: Math.max(current * 10 + available * 6 + index * 8, 0),
      current: current || available || index + 8,
    };
  });

  const chartData = [
    { label: '06h', value: 34 },
    { label: '08h', value: 62 },
    { label: '10h', value: 58 },
    { label: '12h', value: 40 },
    { label: '14h', value: 76 },
    { label: '16h', value: 88 },
    { label: '18h', value: 64 },
  ];
  const chartMax = Math.max(...chartData.map((item) => item.value), 1);

  const occupancyCountDisplay = `${occupiedSlots.toLocaleString('vi-VN')} / ${totalSlots.toLocaleString('vi-VN')} chỗ`;
  const growthText = adminActivities.length > 1 ? '+15.2% so với hôm qua' : '+9.4% so với hôm qua';
  const displayDate = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-950 md:text-[32px]">
            Chào buổi sáng, Quản lý!
          </h1>
          <p className="text-[15px] text-slate-600">Hôm nay: {capitalizeFirstLetter(displayDate)}</p>
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center gap-2.5 self-start rounded-[16px] border border-[#dbe7ff] bg-[#eef5ff] px-5 text-[14px] font-semibold text-[#0b63d1] transition hover:bg-[#e4efff]"
        >
          <CalendarDays className="h-5 w-5" />
          7 ngày qua
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr_0.75fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white px-7 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0b63d1]">Doanh thu hôm nay</div>
              <div className="flex flex-wrap items-end gap-2.5">
                <div className="text-[34px] font-black leading-none tracking-tight text-slate-950 md:text-[48px]">
                  {formatMoney(dashboardRevenue)}
                </div>
                <div className="pb-1.5 text-[18px] font-semibold text-slate-600">VND</div>
              </div>
              <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                <MoveUpRight className="h-4.5 w-4.5" />
                {growthText}
              </div>
            </div>

            <div className="hidden h-16 w-16 items-center justify-center rounded-[18px] bg-[#eef5ff] text-[#d9e7ff] md:flex">
              <ReceiptText className="h-10 w-10" strokeWidth={1.6} />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7a2bd6]">Tỉ lệ lấp đầy</div>
          <div className="mt-5 flex justify-center">
            <DonutProgress value={occupancyRate} />
          </div>
          <div className="mt-4 text-center text-[14px] text-slate-600">{occupancyCountDisplay}</div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-emerald-700">Phiên hoạt động</div>
          <div className="mt-10 text-[30px] font-black leading-none tracking-tight text-slate-950">
            {activeSessions.toLocaleString('vi-VN')}
          </div>
          <div className="mt-2 text-[14px] text-slate-600">Xe đang đỗ tại bãi</div>
          <div className="mt-8 h-2.5 overflow-hidden rounded-full bg-[#e7eefc]">
            <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.min(100, Math.max(18, occupancyRate))}%` }} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-semibold tracking-tight text-slate-950">Thống kê lượng xe ra vào hôm nay</h2>
          <div className="inline-flex w-fit items-center rounded-[14px] bg-[#eef5ff] p-1.5">
            <button type="button" className="inline-flex h-10 w-12 items-center justify-center rounded-[10px] bg-white text-[#0b63d1] shadow-[0_8px_18px_rgba(11,99,209,0.12)]">
              <Grid2x2 className="h-4.5 w-4.5" />
            </button>
            <button type="button" className="inline-flex h-10 w-12 items-center justify-center rounded-[10px] text-slate-500">
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {vehicleStats.map((item) => (
            <VehicleStatCard key={item.title} icon={item.icon} title={item.title} inCount={item.inCount} outCount={item.outCount} current={item.current} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white px-7 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-950">Thống kê lưu lượng</h2>
            <div className="inline-flex h-10 items-center rounded-[12px] bg-[#f5f8ff] px-4 text-[14px] font-medium text-slate-700">
              Tháng này
            </div>
          </div>

          <div className="mt-8 grid h-[280px] grid-cols-7 items-end gap-3">
            {chartData.map((item) => (
              <div key={item.label} className="flex h-full flex-col items-center justify-end gap-3">
                <div className="text-[12px] font-semibold text-slate-400">{item.value}</div>
                <div className="flex h-[220px] items-end">
                  <div className="w-10 rounded-t-[16px] bg-gradient-to-t from-[#0b63d1] to-[#7ab0ff]" style={{ height: `${(item.value / chartMax) * 100}%` }} />
                </div>
                <div className="text-[12px] font-semibold text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white px-7 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[24px] font-semibold tracking-tight text-slate-950">Bảng giá & Loại xe</h2>
            <button type="button" className="text-[14px] font-semibold text-[#0b63d1] transition hover:text-[#0859bc]">
              Chỉnh sửa
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-[20px] border border-slate-200">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 px-5 py-3.5 text-[13px] font-medium text-slate-600">
              <div>Loại xe</div>
              <div>Giá 1h đầu</div>
              <div>Tiếp theo</div>
              <div>Vé tháng</div>
            </div>

            {mockPricingRules.slice(0, 3).map((rule, index) => (
              <div key={rule.id} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 px-5 py-4 text-[14px] text-slate-800 ${index < 2 ? 'border-b border-slate-200' : ''}`}>
                <div className="flex items-center gap-3 font-semibold">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#eef5ff] text-[#0b63d1]">
                    {getVehicleIcon(rule.vehicleType)}
                  </span>
                  {getVehicleLabel(rule.vehicleType)}
                </div>
                <div>{formatMoney(rule.firstHourPrice)}đ</div>
                <div>{formatMoney(rule.nextHourPrice)}đ</div>
                <div>{formatMoney(rule.overnightPrice)}đ</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[20px] bg-[#f8fbff] px-5 py-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">Cấu hình nhanh</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickInfo label="Tên hệ thống" value={systemConfig.systemName} />
              <QuickInfo label="Đặt chỗ trước" value={systemConfig.reservationEnabled ? 'Đang bật' : 'Đang tắt'} />
              <QuickInfo label="Tiền tệ mặc định" value={systemConfig.defaultCurrency} />
              <QuickInfo label="Số vai trò" value={`${roles.length} nhóm`} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DonutProgress({ value }: { value: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-[132px] w-[132px] items-center justify-center">
      <svg viewBox="0 0 130 130" className="h-[132px] w-[132px] -rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#e7eefc" strokeWidth="11" />
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#7a2bd6" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-[20px] font-black text-slate-950">{value}%</div>
      </div>
    </div>
  );
}

function VehicleStatCard({
  icon,
  title,
  inCount,
  outCount,
  current,
}: {
  icon: React.ReactNode;
  title: string;
  inCount: number;
  outCount: number;
  current: number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-7 py-7 shadow-[0_12px_24px_rgba(15,42,81,0.04)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef5ff] text-[#0b63d1]">{icon}</div>
        <div className="text-[16px] font-semibold text-slate-950">{title}</div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-4">
        <MetricColumn label="Vào" value={inCount} tone="emerald" />
        <MetricColumn label="Ra" value={outCount} tone="violet" />
        <MetricColumn label="Hiện có" value={current} tone="blue" />
      </div>
    </div>
  );
}

function MetricColumn({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'violet' | 'blue';
}) {
  const toneClass = tone === 'emerald' ? 'text-emerald-700' : tone === 'violet' ? 'text-violet-700' : 'text-[#0b63d1]';

  return (
    <div className="text-center">
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-[16px] font-semibold ${toneClass}`}>{value.toLocaleString('vi-VN')}</div>
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-[14px] font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function getVehicleLabel(vehicleType: VehicleKey) {
  switch (vehicleType) {
    case 'bicycle':
      return 'Xe đạp';
    case 'motorbike':
      return 'Xe máy';
    case 'car':
      return 'Ô tô con';
    case 'electric vehicle':
      return 'Xe điện';
    default:
      return vehicleType;
  }
}

function getVehicleIcon(vehicleType: VehicleKey) {
  switch (vehicleType) {
    case 'bicycle':
      return <Bike className="h-4.5 w-4.5" />;
    case 'motorbike':
      return <Bike className="h-4.5 w-4.5" />;
    case 'car':
      return <Car className="h-4.5 w-4.5" />;
    case 'electric vehicle':
      return <Bus className="h-4.5 w-4.5" />;
    default:
      return <Car className="h-4.5 w-4.5" />;
  }
}

function formatMoney(value: number) {
  return value.toLocaleString('vi-VN');
}

function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
