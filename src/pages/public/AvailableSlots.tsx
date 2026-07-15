import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bike, CalendarDays, Car, Clock3, Info, MapPin, Moon, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { Reservation, SavedVehicle, Slot, SystemConfig, User, VehicleKey } from '../../data/mockData';
import parkingSecurityImage from '../../assets/images/an ninh.jpg';

interface Props {
  setView: (view: string) => void;
  slots: Slot[];
  isLoggedIn: boolean;
  currentUser: User | null;
  savedVehicles: SavedVehicle[];
  systemConfig: SystemConfig;
  onAddReservation: (res: any) => Reservation | null;
  reservations: Reservation[];
}

type PackageKey = 'hour' | 'overnight' | 'month';

const pricingRows = [
  { key: 'motorbike', icon: Bike, title: 'Xe máy', subtitle: 'Mô tô, xe tay ga', price: '5.000đ', unit: '/lượt' },
  { key: 'car', icon: Car, title: 'Ô tô 4-7 chỗ', subtitle: 'Sedan, SUV nhỏ', price: '30.000đ', unit: '/giờ' },
  { key: 'truck', icon: Truck, title: 'Ô tô trên 7 chỗ', subtitle: 'Xe khách, xe du lịch', price: '50.000đ', unit: '/giờ' },
];

