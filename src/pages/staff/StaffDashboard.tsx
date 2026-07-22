import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  DoorClosed,
  ScrollText,
  AlertTriangle,
  Bell,
  Search,
  LogOut,
  ParkingCircle,
  UserCircle2,
} from 'lucide-react';
import type { User, Slot, Reservation, Payment, PricingRule, VehicleKey, Feedback, SlotIssue, ParkingSession } from '../../data/mockData';
import type { Gate, ScanEvent, AccessLog, EmergencyLog, IncidentType } from '../../types/staff';
import {
  initialGates,
  initialAccessLogs,
  initialEmergencyLogs,
} from '../../types/staff';
import { connectIot, iotTransport, type GateCommand } from '../../services/iotService';
import StaffOverview from './StaffOverview';
import GateControl from './GateControl';
import ActivityLog from './ActivityLog';
import EmergencyReport from './EmergencyReport';
import StaffManagerChat from '../../components/StaffManagerChat';
import RoleProfilePage from '../../components/RoleProfilePage';
import CurrentSessionPage from '../driver/CurrentSession';
import { perVisitOverstay, overstayDue, isReservationPaid } from '../../utils/reservationPricing';
import { formatCurrency } from '../../utils/helpers';
import { lotKeyOf, lotKeyOrDefault } from '../../utils/parkingLots';

interface StaffDashboardProps {
  currentUser: User;
  setView: (view: string) => void;
  currentView: string;
  slots: Slot[];
  reservations: Reservation[];
  payments: Payment[];
  pricingRules: PricingRule[];
  feedbacks: Feedback[];
  users?: User[];
  onConfirmReservation?: (id: string) => void;
  onRespondFeedback?: (id: string, response: string, status?: Feedback['status']) => void;
  onLogout: () => void;
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onAddEmergency?: (log: EmergencyLog) => void;
  onCreateIssue?: (issue: Omit<SlotIssue, 'id' | 'reportedAt' | 'status'>) => Promise<void>;
  onForceClearSlot?: (slotCode: string, reason: string) => Promise<boolean>;
  onSetSlotStatus?: (slotCode: string, status: Slot['status']) => Promise<boolean>;
  onUpdateUser?: (up: Partial<User>) => Promise<{ ok: boolean; error?: string }>;
  /** Trả xe/thu phí một lượt gửi — dùng cho trang "Theo dõi bãi xe". */
  onCheckOutSession?: (
    ticketCode: string,
    paymentMethod: 'Cash' | 'Card' | 'E-Wallet' | 'QR Banking' | 'Crypto' | 'VNPay',
    finalAmount: number,
    showAlert?: boolean,
  ) => boolean;
}

const STAFF_ROUTES = ['staffdashboard', 'gatecontrol', 'parkingmonitor', 'activitylog', 'emergency', 'profile'];

const menuItems = [
  { key: 'staffdashboard', label: 'Bảng điều khiển',   icon: LayoutDashboard              },
  { key: 'gatecontrol',    label: 'Điều khiển cổng',   icon: DoorClosed                   },
  { key: 'parkingmonitor', label: 'Theo dõi bãi xe',   icon: ParkingCircle                },
  { key: 'activitylog',    label: 'Nhật ký hoạt động', icon: ScrollText                   },
  { key: 'emergency',      label: 'Quản lý Sự cố',      icon: AlertTriangle, danger: true  },
];

const nowLabel = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// Staff không có lượt gửi cá nhân — "Theo dõi bãi xe" chạy CurrentSession ở
// chế độ toàn-khách: mọi xe Checked-in trong bãi hiện thành phiên ảo chọn được.
const EMPTY_SESSION: ParkingSession = {
  id: '',
  userId: '',
  ticketCode: '',
  licensePlate: '',
  vehicleType: 'car',
  checkInTime: '',
  entryGate: '',
  floor: '',
  area: '',
  slotCode: '',
  estimatedFee: 0,
  paymentStatus: 'Unpaid',
  sessionStatus: 'Cancelled',
  barrierStatus: 'Closed',
};

let logSeq = 0;
const newLogId = () => `AL-live-${Date.now()}-${logSeq++}`;

