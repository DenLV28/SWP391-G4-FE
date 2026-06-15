export type Role = 'Parking User / Driver' | 'Parking Staff' | 'Parking Manager' | 'System Administrator';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  password?: string;
  role: Role;
  status: 'Active' | 'Inactive' | 'Locked';
  createdAt: string;
};

export type VehicleKey = 'car' | 'motorbike' | 'bicycle' | 'electric vehicle';

export type VehicleType = {
  id: string;
  name: string;
  description: string;
};

export type PricingRule = {
  id: number;
  vehicleType: VehicleKey;
  firstHourPrice: number;
  nextHourPrice: number;
  overnightPrice: number;
  lostTicketFee: number;
  extraServiceFee: number;
  overtimeRatePer30Minutes: number;
  note: string;
};

export type ParkingBuilding = {
  id: string;
  name: string;
  address: string;
  workingHours: string;
  hotline: string;
  description: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  lockedSlots: number;
};

export type Floor = {
  id: string;
  floorName: string;
  description: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  lockedSlots: number;
};

export type Area = {
  id: string;
  floorName: string;
  areaName: string;
  vehicleType: VehicleKey;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  lockedSlots: number;
};

export type Slot = {
  id: string;
  floorName: string;
  areaName: string;
  slotCode: string;
  vehicleType: VehicleKey;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance' | 'Locked';
  nearestGate?: string;
};

export type ParkingSession = {
  id: string;
  userId: string;
  ticketCode: string;
  licensePlate: string;
  vehicleType: VehicleKey;
  checkInTime: string;
  checkOutTime?: string;
  expectedEndTime?: string;
  entryGate: string;
  floor: string;
  area: string;
  slotCode: string;
  estimatedFee: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Failed';
  sessionStatus: 'Active' | 'Completed' | 'Cancelled';
  barrierStatus: 'Closed' | 'Opened';
};

export type Reservation = {
  id: string;
  userId: string;
  reservationCode: string;
  reservationType: 'Fixed-time' | 'Flexible';
  slotAssignmentMode: 'Auto' | 'Manual';
  vehicleType: VehicleKey;
  licensePlate: string;
  date: string;
  startTime: string;
  endTime?: string;
  floor: string;
  area: string;
  slotCode?: string;
  status: 'Pending' | 'Confirmed' | 'Checked-in' | 'Cancelled' | 'Expired' | 'Completed';
  note: string;
};

export type Payment = {
  id: string;
  userId: string;
  ticketCode: string;
  parkingFee: number;
  extraServiceFee: number;
  lostTicketFee: number;
  overtimeFee?: number;
  discount: number;
  totalAmount: number;
  method: 'Cash' | 'Card' | 'E-Wallet' | 'QR Banking' | '';
  status: 'Paid' | 'Unpaid' | 'Failed';
  createdAt: string;
  paidAt?: string;
};

export type Feedback = {
  id: string;
  userId: string;
  feedbackCode: string;
  type: string;
  ticketCode: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'In Progress' | 'Resolved' | 'Rejected';
  createdAt: string;
};

export type SavedVehicle = {
  id: string;
  userId: string;
  licensePlate: string;
  vehicleType: VehicleKey;
  brand: string;
  model: string;
  isDefault: boolean;
};

export type SystemConfig = {
  systemName: string;
  defaultCurrency: string;
  reservationEnabled: boolean;
  maxReservationDuration: number;
  parkingSessionTimeout: number;
  notificationEnabled: boolean;
  maintenanceMode: boolean;
  supportHotline: string;
  lostTicketFee: number;
  defaultLanguage: string;
  interfaceMode?: 'light' | 'dark';
};

export type AdminActivity = {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
};

