import React from 'react';
import { Ticket, CalendarClock, Receipt, Car, ChevronRight } from 'lucide-react';
import { User, ParkingSession, Reservation, Feedback, SavedVehicle } from '../../data/mockData';
// import StatCard from '../../components/StatCard';
// import StatusBadge from '../../components/StatusBadge';
// import EmptyState from '../../components/EmptyState';

export default function MyParking({ user, setView, currentSession, upcomingRes, unpaidTotal, feedbacks, savedVehicles }: {
  user: User;
  setView: (view: string) => void;
  currentSession: ParkingSession;
  upcomingRes?: Reservation;
  unpaidTotal: number;
  feedbacks: Feedback[];
  savedVehicles: SavedVehicle[];
}) {
  const activeFeedback = feedbacks.find(f => f.status !== 'Resolved');
  const defaultVeh = savedVehicles.find(v => v.isDefault);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Chào mừng quay lại, {user?.fullName || 'bạn'}!</h3>
          <p className="text-xs text-blue-200 max-w-xl">
            Đặt chỗ, thanh toán hóa đơn, theo dõi lượt gửi hiện tại và gửi phản hồi hỗ trợ đều nằm ở đây.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setView('reservations')}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-900 hover:bg-blue-50 transition"
          >
            Đặt chỗ gửi xe
          </button>
        </div>
      </section>

      {/* <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Lượt gửi đang hoạt động" value={currentSession.sessionStatus === 'Active' ? currentSession.ticketCode : 'Không có'} helper={currentSession.sessionStatus === 'Active' ? `Ô ${currentSession.slotCode}` : 'Chưa có lượt gửi nào'} icon={Ticket} accentClass="text-sky-600" bgIconClass="bg-sky-50" />
        <StatCard title="Chỗ đặt sắp tới" value={upcomingRes ? upcomingRes.reservationCode : 'Không có'} helper={upcomingRes ? `${upcomingRes.date} @ ${upcomingRes.startTime}` : 'Chưa có chỗ đặt nào'} icon={CalendarClock} accentClass="text-amber-600" bgIconClass="bg-amber-50" />
        <StatCard title="Số dư chưa thanh toán" value={`${unpaidTotal.toLocaleString()} VND`} helper="Các khoản cần thanh toán" icon={Receipt} accentClass="text-rose-600" bgIconClass="bg-rose-50" />
        <StatCard title="Xe mặc định" value={defaultVeh ? defaultVeh.licensePlate : 'Không có'} helper={defaultVeh ? `${defaultVeh.brand} ${defaultVeh.model}` : 'Chưa có biển số mặc định'} icon={Car} accentClass="text-indigo-600" bgIconClass="bg-indigo-50" />
      </section> */}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Thông tin lượt gửi hiện tại</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Thông tin xe vào bãi được nhân viên hoặc hệ thống phát hành.</p>
            </div>
            {/* <StatusBadge status={currentSession.sessionStatus} /> */}
          </div>

          {/* {currentSession.sessionStatus === 'Active' ? (
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase">Biển số xe</span>
                  <span className="font-bold text-slate-800">{currentSession.licensePlate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase">Loại xe</span>
                  <span className="font-bold text-slate-800 uppercase">{currentSession.vehicleType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase">Giờ vào</span>
                  <span className="font-bold text-slate-800">{currentSession.checkInTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase">Vị trí đỗ</span>
                  <span className="font-bold text-slate-800">{currentSession.floor} â€¢ {currentSession.area} â€¢ <span className="text-blue-600">{currentSession.slotCode}</span></span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold text-[9px] uppercase">Phí tạm tính</span>
                  <span className="font-bold text-rose-600">{currentSession.estimatedFee.toLocaleString()} VND</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setView('session')} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  Xem chi tiết vé gửi
                </button>
              </div>
            </div>
          ) : (
            <EmptyState icon={Car} title="Chưa có lượt gửi nào đang hoạt động" description="Thông tin vào bãi sẽ xuất hiện tự động khi xe được ghi nhận tại cổng." />
          )} */}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Lối tắt nhanh</h4>
            <div className="grid gap-2 text-xs font-bold">
              <button onClick={() => setView('session')} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-slate-700 hover:bg-slate-50">
                <span>Lượt gửi hiện tại</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => setView('reservations')} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-slate-700 hover:bg-slate-50">
                <span>Đặt chỗ gửi xe</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {activeFeedback && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-indigo-700 uppercase">Phiếu hỗ trợ</span>
                {/* <StatusBadge status={activeFeedback.status} /> */}
              </div>
              <h5 className="text-xs font-bold text-slate-800">{activeFeedback.type}</h5>
              <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{activeFeedback.description}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