export default function StaffDashboard({
  currentUser,
  setView,
  currentView,
  slots: allSlots,
  reservations: allReservations,
  payments,
  pricingRules,
  feedbacks,
  users = [],
  onConfirmReservation,
  onRespondFeedback,
  onLogout,
  addToast,
  onAddEmergency,
  onCreateIssue,
  onForceClearSlot,
  onSetSlotStatus,
  onUpdateUser,
  onCheckOutSession,
}: StaffDashboardProps) {
  // ── Phân quyền theo bãi ─────────────────────────────────────────────────────
  // Staff chỉ thấy và xử lý dữ liệu (ô đỗ, đặt chỗ, thông báo...) của bãi mình
  // được gán (users.assigned_parking_lot). Cô lập tuyệt đối: chưa được gán bãi
  // → KHÔNG thấy dữ liệu bãi nào (banner bên dưới hướng dẫn liên hệ quản lý),
  // tuyệt đối không fallback về "thấy tất cả" để tránh lọt thông báo chéo bãi.
  const staffLotKey = lotKeyOf(currentUser.assignedParkingLot);
  const slots = React.useMemo(
    () => (staffLotKey ? allSlots.filter((s) => lotKeyOrDefault(s.parkingLot) === staffLotKey) : []),
    [allSlots, staffLotKey],
  );
  const reservations = React.useMemo(
    () => (staffLotKey ? allReservations.filter((r) => lotKeyOrDefault(r.parkingLot) === staffLotKey) : []),
    [allReservations, staffLotKey],
  );

  const [gates] = useState<Gate[]>(initialGates);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(initialAccessLogs);
  const [liveScans, setLiveScans] = useState<ScanEvent[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLog[]>(initialEmergencyLogs);
  const [confirmedReservations, setConfirmedReservations] = useState<Set<string>>(new Set());
  const [iotStatus, setIotStatus] = useState<'connecting' | 'online' | 'offline' | 'simulated'>('connecting');
  const [bellOpen, setBellOpen] = useState(false);
  // Which tab EmergencyReport should open on — bell feedback alerts jump
  // straight to the "Phản hồi Người dùng" tab instead of the default one.
  const [emergencyTab, setEmergencyTab] = useState<'slot-issue' | 'user-feedback' | undefined>(undefined);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [bookingAlert, setBookingAlert] = useState<Reservation | null>(null);

  const connRef = useRef<ReturnType<typeof connectIot> | null>(null);
  const prevReservationsRef = useRef(reservations);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Guard the route
  useEffect(() => {
    if (!STAFF_ROUTES.includes(currentView)) setView('staffdashboard');
  }, [currentView, setView]);

  // Detect new reservations (check-in + new booking) → AccessLog + notification popup
  useEffect(() => {
    const prev = prevReservationsRef.current;

    const newCheckedIn = reservations.filter(
      (r) =>
        r.status === 'Checked-in' &&
        !prev.find((p) => p.id === r.id && p.status === 'Checked-in'),
    );
    if (newCheckedIn.length > 0) {
      setAccessLogs((prevLogs) => [
        ...newCheckedIn.map((r) => ({
          id: newLogId(),
          gateId: 'A',
          vehicleId: r.licensePlate,
          action: `Check-in đặt chỗ (${r.reservationCode})`,
          direction: 'entry' as const,
          status: 'GRANTED' as const,
          time: nowLabel(),
          recognition: 'casual' as const,
        })),
        ...prevLogs,
      ]);
    }

    // Detect new Pending bookings → show popup + toast
    const newPending = reservations.filter(
      (r) =>
        r.status === 'Pending' &&
        !prev.find((p) => p.id === r.id),
    );
    if (newPending.length > 0) {
      setBookingAlert(newPending[0]);
      addToast(`Yêu cầu đặt chỗ mới: ${newPending[0].slotCode ?? ''} — ${newPending[0].licensePlate}`, 'info');
    }

    prevReservationsRef.current = reservations;
  }, [reservations]);

  // Connect to the IoT layer once
  useEffect(() => {
    const conn = connectIot({
      onStatus: setIotStatus,
      onScan: (scan) => {
        setLiveScans((prev) => [scan, ...prev].slice(0, 8));
        // Known subscribers are auto-recorded; everything else waits for staff.
        if (scan.recognition === 'subscriber') {
          setAccessLogs((prev) => [
            {
              id: newLogId(),
              gateId: scan.gateId,
              vehicleId: scan.licensePlate || scan.rfidUid || 'THÁNG',
              action: 'Nhận diện tự động',
              direction: scan.direction,
              status: 'GRANTED',
              time: nowLabel(),
              recognition: 'subscriber',
              fee: 0,
            },
            ...prev,
          ]);
          // Auto-handled scans drop off the pending queue shortly after.
          setTimeout(() => {
            setLiveScans((prev) => prev.filter((s) => s.id !== scan.id));
          }, 4000);
        } else if (scan.recognition === 'unknown') {
          setAccessLogs((prev) => [
            {
              id: newLogId(),
              gateId: scan.gateId,
              vehicleId: 'KHÔNG XÁC ĐỊNH',
              action: 'Nhận diện biển số thất bại',
              direction: scan.direction,
              status: 'DENIED',
              time: nowLabel(),
              recognition: 'unknown',
            },
            ...prev,
          ]);
        }
      },
    });
    connRef.current = conn;
    return () => conn.disconnect();
  }, []);

  const sendCommand = (gateId: string, command: GateCommand) =>
    connRef.current?.sendCommand(gateId, command);

  // ---- Handlers ----
  const handleClearReservationsView = () => {
    // handled entirely in StaffOverview local state; no-op callback needed for prop typing
  };

  const handleConfirmScan = (scan: ScanEvent, vehicleType: VehicleKey, status: 'GRANTED' | 'OVERRIDE') => {
    const pricing = pricingRules.find((p) => p.vehicleType === vehicleType);
    const fee =
      scan.direction === 'exit' && scan.recognition !== 'subscriber'
        ? pricing?.firstHourPrice ?? 0
        : 0;
    setAccessLogs((prev) => [
      {
        id: newLogId(),
        gateId: scan.gateId,
        vehicleId: scan.licensePlate || scan.rfidUid || 'THỦ CÔNG',
        action: status === 'OVERRIDE'
          ? `Mở thủ công (${currentUser.fullName.split(' ').pop()})`
          : 'Nhân viên xác nhận',
        direction: scan.direction,
        status,
        time: nowLabel(),
        recognition: scan.recognition,
        fee,
        handledBy: currentUser.fullName,
      },
      ...prev,
    ]);
    setLiveScans((prev) => prev.filter((s) => s.id !== scan.id));
    sendCommand(scan.gateId, 'open');
    addToast(`Đã ghi nhận & mở barie cho ${scan.licensePlate || 'phương tiện'}.`, 'success');
  };

  const handleDenyScan = (scan: ScanEvent) => {
    setAccessLogs((prev) => [
      {
        id: newLogId(),
        gateId: scan.gateId,
        vehicleId: scan.licensePlate || 'KHÔNG XÁC ĐỊNH',
        action: 'Nhân viên từ chối',
        direction: scan.direction,
        status: 'DENIED',
        time: nowLabel(),
        recognition: scan.recognition,
        handledBy: currentUser.fullName,
      },
      ...prev,
    ]);
    setLiveScans((prev) => prev.filter((s) => s.id !== scan.id));
    addToast('Đã từ chối lượt quét.', 'info');
  };

  const handleManualEntry = (
    gateId: string,
    plate: string,
    vehicleType: VehicleKey,
    direction: 'entry' | 'exit',
  ) => {
    const pricing = pricingRules.find((p) => p.vehicleType === vehicleType);
    setAccessLogs((prev) => [
      {
        id: newLogId(),
        gateId,
        vehicleId: plate,
        action: `Mở thủ công (${currentUser.fullName.split(' ').pop()})`,
        direction,
        status: 'OVERRIDE',
        time: nowLabel(),
        recognition: 'casual',
        fee: direction === 'exit' ? pricing?.firstHourPrice ?? 0 : 0,
        handledBy: currentUser.fullName,
      },
      ...prev,
    ]);
    sendCommand(gateId, 'open');
    addToast(`Đã nhập thủ công & ghi nhận ${plate}.`, 'success');
  };

  const handleRfidVerified = (
    gateId: string,
    direction: 'entry' | 'exit',
    plate: string,
    vehicleType: VehicleKey,
    ownerName: string,
    rfidUid: string,
  ) => {
    const pricing = pricingRules.find((p) => p.vehicleType === vehicleType);
    setAccessLogs((prev) => [
      {
        id: newLogId(),
        gateId,
        vehicleId: plate || rfidUid,
        action: 'Quẹt thẻ RFID',
        direction,
        status: 'GRANTED',
        time: nowLabel(),
        recognition: 'subscriber',
        fee: direction === 'exit' ? pricing?.firstHourPrice ?? 0 : 0,
        handledBy: currentUser.fullName,
      },
      ...prev,
    ]);
    sendCommand(gateId, 'open');
    addToast(`Đã xác thực thẻ RFID — mở cổng cho ${ownerName} (${plate}).`, 'success');
  };

  const handleConfirmReservation = (id: string) => {
    const res = reservations.find((r) => r.id === id);
    setConfirmedReservations((prev) => new Set(prev).add(id));
    onConfirmReservation?.(id);
    // Ghi nhận hành động xác nhận đặt chỗ vào nhật ký hoạt động
    if (res) {
      setAccessLogs((prev) => [
        {
          id: newLogId(),
          gateId: 'A',
          vehicleId: res.licensePlate || res.reservationCode,
          action: `Xác nhận đặt chỗ (${res.reservationCode})`,
          direction: 'entry' as const,
          status: 'GRANTED' as const,
          time: nowLabel(),
          recognition: 'casual' as const,
        },
        ...prev,
      ]);
    }
    addToast('Đã xác nhận yêu cầu đặt chỗ.', 'success');
  };

  const handleSubmitEmergency = (type: IncidentType, description: string, slotCode?: string, floor?: string) => {
    const newLog: EmergencyLog = {
      id: `EM-${Date.now()}`,
      type,
      title: `${type}: Báo cáo mới`,
      description,
      status: 'NEW',
      createdAt: `Hôm nay lúc ${nowLabel()}`,
      reportedBy: currentUser.fullName,
      slotCode,
      floor,
    };
    setEmergencyLogs((prev) => [newLog, ...prev]);
    onAddEmergency?.(newLog);
    addToast('Đã gửi cảnh báo khẩn cấp tới quản lý & an ninh.', 'success');
  };

  const alertsCount = accessLogs.filter((l) => l.status === 'DENIED').length;
  const newFeedbacksCount = feedbacks.filter((f) => f.status === 'New').length;
  const pendingReservationsCount = reservations.filter((r) => r.status === 'Pending').length;

  // Xe gửi theo lượt còn trong bãi quá 24 giờ — chuông báo kèm chủ xe và mức
  // phí mới (giá qua đêm + 40% giá lượt). Ticker mỗi phút để mốc 24h được
  // phát hiện cả khi dữ liệu không đổi.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const overstayedVehicles = reservations
    .map((r) => {
      const fee = perVisitOverstay(r, pricingRules, nowTick);
      const paid = isReservationPaid(r, payments);
      return { r, fee, paid, due: overstayDue(fee, paid) };
    })
    .filter((x) => x.fee.overstayed);

  const bellCount = newFeedbacksCount + pendingReservationsCount + overstayedVehicles.length;

  // Mỗi xe vừa vượt mốc 24 giờ được ghi một dòng cảnh báo vào Nhật ký hoạt
  // động (một lần cho mỗi vé trong phiên làm việc).
  const loggedOverstayIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = overstayedVehicles.filter(({ r }) => !loggedOverstayIds.current.has(r.id));
    if (fresh.length === 0) return;
    setAccessLogs((prev) => [
      ...fresh.map(({ r, due }) => ({
        id: newLogId(),
        gateId: 'A',
        vehicleId: r.licensePlate,
        action: `Gửi quá giờ (${r.reservationCode}) — còn thu ${formatCurrency(due)}`,
        direction: 'entry' as const,
        status: 'PENDING' as const,
        time: nowLabel(),
        recognition: 'casual' as const,
      })),
      ...prev,
    ]);
    fresh.forEach(({ r }) => loggedOverstayIds.current.add(r.id));
  }, [overstayedVehicles]);

  const renderContent = () => {
    switch (currentView) {
      case 'gatecontrol':
        return (
          <GateControl
            gates={gates}
            liveScans={liveScans}
            iotStatus={iotStatus}
            iotTransport={iotTransport}
            pricingRules={pricingRules}
            currentUser={currentUser}
            reservations={reservations}
            payments={payments}
            onConfirmScan={handleConfirmScan}
            onDenyScan={handleDenyScan}
            onManualEntry={handleManualEntry}
            onRfidVerified={handleRfidVerified}
            onGateCommand={(gateId, command) => Boolean(sendCommand(gateId, command))}
            onAlarm={(description) => handleSubmitEmergency('Other', description)}
            addToast={addToast}
          />
        );
      case 'parkingmonitor':
        // Toàn bộ chức năng "Lượt gửi hiện tại" của user, chạy trong cổng staff:
        // reservations là của MỌI khách trong bãi phụ trách (đã lọc theo bãi).
        return (
          <CurrentSessionPage
            title="Theo dõi bãi xe"
            subtitle="Theo dõi & quản lý toàn bộ lượt gửi hiện tại của khách — giờ vào, ô đỗ, phí tạm tính và trả xe"
            currentSession={EMPTY_SESSION}
            setView={setView}
            onCheckOutSession={onCheckOutSession ?? (() => false)}
            pricingRules={pricingRules}
            currentUser={currentUser}
            slots={slots}
            payments={payments}
            reservations={reservations}
          />
        );
      case 'activitylog':
        return <ActivityLog accessLogs={accessLogs} reservations={reservations} users={users} />;
      case 'profile':
        return (
          <RoleProfilePage
            user={currentUser}
            roleLabel="Nhân viên"
            locationLabel="Nhà ga A · Cổng 2"
            onUpdateUser={onUpdateUser ?? (async () => ({ ok: false, error: 'Không khả dụng.' }))}
          />
        );
      case 'emergency':
        return (
          <EmergencyReport
            initialTab={emergencyTab}
            slots={slots}
            currentUser={currentUser}
            addToast={addToast}
            onCreateIssue={onCreateIssue}
            feedbacks={feedbacks}
            onRespondFeedback={(id, response, status) => {
              onRespondFeedback?.(id, response, status);
              addToast('Đã lưu phản hồi cho người dùng.', 'success');
            }}
            onForceClearSlot={onForceClearSlot}
            onSetSlotStatus={onSetSlotStatus}
          />
        );
      default:
        return (
          <StaffOverview
            accessLogs={accessLogs}
            reservations={reservations}
            slots={slots}
            feedbacks={feedbacks}
            payments={payments}
            alertsCount={alertsCount}
            confirmedReservations={confirmedReservations}
            onConfirmReservation={handleConfirmReservation}
            onRespondFeedback={(id, response, status) => {
              onRespondFeedback?.(id, response, status);
              addToast('Đã gửi phản hồi tới người dùng.', 'success');
            }}
            onNavigate={setView}
            emergencyLogs={emergencyLogs}
            onSubmitEmergency={handleSubmitEmergency}
            addToast={addToast}
            onSetSlotStatus={onSetSlotStatus}
            assignedLot={currentUser.assignedParkingLot}
          />
        );
    }
  };

  const initials = currentUser.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-slate-100 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
            P
          </div>
          <span className="text-base font-bold text-blue-700">ParkFlow</span>
        </div>

        {/* User info card */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800">{menuItems.find(m => m.key === currentView)?.label ?? 'Bảng điều khiển'}</p>
            <p className="truncate text-[10px] text-slate-400">
              {currentUser.assignedParkingLot
                ? `Bãi phụ trách: ${currentUser.assignedParkingLot}`
                : 'Chưa gán bãi phụ trách'}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : item.danger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${item.danger && !isActive ? 'text-rose-500' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 px-4 pb-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
          >
            Liên hệ Quản lý
          </button>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="pl-56">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-100 bg-white px-6 py-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm kiếm biển số, lệnh điều phối..."
              className="w-full rounded-xl bg-slate-100/70 py-2.5 pl-10 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative" ref={bellRef}>
              <button
                className="relative text-slate-500 hover:text-slate-700"
                title={`${newFeedbacksCount} phản hồi mới, ${pendingReservationsCount} đặt chỗ chờ xác nhận, ${overstayedVehicles.length} xe quá giờ`}
                onClick={() => setBellOpen(o => !o)}
              >
                <Bell className="h-5 w-5" />
                {bellCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {bellCount > 9 ? '9+' : bellCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo</h4>
                    {bellCount > 0 && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-600">{bellCount} mới</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {overstayedVehicles.map(({ r, fee, paid, due }) => (
                      <div
                        key={`overstay-${r.id}`}
                        className="px-4 py-3 bg-amber-50/40 hover:bg-amber-50 cursor-pointer"
                        onClick={() => { setBellOpen(false); setView('staffdashboard'); }}
                      >
                        <p className="text-[10px] font-bold text-amber-600 uppercase">
                          Xe gửi quá giờ
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          {r.licensePlate} · {users.find((u) => u.id === r.userId)?.fullName ?? 'Khách vãng lai'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Còn thu: <span className="font-bold text-amber-700">{formatCurrency(due)}</span>
                          {paid
                            ? ` (phụ phí 40% — giá vé ${formatCurrency(fee.base)} đã thanh toán)`
                            : ` (giá vé ${formatCurrency(fee.base)} + phụ phí 40% ${formatCurrency(fee.surcharge)})`}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {r.reservationCode} · đến dự kiến {r.date} {r.startTime}
                        </p>
                      </div>
                    ))}
                    {feedbacks.filter(f => f.status === 'New').map(fb => (
                      <div
                        key={fb.id}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer"
                        // Feedback alerts land staff on Quản lý Sự cố, opened
                        // straight on the "Phản hồi Người dùng" tab.
                        onClick={() => { setBellOpen(false); setEmergencyTab('user-feedback'); setView('emergency'); }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-rose-600 uppercase">Yêu cầu hỗ trợ mới</p>
                            <p className="text-xs font-semibold text-slate-800 truncate">{fb.type}</p>
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">"{fb.description}"</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${fb.priority === 'High' ? 'bg-rose-100 text-rose-600' : fb.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {fb.priority}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">{fb.createdAt}</p>
                      </div>
                    ))}
                    {reservations.filter(r => r.status === 'Pending').map(res => (
                      <div
                        key={res.id}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => { setBellOpen(false); setView('staffdashboard'); }}
                      >
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Đặt chỗ chờ xác nhận</p>
                        <p className="text-xs font-semibold text-slate-800">{res.reservationCode}</p>
                        <p className="text-[10px] text-slate-400">{res.licensePlate} • {res.date} {res.startTime}</p>
                      </div>
                    ))}
                    {bellCount === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-slate-400">Không có thông báo mới</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition"
                title={currentUser.fullName}
              >
                {initials}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="mt-0.5 inline-block text-[9px] font-bold uppercase text-blue-600">Nhân viên</span>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setView('profile'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <UserCircle2 className="h-4 w-4 text-slate-400" />
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Staff chưa được phân công bãi → toàn bộ dữ liệu rỗng, báo rõ lý do */}
          {!staffLotKey && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-800">Bạn chưa được phân công bãi xe</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Dữ liệu ô đỗ, đặt chỗ và thông báo chỉ hiển thị sau khi Quản lý gán bạn phụ trách
                  một bãi (Quản lý Bãi xe → Nhân viên phụ trách). Vui lòng liên hệ Quản lý.
                </p>
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      {/* New booking alert popup */}
      {bookingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 bg-amber-500 px-5 py-4">
              <Bell className="h-6 w-6 text-white animate-bounce" />
              <div>
                <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">Yêu cầu đặt chỗ mới</p>
                <p className="text-base font-black text-white">Cần xác nhận ngay!</p>
              </div>
            </div>
            {/* Body */}
            <div className="p-5 space-y-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm">
                {[
                  { label: 'Mã đặt chỗ',  value: bookingAlert.reservationCode },
                  { label: 'Ô đỗ',         value: bookingAlert.slotCode ?? '—' },
                  { label: 'Biển số xe',   value: bookingAlert.licensePlate },
                  { label: 'Loại xe',      value: bookingAlert.vehicleType },
                  { label: 'Ngày / Giờ',   value: `${bookingAlert.date} ${bookingAlert.startTime}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-400 text-xs">{row.label}</span>
                    <span className="font-semibold text-slate-800 text-xs font-mono">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setBookingAlert(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Để sau
                </button>
                <button
                  onClick={() => {
                    handleConfirmReservation(bookingAlert.id);
                    setBookingAlert(null);
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
                >
                  XÁC NHẬN NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StaffManagerChat isOpen={chatOpen} onClose={() => setChatOpen(false)} currentUser={currentUser} />
    </div>
  );
}