// ==========================================
// PRELOADED MOCK DATA STATE CONSTANTS
// ==========================================
export const initialUsers: User[] = [
  { id: 'USR-101', fullName: 'Trần Đức Minh', email: 'driver@example.com', phone: '0901234567', address: '88 Láng Hạ, Đống Đa, Hà Nội', role: 'Parking User / Driver', status: 'Active', createdAt: '2026-01-15' },
  { id: 'USR-102', fullName: 'Nguyen Van Lock', email: 'locked@example.com', phone: '0987654321', address: '12 Nguyen Trai, Thanh Xuan, Ha Noi', role: 'Parking User / Driver', status: 'Locked', createdAt: '2026-02-20' },
  { id: 'USR-103', fullName: 'Le Thi Inactive', email: 'inactive@example.com', phone: '0912345678', address: '45 Le Van Sy, Phu Nhuan, TP.HCM', role: 'Parking User / Driver', status: 'Inactive', createdAt: '2026-03-01' },
  { id: 'USR-104', fullName: 'Pham Minh Staff', email: 'staff@example.com', phone: '0933445566', address: '21 Hoang Van Thu, Tan Binh, TP.HCM', role: 'Parking Staff', status: 'Active', createdAt: '2026-03-10' },
  { id: 'USR-105', fullName: 'Admin Administrator', email: 'admin@example.com', phone: '0900000001', address: '1 Vo Van Tan, District 3, TP.HCM', role: 'System Administrator', status: 'Active', createdAt: '2026-01-01' }
];

export const mockBuilding: ParkingBuilding = {
  id: 'BUILD-01',
  name: 'Central Parking Building',
  address: '28 Nguyen Huu Canh, Binh Thanh District, HCMC',
  workingHours: '24/7, Mon - Sun',
  hotline: '1900 6789',
  description: 'Ultra-modern 5-floor parking building equipped with solar charging terminals, automated number plate scanners, and smart safety barriers.',
  totalSlots: 350,
  availableSlots: 149,
  occupiedSlots: 178,
  reservedSlots: 17,
  maintenanceSlots: 6,
  lockedSlots: 0
};

export const mockVehicleTypes: VehicleType[] = [
  { id: 'VT-01', name: 'Car', description: 'Sedan, SUV, Hatchback, Pickup trucks' },
  { id: 'VT-02', name: 'Motorbike', description: 'Scooters, Manual motorbikes' },
  { id: 'VT-03', name: 'Bicycle', description: 'Electric and regular human-powered bicycles' },
  { id: 'VT-04', name: 'EV Car (Electric)', description: 'Electric vehicles requiring charging port accessibility' }
];

export const vehicleTypes = [
  { key: 'car' as VehicleKey, label: 'Car', description: 'Sedan, SUV, Hatchback, Pickup trucks' },
  { key: 'motorbike' as VehicleKey, label: 'Motorbike', description: 'Scooters, Manual motorbikes' },
  { key: 'bicycle' as VehicleKey, label: 'Bicycle', description: 'Electric and regular human-powered bicycles' },
  { key: 'electric vehicle' as VehicleKey, label: 'Electric Vehicle', description: 'Electric vehicles requiring charging port accessibility' }
];


export const mockPricingRules: PricingRule[] = [
  { id: 1, vehicleType: 'car', firstHourPrice: 25000, nextHourPrice: 15000, overnightPrice: 150000, lostTicketFee: 200000, extraServiceFee: 10000, overtimeRatePer30Minutes: 5000, note: 'Daily maximum capped at 180,000 VND.' },
  { id: 2, vehicleType: 'motorbike', firstHourPrice: 7000, nextHourPrice: 4000, overnightPrice: 30000, lostTicketFee: 100000, extraServiceFee: 0, overtimeRatePer30Minutes: 2000, note: 'Safe overnight lockers near exit booths.' },
  { id: 3, vehicleType: 'bicycle', firstHourPrice: 3000, nextHourPrice: 1000, overnightPrice: 10000, lostTicketFee: 50000, extraServiceFee: 0, overtimeRatePer30Minutes: 1000, note: 'Requires manual wheel locks on iron gates.' },
  { id: 4, vehicleType: 'electric vehicle', firstHourPrice: 30000, nextHourPrice: 20000, overnightPrice: 180000, lostTicketFee: 200000, extraServiceFee: 15000, overtimeRatePer30Minutes: 6000, note: 'Charger connection fee of 15,000 VND included.' }
];

export const mockParkingRules = [
  { id: 1, content: 'Present your reservation code or ticket receipt scans at the entrance barriers.' },
  { id: 2, content: 'Do not park in zones assigned to EV cars unless your vehicle supports EV charging.' },
  { id: 3, content: 'Strictly follow speed limits under 10km/h inside the structured lanes.' },
  { id: 4, content: 'Valuables should not be left inside the vehicle unattended.' }
];