export default function AvailableSlots({
  setView,
  slots,
  isLoggedIn,
  currentUser,
  savedVehicles,
  onAddReservation,
}: Props) {
  const availableCount = slots.filter((slot) => slot.status === 'Available').length;
  const displayAvailable = Math.max(15, availableCount);
  const totalCount = 1000;
  const fillPercent = Math.max(0, Math.min(100, ((totalCount - displayAvailable) / totalCount) * 100));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName ?? 'Nguyễn Văn A');
  const [phone, setPhone] = useState(currentUser?.phone ?? '090 123 4567');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleKey>('car');
  const [packageKey, setPackageKey] = useState<PackageKey>('hour');
  const [note, setNote] = useState('');

  useEffect(() => {
    const defaultVehicle = savedVehicles.find((vehicle) => vehicle.isDefault) ?? savedVehicles[0];
    if (defaultVehicle) {
      setVehicleType(defaultVehicle.vehicleType);
      setLicensePlate(defaultVehicle.licensePlate);
    } else if (currentUser?.role === 'Parking User / Driver') {
      setLicensePlate('51A-123.45');
    }
  }, [savedVehicles, currentUser]);

  const matchedSlot = useMemo(() => {
    const order: VehicleKey[] = [vehicleType, 'car', 'motorbike', 'electric vehicle', 'bicycle'];
    for (const type of order) {
      const slot = slots.find((item) => item.status === 'Available' && item.vehicleType === type);
      if (slot) return slot;
    }
    return slots.find((item) => item.status === 'Available') ?? null;
  }, [slots, vehicleType]);

  const reservationMeta = useMemo(() => {
    if (packageKey === 'overnight') {
      return { reservationType: 'Fixed-time' as const, startTime: '18:00', endTime: '23:30', label: 'Qua đêm' };
    }
    if (packageKey === 'month') {
      return { reservationType: 'Flexible' as const, startTime: '09:00', endTime: undefined, label: 'Theo tháng' };
    }
    return { reservationType: 'Fixed-time' as const, startTime: '09:00', endTime: '11:00', label: 'Gửi theo lượt' };
  }, [packageKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để đặt chỗ.');
      setView('login');
      return;
    }

    if (!matchedSlot) {
      alert('Hiện không còn chỗ phù hợp trong khu vực đã chọn.');
      return;
    }

    const created = onAddReservation({
      reservationType: reservationMeta.reservationType,
      slotAssignmentMode: 'Auto',
      vehicleType,
      licensePlate: licensePlate.trim(),
      date: new Date().toISOString().split('T')[0],
      startTime: reservationMeta.startTime,
      endTime: reservationMeta.endTime,
      floor: matchedSlot.floorName,
      area: matchedSlot.areaName,
      slotCode: matchedSlot.slotCode,
      note: note.trim() || reservationMeta.label,
    });

    if (created) {
      alert(`Đặt chỗ thành công. Mã đặt chỗ: ${created.reservationCode}`);
      setView('reservations');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 450);
  };

  return (
    <div className="public-page text-slate-900">
      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="public-surface rounded-[20px] border px-6 py-7 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="public-heading text-3xl font-semibold tracking-tight sm:text-[34px]">Trạng thái bãi đỗ</h1>
              <p className="public-copy mt-3 text-[15px] leading-7">
                Kiểm tra khả năng cung cấp chỗ đỗ theo thời gian thực tại các chi nhánh ParkFlow.
              </p>
            </div>

            <div className="flex items-start gap-3 text-right lg:pt-2">
              <div className="public-soft-accent flex h-11 w-11 items-center justify-center rounded-xl text-[20px] font-bold text-blue-700">P</div>
              <div>
                <div className="text-[18px] font-semibold text-blue-700 sm:text-[20px]">{displayAvailable} chỗ trống</div>
                <div className="public-copy mt-1 text-[14px]">/ {totalCount.toLocaleString()} tổng số chỗ đỗ</div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="public-copy mb-2 flex items-center justify-between text-[13px]">
              <span>Mức độ lấp đầy: {fillPercent.toFixed(1)}%</span>
              <button type="button" onClick={handleRefresh} className="inline-flex items-center gap-1 text-blue-600">
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
            <div className="h-4 rounded-full bg-slate-100 p-1">
              <div className="h-full rounded-full bg-[#0f63d8]" style={{ width: `${fillPercent}%` }} />
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: RefreshCw, title: 'Cập nhật lúc', value: '14:35, hôm nay' },
                { icon: MapPin, title: 'Vị trí', value: 'Quận 1, TP. Hồ Chí Minh' },
                { icon: ShieldCheck, title: 'An ninh', value: 'Giám sát AI 24/7' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="public-card-muted flex items-center gap-4 rounded-2xl border px-4 py-4">
                    <div className="public-soft-accent flex h-12 w-12 items-center justify-center rounded-xl text-blue-700">
                      <Icon className={`h-5 w-5 ${item.title === 'Cập nhật lúc' && isRefreshing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900">{item.title}</div>
                      <div className="public-copy text-[14px]">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="public-surface rounded-[20px] border p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-8">
            <h2 className="public-heading text-[24px] font-semibold tracking-tight">Thông tin đặt chỗ</h2>
            {!isLoggedIn && (
              <div className="public-info-box mt-4 rounded-2xl border px-4 py-3 text-[14px] leading-6 text-slate-700">
                Bạn đang xem ở chế độ khách. Hãy đăng nhập để xác nhận đặt chỗ và lưu thông tin vào tài khoản.
              </div>
            )}

            <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Họ và tên">
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="public-input h-12 w-full rounded-xl border px-4 text-[15px] outline-none transition focus:border-blue-600" />
                </Field>
                <Field label="Số điện thoại">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="public-input h-12 w-full rounded-xl border px-4 text-[15px] outline-none transition focus:border-blue-600" />
                </Field>
                <Field label="Biển số xe">
                  <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="public-input h-12 w-full rounded-xl border px-4 text-[15px] outline-none transition focus:border-blue-600" />
                </Field>
                <Field label="Loại phương tiện">
                  <div className="relative">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleKey)}
                      className="public-input h-12 w-full appearance-none rounded-xl border px-4 pr-10 text-[15px] outline-none transition focus:border-blue-600"
                    >
                      <option value="motorbike">Xe máy</option>
                      <option value="car">Ô tô</option>
                      <option value="electric vehicle">Xe điện</option>
                      <option value="bicycle">Xe đạp</option>
                    </select>
                    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </Field>
              </div>

              <div>
                <span className="mb-3 block text-[14px] font-medium text-slate-900">Thời gian gửi dự kiến</span>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'hour' as const, icon: Clock3, title: 'Gửi theo lượt', subtitle: 'Phù hợp dừng ngắn' },
                    { key: 'overnight' as const, icon: Moon, title: 'Qua đêm', subtitle: 'Lưu xe dài hơn' },
                    { key: 'month' as const, icon: CalendarDays, title: 'Theo tháng', subtitle: 'Giữ chỗ dài hạn' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = packageKey === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPackageKey(item.key)}
                        className={`flex h-[92px] items-center justify-center rounded-2xl border px-4 text-center transition ${active ? 'border-blue-600 bg-blue-50 text-slate-950' : 'public-surface text-slate-700 hover:border-slate-400'}`}
                      >
                        <div>
                          <div className="public-soft-accent mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-700 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-[14px] font-medium">{item.title}</div>
                          <div className="public-copy mt-1 text-[12px]">{item.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Ghi chú">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Ví dụ: cần chỗ gần thang máy, gửi qua đêm..."
                  className="public-input w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition focus:border-blue-600"
                />
              </Field>

              <button
                type={isLoggedIn ? 'submit' : 'button'}
                onClick={() => {
                  if (!isLoggedIn) setView('login');
                }}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#0f63d8] text-[15px] font-semibold text-white shadow-[0_10px_22px_rgba(15,99,216,0.22)] transition hover:bg-[#0d56bc]"
              >
                {isLoggedIn ? 'Xác nhận đặt chỗ' : 'Đăng nhập để đặt chỗ'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="public-surface rounded-[20px] border p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-8">
              <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-blue-700">Tham khảo giá</p>
              <div className="mt-5 space-y-4">
                {pricingRows.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="public-card-muted flex items-center justify-between rounded-2xl border px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="public-soft-accent flex h-11 w-11 items-center justify-center rounded-full text-blue-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[13px] text-slate-500">{item.subtitle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[18px] font-semibold text-blue-700">{item.price}</div>
                        <div className="text-[13px] text-slate-500">{item.unit}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="public-info-box mt-5 rounded-2xl border p-4 text-[14px] leading-7 text-slate-600">
                <div className="mb-2 flex items-center gap-2 text-blue-700">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Lưu ý</span>
                </div>
                Giá vé có thể thay đổi tùy theo khung giờ cao điểm và ngày lễ. Quý khách vui lòng kiểm tra kỹ trước khi thanh toán.
              </div>
            </div>

            <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[16/9]">
                <img src={parkingSecurityImage} alt="ParkFlow AI parking" className="absolute inset-0 h-full w-full object-cover opacity-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-[24px] font-semibold tracking-tight">An tâm tuyệt đối với ParkFlow AI</h3>
                  <p className="mt-1 text-[13px] text-white/85">Hệ thống nhận diện biển số tự động chính xác 99.9%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-medium text-slate-900">{label}</span>
      {children}
    </label>
  );
}