export const mockFloors: Floor[] = [
  { id: 'FL-B1', floorName: 'Basement B1', description: 'Dedicated level for two-wheelers and scooters', totalSlots: 150, availableSlots: 42, occupiedSlots: 92, reservedSlots: 10, maintenanceSlots: 6, lockedSlots: 0 },
  { id: 'FL-F1', floorName: 'Floor 1', description: 'Primary level for standard size gasoline and diesel cars', totalSlots: 80, availableSlots: 12, occupiedSlots: 60, reservedSlots: 5, maintenanceSlots: 3, lockedSlots: 0 },
  { id: 'FL-F2', floorName: 'Floor 2', description: 'Smart EV charging terminals and green vehicle parking', totalSlots: 20, availableSlots: 6, occupiedSlots: 11, reservedSlots: 2, maintenanceSlots: 1, lockedSlots: 0 },
  { id: 'FL-F3', floorName: 'Floor 3', description: 'Indoor bicycle racks and eco friendly parking brackets', totalSlots: 50, availableSlots: 35, occupiedSlots: 15, reservedSlots: 0, maintenanceSlots: 0, lockedSlots: 0 },
  { id: 'FL-RF', floorName: 'Rooftop', description: 'Overflow open-air area for all classes during peak occupancy hours', totalSlots: 50, availableSlots: 50, occupiedSlots: 0, reservedSlots: 0, maintenanceSlots: 0, lockedSlots: 0 }
];

export const mockAreas: Area[] = [
  { id: 'AR-01', floorName: 'Basement B1', areaName: 'Basement B1 - Motorbike Area', vehicleType: 'motorbike', totalSlots: 150, availableSlots: 42, occupiedSlots: 92, reservedSlots: 10, maintenanceSlots: 6, lockedSlots: 0 },
  { id: 'AR-02', floorName: 'Floor 1', areaName: 'Floor 1 - Car Area', vehicleType: 'car', totalSlots: 80, availableSlots: 12, occupiedSlots: 60, reservedSlots: 5, maintenanceSlots: 3, lockedSlots: 0 },
  { id: 'AR-03', floorName: 'Floor 2', areaName: 'Floor 2 - EV Area', vehicleType: 'electric vehicle', totalSlots: 20, availableSlots: 6, occupiedSlots: 11, reservedSlots: 2, maintenanceSlots: 1, lockedSlots: 0 },
  { id: 'AR-04', floorName: 'Floor 3', areaName: 'Floor 3 - Bicycle Area', vehicleType: 'bicycle', totalSlots: 50, availableSlots: 35, occupiedSlots: 15, reservedSlots: 0, maintenanceSlots: 0, lockedSlots: 0 },
  { id: 'AR-05', floorName: 'Rooftop', areaName: 'Rooftop - Overflow Area', vehicleType: 'car', totalSlots: 50, availableSlots: 50, occupiedSlots: 0, reservedSlots: 0, maintenanceSlots: 0, lockedSlots: 0 }
];

export const initialSlots: Slot[] = [
  { id: 'SL-01', floorName: 'Basement B1', areaName: 'Basement B1 - Motorbike Area', slotCode: 'MB-B1-A001', vehicleType: 'motorbike', status: 'Available', nearestGate: 'Gate B (Basement Entry)' },
  { id: 'SL-02', floorName: 'Basement B1', areaName: 'Basement B1 - Motorbike Area', slotCode: 'MB-B1-A002', vehicleType: 'motorbike', status: 'Occupied', nearestGate: 'Gate B (Basement Entry)' },
  { id: 'SL-03', floorName: 'Basement B1', areaName: 'Basement B1 - Motorbike Area', slotCode: 'MB-B1-A003', vehicleType: 'motorbike', status: 'Reserved', nearestGate: 'Gate B (Basement Entry)' },
  { id: 'SL-04', floorName: 'Basement B1', areaName: 'Basement B1 - Motorbike Area', slotCode: 'MB-B1-A004', vehicleType: 'motorbike', status: 'Maintenance', nearestGate: 'Gate B (Basement Entry)' },
  
  { id: 'SL-05', floorName: 'Floor 1', areaName: 'Floor 1 - Car Area', slotCode: 'CAR-F1-A011', vehicleType: 'car', status: 'Available', nearestGate: 'Gate A (Main Entry)' },
  { id: 'SL-06', floorName: 'Floor 1', areaName: 'Floor 1 - Car Area', slotCode: 'CAR-F1-A012', vehicleType: 'car', status: 'Occupied', nearestGate: 'Gate A (Main Entry)' },
  { id: 'SL-07', floorName: 'Floor 1', areaName: 'Floor 1 - Car Area', slotCode: 'CAR-F1-A013', vehicleType: 'car', status: 'Reserved', nearestGate: 'Gate A (Main Entry)' },
  { id: 'SL-08', floorName: 'Floor 1', areaName: 'Floor 1 - Car Area', slotCode: 'CAR-F1-A014', vehicleType: 'car', status: 'Locked', nearestGate: 'Gate A (Main Entry)' },

  { id: 'SL-09', floorName: 'Floor 2', areaName: 'Floor 2 - EV Area', slotCode: 'EV-F2-A021', vehicleType: 'electric vehicle', status: 'Available', nearestGate: 'Gate A (Main Entry)' },
  { id: 'SL-10', floorName: 'Floor 2', areaName: 'Floor 2 - EV Area', slotCode: 'EV-F2-A022', vehicleType: 'electric vehicle', status: 'Occupied', nearestGate: 'Gate A (Main Entry)' },
  { id: 'SL-11', floorName: 'Floor 2', areaName: 'Floor 2 - EV Area', slotCode: 'EV-F2-A023', vehicleType: 'electric vehicle', status: 'Maintenance', nearestGate: 'Gate A (Main Entry)' },
  
  { id: 'SL-12', floorName: 'Floor 3', areaName: 'Floor 3 - Bicycle Area', slotCode: 'BI-F3-A031', vehicleType: 'bicycle', status: 'Available', nearestGate: 'Gate C (North Elevator)' },
  { id: 'SL-13', floorName: 'Floor 3', areaName: 'Floor 3 - Bicycle Area', slotCode: 'BI-F3-A032', vehicleType: 'bicycle', status: 'Occupied', nearestGate: 'Gate C (North Elevator)' },

  { id: 'SL-14', floorName: 'Rooftop', areaName: 'Rooftop - Overflow Area', slotCode: 'OVR-RF-A041', vehicleType: 'car', status: 'Available', nearestGate: 'Gate D (Rooftop Ramp)' }
];

export const initialParkingSession: ParkingSession = {
  id: 'SES-7001',
  userId: 'USR-101',
  ticketCode: 'TK-480921',
  licensePlate: '59A-888.88',
  vehicleType: 'car',
  checkInTime: '2026-06-04 06:15',
  expectedEndTime: '2026-06-04 18:00',
  entryGate: 'Gate A - Entrance',
  floor: 'Floor 1',
  area: 'Floor 1 - Car Area',
  slotCode: 'CAR-F1-A012',
  estimatedFee: 55000,
  paymentStatus: 'Unpaid',
  sessionStatus: 'Active',
  barrierStatus: 'Closed'
};

export const initialReservations: Reservation[] = [
  { id: 'RSV-201', userId: 'USR-101', reservationCode: 'RSV-998101', reservationType: 'Fixed-time', slotAssignmentMode: 'Auto', vehicleType: 'car', licensePlate: '59A-888.88', date: '2026-06-04', startTime: '09:00', endTime: '18:00', floor: 'Floor 1', area: 'Floor 1 - Car Area', status: 'Confirmed', note: 'Need elevator proximity' },
  { id: 'RSV-202', userId: 'USR-101', reservationCode: 'RSV-998102', reservationType: 'Fixed-time', slotAssignmentMode: 'Auto', vehicleType: 'electric vehicle', licensePlate: '59A-888.88', date: '2026-06-05', startTime: '10:00', endTime: '14:00', floor: 'Floor 2', area: 'Floor 2 - EV Area', status: 'Pending', note: 'Charging needed' }
];

export const initialPayments: Payment[] = [
  { id: 'PAY-401', userId: 'USR-101', ticketCode: 'TK-480921', parkingFee: 40000, extraServiceFee: 15000, lostTicketFee: 0, discount: 5000, totalAmount: 50000, method: '', status: 'Unpaid', createdAt: '2026-06-04 07:15' },
  { id: 'PAY-402', userId: 'USR-101', ticketCode: 'TK-478012', parkingFee: 25000, extraServiceFee: 0, lostTicketFee: 0, discount: 0, totalAmount: 25000, method: 'QR Banking', status: 'Paid', createdAt: '2026-06-03 18:22', paidAt: '2026-06-03 18:30' }
];

export const initialFeedbacks: Feedback[] = [
  { id: 'FB-501', userId: 'USR-101', feedbackCode: 'FB-1004', type: 'Wrong fee', ticketCode: 'TK-478012', description: 'Peak tariff fee looks mismatched against hourly stays.', priority: 'Medium', status: 'In Progress', createdAt: '2026-06-03 19:00' },
  { id: 'FB-502', userId: 'USR-101', feedbackCode: 'FB-1002', type: 'Occupied slot', ticketCode: '', description: 'My reserved slot was taken by a different model car.', priority: 'High', status: 'Resolved', createdAt: '2026-06-01 11:30' }
];

export const initialSavedVehicles: SavedVehicle[] = [
  { id: 'SV-01', userId: 'USR-101', licensePlate: '59A-888.88', vehicleType: 'car', brand: 'Toyota', model: 'Camry', isDefault: true },
  { id: 'SV-02', userId: 'USR-101', licensePlate: '59P-999.99', vehicleType: 'motorbike', brand: 'Honda', model: 'SH 150i', isDefault: false }
];

export const initialSystemConfig: SystemConfig = {
  systemName: 'Central Parking Building System',
  defaultCurrency: 'VND',
  reservationEnabled: true,
  maxReservationDuration: 24,
  parkingSessionTimeout: 30,
  notificationEnabled: true,
  maintenanceMode: false,
  supportHotline: '1900 6789',
  lostTicketFee: 200000,
  defaultLanguage: 'Vietnamese',
  interfaceMode: 'light'
};

export const initialAdminActivities: AdminActivity[] = [
  { id: 'ACT-901', action: 'Lock User Account', actor: 'Admin Administrator', target: 'Nguyen Van Lock (locked@example.com)', createdAt: '2026-06-03 14:20' },
  { id: 'ACT-902', action: 'System settings configured', actor: 'Admin Administrator', target: 'Lost ticket fine: 200,000 VND', createdAt: '2026-06-02 09:10' }
];

export const rolesList = [
  { id: 'R1', name: 'Parking User / Driver', description: 'Regular drivers tracking slots, making reservations, paying tickets, submitting feedbacks, and registering plates.', permissions: ['View parking information', 'View available slots', 'Create reservation', 'View own parking session', 'Make payment', 'Submit feedback', 'Manage own profile'] },
  { id: 'R2', name: 'Parking Staff', description: 'Operations staff handling gates checking, physical tickets issue, and slot status logging.', permissions: ['Create parking session', 'Process vehicle entry', 'Process vehicle exit', 'Update slot status', 'Handle lost ticket'] },
  { id: 'R3', name: 'Parking Manager', description: 'Management level editing building pricing policies, overseeing floor allocations, and audit logs.', permissions: ['Manage parking building', 'Manage floors and slots', 'Manage pricing rules', 'View reports', 'Manage parking policies'] },
  { id: 'R4', name: 'System Administrator', description: 'Administrative staff controlling access credentials permissions, configuration values, and user security status.', permissions: ['Manage users', 'Manage roles', 'Manage system configuration'] }
];

// ==========================================
// VALIDATION HELPERS
// ==========================================
export const validateEmail = (email: string): string => {
  if (!email) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Email format is invalid.';
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone) return 'Phone number is required.';
  const numOnly = /^[0-9]+$/;
  if (!numOnly.test(phone)) return 'Phone number must contain digits only.';
  if (phone.length < 8 || phone.length > 11) return 'Phone number must be between 8 and 11 digits.';
  return '';
};

export const validateRequired = (val: string, label: string): string => {
  if (!val || val.trim() === '') return `${label} is required.`;
  return '';
};
