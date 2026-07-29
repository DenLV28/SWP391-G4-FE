<<<<<<< HEAD
import React, { useState, useEffect } from "react";
// Common UI components
import Topbar from "./components/Topbar";
import { AdminSidebar, DriverSidebar } from "./components/Sidebar";
import PublicNavbar from "./components/PublicNavbar";
import Footer from "./components/Footer";



// Driver pages
import MyParking from "./pages/driver/MyParking";
import CurrentSessionPage from "./pages/driver/CurrentSession";
import MyReservations from "./pages/driver/MyReservations";
import PaymentsPage from "./pages/driver/Payments";
import FeedbackPage from "./pages/driver/Feedback";
import ProfilePage from "./pages/driver/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import SystemConfiguration from "./pages/admin/SystemConfiguration";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";

// Mock data & Types & Helpers
import {
  User,
  Slot,
  Floor,
  Area,
  Reservation,
  Payment,
  Feedback,
  SavedVehicle,
  SystemConfig,
  AdminActivity,
  ParkingSession,
  Role,
  initialUsers,
  initialSlots,
  mockFloors,
  mockAreas,
  initialReservations,
  initialPayments,
  initialFeedbacks,
  initialSavedVehicles,
  initialSystemConfig,
  initialAdminActivities,
  initialParkingSession,
  rolesList,
  mockPricingRules,
} from "./data/mockData";
import {
  LayoutDashboard,
  ParkingCircle,
  DollarSign,
  BarChart3,
  AlertCircle,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function App() {
  // Toast notifications states
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "info" | "error" }[]
  >([]);

  const addToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Override window.alert
  useEffect(() => {
    window.alert = (message: string) => {
      const lowercaseMsg = message.toLowerCase();
      let type: "success" | "info" | "error" = "success";
      if (
        lowercaseMsg.includes("error") ||
        lowercaseMsg.includes("fail") ||
        lowercaseMsg.includes("not permit") ||
        lowercaseMsg.includes("cannot") ||
        lowercaseMsg.includes("incorrect") ||
        lowercaseMsg.includes("required") ||
        lowercaseMsg.includes("invalid") ||
        lowercaseMsg.includes("choose") ||
        lowercaseMsg.includes("select") ||
        lowercaseMsg.includes("first to reserve")
      ) {
        type = "error";
      } else if (
        lowercaseMsg.includes("info") ||
        lowercaseMsg.includes("notice") ||
        lowercaseMsg.includes("cancelled")
      ) {
        type = "info";
      }
      addToast(message, type);
    };
  }, []);

  // Navigation & User Portal States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>("home");
  const [interfaceMode, setInterfaceMode] = useState<"light" | "dark">(
    initialSystemConfig.interfaceMode ?? "light",
  );

  const setView = (view: string) => {
    window.location.hash = `#/${view}`;
  };

  // Sync view state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\//, "");
      const validViews = [
        "home", "info", "slots", "pricing", "pricing-detail", "contact", "login", "register",
        "myparking", "session", "reservations", "payments", "feedback", "profile",
        "admindashboard", "usermanagement", "rolemanagement", "systemconfig",
        "managerdashboard", "parkinglots", "pricing-vehicles", "reports", "exceptions",
      ];

      const targetView = hash || "home";

      if (!validViews.includes(targetView)) {
        setCurrentView("home");
        window.location.hash = "#/home";
        return;
      }

      if (!currentUser) {
        const isProtectedRoute = [
          "myparking", "session", "reservations", "payments", "feedback", "profile",
          "admindashboard", "usermanagement", "rolemanagement", "systemconfig",
          "managerdashboard", "parkinglots", "pricing-vehicles", "reports", "exceptions",
        ].includes(targetView);

        if (isProtectedRoute) {
          setCurrentView("login");
          window.location.hash = "#/login";
        } else {
          setCurrentView(targetView);
        }
        return;
      }

      // User is logged in
      const isPublicRoute = ["home", "info", "slots", "pricing", "pricing-detail", "contact"].includes(targetView);
      const isAdminRoute = ["admindashboard", "usermanagement", "rolemanagement", "systemconfig"].includes(targetView);
      const isManagerRoute = ["managerdashboard", "parkinglots", "pricing-vehicles", "reports", "exceptions"].includes(targetView);
      const isDriverRoute = ["myparking", "session", "reservations", "payments", "feedback", "profile"].includes(targetView);

      if (isPublicRoute) {
        setCurrentView(targetView);
      } else if (currentUser.role === "System Administrator") {
        if (isAdminRoute) {
          setCurrentView(targetView);
        } else {
          setCurrentView("admindashboard");
          window.location.hash = "#/admindashboard";
        }
      } else if (currentUser.role === "Parking Manager") {
        if (isManagerRoute) {
          setCurrentView(targetView);
        } else {
          setCurrentView("managerdashboard");
          window.location.hash = "#/managerdashboard";
        }
      } else {
        // Driver or Parking Staff
        if (isDriverRoute) {
          setCurrentView(targetView);
        } else {
          setCurrentView("myparking");
          window.location.hash = "#/myparking";
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentUser]);

  // Application Mock Database States
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [floors, setFloors] = useState<Floor[]>(mockFloors);
  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [savedVehicles, setSavedVehicles] =
    useState<SavedVehicle[]>(initialSavedVehicles);
  const [systemConfig, setSystemConfig] =
    useState<SystemConfig>(initialSystemConfig);
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>(
    initialAdminActivities,
  );
  const [currentSession, setCurrentSession] = useState<ParkingSession>(
    initialParkingSession,
  );

  useEffect(() => {
    setInterfaceMode(systemConfig.interfaceMode ?? "light");
  }, [systemConfig.interfaceMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", interfaceMode);
  }, [interfaceMode]);

  // Authentication operations
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === "System Administrator") {
      setView("admindashboard");
    } else if (user.role === "Parking Manager") {
      setView("managerdashboard");
    } else {
      setView("myparking");
    }
  };

  const handleRegister = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parkflow_user');
    setView("home");
  };

  // Driver actions
  const handleAddReservation = (newRes: any): Reservation | null => {
    const code = `RSV-${Math.floor(1000 + Math.random() * 9000)}`;
    let assignedSlotCode = newRes.slotCode;

    if (!assignedSlotCode && newRes.slotAssignmentMode === "Auto") {
      const availableSlot = slots.find(
        (s) =>
          s.floorName === newRes.floor &&
          s.areaName === newRes.area &&
          s.vehicleType === newRes.vehicleType &&
          s.status === "Available",
      );
      if (availableSlot) {
        assignedSlotCode = availableSlot.slotCode;
      }
    }

    const r: Reservation = {
      id: `RSV-${Date.now()}`,
      userId: currentUser?.id || "GUEST",
      reservationCode: code,
      status: "Confirmed",
      ...newRes,
      slotCode: assignedSlotCode,
    };

    setReservations((prev) => [r, ...prev]);

    // Update areas slots stats
    setAreas((prev) =>
      prev.map((a) => {
        if (a.areaName === newRes.area) {
          return {
            ...a,
            availableSlots: Math.max(0, a.availableSlots - 1),
            reservedSlots: a.reservedSlots + 1,
          };
        }
        return a;
      }),
    );

    // Update floors slots stats
    setFloors((prev) =>
      prev.map((f) => {
        if (f.floorName === newRes.floor) {
          return {
            ...f,
            availableSlots: Math.max(0, f.availableSlots - 1),
            reservedSlots: f.reservedSlots + 1,
          };
        }
        return f;
      }),
    );

    // Update individual slot status to Reserved
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slotCode === assignedSlotCode) {
          return { ...s, status: "Reserved" };
        }
        return s;
      }),
    );

    return r;
  };

  const handleCancelReservation = (id: string) => {
    const targetRes = reservations.find((r) => r.id === id);
    if (!targetRes) return;

    // Check cancellation lead time: at least 15 minutes before start time
    const [year, month, day] = targetRes.date.split("-").map(Number);
    const [hour, minute] = targetRes.startTime.split(":").map(Number);
    const startDateTime = new Date(year, month - 1, day, hour, minute);
    const now = new Date();

    const diffMs = startDateTime.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    if (diffMins < 15) {
      alert(
        "Cannot cancel reservation. You can only cancel at least 15 minutes before the start time.",
      );
      return;
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r)),
    );

    // Revert areas slots stats
    setAreas((prev) =>
      prev.map((a) => {
        if (a.areaName === targetRes.area) {
          return {
            ...a,
            availableSlots: a.availableSlots + 1,
            reservedSlots: Math.max(0, a.reservedSlots - 1),
          };
        }
        return a;
      }),
    );

    // Revert floors slots stats
    setFloors((prev) =>
      prev.map((f) => {
        if (f.floorName === targetRes.floor) {
          return {
            ...f,
            availableSlots: f.availableSlots + 1,
            reservedSlots: Math.max(0, f.reservedSlots - 1),
          };
        }
        return f;
      }),
    );

    // Revert slot status back to Available
    setSlots((prev) => {
      let updated = false;
      return prev.map((s) => {
        if (
          !updated &&
          s.floorName === targetRes.floor &&
          s.areaName === targetRes.area &&
          s.vehicleType === targetRes.vehicleType &&
          s.status === "Reserved"
        ) {
          updated = true;
          return { ...s, status: "Available" };
        }
        return s;
      });
    });

    alert(
      "Reservation cancelled successfully. The reserved slot has been released.",
    );
  };

  const handleExpireReservation = (id: string) => {
    const targetRes = reservations.find((r) => r.id === id);
    if (!targetRes) return;
    if (targetRes.status !== "Confirmed" && targetRes.status !== "Pending")
      return;

    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Expired" } : r)),
    );

    // Revert areas slots stats
    setAreas((prev) =>
      prev.map((a) => {
        if (a.areaName === targetRes.area) {
          return {
            ...a,
            availableSlots: a.availableSlots + 1,
            reservedSlots: Math.max(0, a.reservedSlots - 1),
          };
        }
        return a;
      }),
    );

    // Revert floors slots stats
    setFloors((prev) =>
      prev.map((f) => {
        if (f.floorName === targetRes.floor) {
          return {
            ...f,
            availableSlots: f.availableSlots + 1,
            reservedSlots: Math.max(0, f.reservedSlots - 1),
          };
        }
        return f;
      }),
    );

    // Revert slot status back to Available
    setSlots((prev) => {
      let updated = false;
      return prev.map((s) => {
        if (
          !updated &&
          s.floorName === targetRes.floor &&
          s.areaName === targetRes.area &&
          s.vehicleType === targetRes.vehicleType &&
          s.status === "Reserved"
        ) {
          updated = true;
          return { ...s, status: "Available" };
        }
        return s;
      });
    });

    alert("Reservation expired. The reserved slot has been released.");
  };

  // Auto-expire reservations background job
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const toExpire = reservations.filter((res) => {
        if (res.status !== "Confirmed" && res.status !== "Pending")
          return false;
        const [year, month, day] = res.date.split("-").map(Number);
        const [hour, min] = res.startTime.split(":").map(Number);
        const expirationTime = new Date(year, month - 1, day, hour, min + 15);
        return now > expirationTime;
      });

      // Avoid alert spam on auto-expire
      const originalAlert = window.alert;
      window.alert = () => {};
      toExpire.forEach((res) => {
        handleExpireReservation(res.id);
        if (currentUser && res.userId === currentUser.id) {
          addToast(
            `Reservation ${res.reservationCode} has expired due to late arrival.`,
            "info",
          );
        }
      });
      window.alert = originalAlert;
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [reservations, currentUser]);

  const handleCheckInReservation = (
    reservationId: string,
  ): {
    success: boolean;
    ticketCode?: string;
    slotCode?: string;
    error?: string;
  } => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return { success: false, error: "Reservation does not exist." };
    if (res.status !== "Confirmed")
      return {
        success: false,
        error: `Reservation status is ${res.status}, not Confirmed.`,
      };
    if (currentUser?.status !== "Active")
      return { success: false, error: "Account is not active." };

    // Find a slot in this floor/area to occupy
    // First try to find a Reserved slot in this floor/area (which was allocated on booking)
    // If not found, try to find an Available slot
    let targetSlot = slots.find(
      (s) =>
        s.floorName === res.floor &&
        s.areaName === res.area &&
        s.vehicleType === res.vehicleType &&
        s.status === "Reserved",
    );
    if (!targetSlot) {
      targetSlot = slots.find(
        (s) =>
          s.floorName === res.floor &&
          s.areaName === res.area &&
          s.vehicleType === res.vehicleType &&
          s.status === "Available",
      );
    }

    if (!targetSlot) {
      return {
        success: false,
        error: "No vacant slot available in the selected zone.",
      };
    }

    const ticketCode = `TCK-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update reservation status to Checked-in
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId ? { ...r, status: "Checked-in" } : r,
      ),
    );

    // Update slot status to Occupied
    setSlots((prev) =>
      prev.map((s) =>
        s.id === targetSlot.id ? { ...s, status: "Occupied" } : s,
      ),
    );

    // Create a new current session
    const newSession: ParkingSession = {
      id: `SES-${Date.now()}`,
      userId: currentUser.id,
      ticketCode: ticketCode,
      licensePlate: res.licensePlate,
      vehicleType: res.vehicleType,
      checkInTime: new Date().toISOString().replace("T", " ").slice(0, 16),
      expectedEndTime: `${res.date} ${res.endTime}`,
      entryGate: "Gate A - Entrance Kiosk",
      floor: res.floor,
      area: res.area,
      slotCode: targetSlot.slotCode,
      estimatedFee: 0,
      paymentStatus: "Unpaid",
      sessionStatus: "Active",
      barrierStatus: "Closed",
    };

    // Update floor/area stats: decrement reserved, increment occupied
    setAreas((prev) =>
      prev.map((a) => {
        if (a.areaName === res.area) {
          return {
            ...a,
            reservedSlots: Math.max(0, a.reservedSlots - 1),
            occupiedSlots: a.occupiedSlots + 1,
          };
        }
        return a;
      }),
    );

    setFloors((prev) =>
      prev.map((f) => {
        if (f.floorName === res.floor) {
          return {
            ...f,
            reservedSlots: Math.max(0, f.reservedSlots - 1),
            occupiedSlots: f.occupiedSlots + 1,
          };
        }
        return f;
      }),
    );

    // Auto create a matching unpaid invoice
    const newInvoice: Payment = {
      id: `PAY-${Date.now()}`,
      userId: currentUser.id,
      ticketCode: ticketCode,
      parkingFee: 0,
      extraServiceFee: 0,
      lostTicketFee: 0,
      discount: 0,
      totalAmount: 0,
      method: "",
      status: "Unpaid",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setPayments((prev) => [newInvoice, ...prev]);

    setCurrentSession(newSession);

    return { success: true, ticketCode, slotCode: targetSlot.slotCode };
  };

  const handleCheckOutSession = (
    ticketCode: string,
    paymentMethod: "Cash" | "Card" | "E-Wallet" | "QR Banking",
    invoice: any,
  ): boolean => {
    if (currentSession.ticketCode !== ticketCode) return false;
    if (currentSession.sessionStatus !== "Active") return false;
    if (currentUser?.status !== "Active") return false;

    const targetSlot = slots.find(
      (s) =>
        s.slotCode === currentSession.slotCode &&
        s.floorName === currentSession.floor &&
        s.areaName === currentSession.area,
    );

    if (targetSlot) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === targetSlot.id ? { ...s, status: "Available" } : s,
        ),
      );
    }

    setCurrentSession((prev) => ({
      ...prev,
      sessionStatus: "Completed",
      paymentStatus: "Paid",
      estimatedFee: invoice.totalAmount,
      barrierStatus: "Opened",
      checkOutTime: new Date().toISOString().replace("T", " ").slice(0, 16),
    }));

    setPayments((prev) =>
      prev.map((p) =>
        p.ticketCode === ticketCode
          ? {
              ...p,
              status: "Paid",
              method: paymentMethod,
              parkingFee: invoice.parkingFee,
              extraServiceFee: invoice.extraServiceFee,
              lostTicketFee: invoice.lostTicketFee,
              overtimeFee: invoice.overtimeFee,
              discount: invoice.discount,
              totalAmount: invoice.totalAmount,
              paidAt: new Date().toISOString().replace("T", " ").slice(0, 16),
            }
          : p,
      ),
    );

    setAreas((prev) =>
      prev.map((a) => {
        if (a.areaName === currentSession.area) {
          return {
            ...a,
            occupiedSlots: Math.max(0, a.occupiedSlots - 1),
            availableSlots: a.availableSlots + 1,
          };
        }
        return a;
      }),
    );

    setFloors((prev) =>
      prev.map((f) => {
        if (f.floorName === currentSession.floor) {
          return {
            ...f,
            occupiedSlots: Math.max(0, f.occupiedSlots - 1),
            availableSlots: f.availableSlots + 1,
          };
        }
        return f;
      }),
    );

    setReservations((prev) =>
      prev.map((r) => {
        if (
          r.licensePlate.trim().toLowerCase() ===
            currentSession.licensePlate.trim().toLowerCase() &&
          r.status === "Checked-in"
        ) {
          return { ...r, status: "Completed" };
        }
        return r;
      }),
    );

    alert(
      "Payment completed successfully. Barrier opened. Check-out successful.",
    );
    return true;
  };

  const handleConfirmPayment = (
    id: string,
    method: "Cash" | "Card" | "E-Wallet" | "QR Banking",
  ) => {
    const today = new Date().toISOString().replace("T", " ").slice(0, 19);
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "Paid", method, paidAt: today } : p,
      ),
    );

    // Auto settle active session if ticket matches
    const payment = payments.find((p) => p.id === id);
    if (payment && payment.ticketCode === currentSession.ticketCode) {
      setCurrentSession((prev) => ({ ...prev, paymentStatus: "Paid" }));
    }
    alert(`Payment completed successfully via ${method}.`);
  };

  const handleAddVehicle = (newVeh: any): boolean => {
    const v: SavedVehicle = {
      id: `SV-${Date.now()}`,
      userId: currentUser?.id || "",
      isDefault: savedVehicles.length === 0,
      ...newVeh,
    };
    setSavedVehicles((prev) => [...prev, v]);
    return true;
  };

  const handleSubmitFeedback = (newFb: any) => {
    const fbCode = `FB-${Date.now().toString().slice(-6)}`;
    const f: Feedback = {
      id: `FB-${Date.now()}`,
      userId: currentUser?.id || "",
      feedbackCode: fbCode,
      status: "New",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      ...newFb,
    };
    setFeedbacks((prev) => [f, ...prev]);
  };

  const handleUpdateProfile = (up: Partial<User>) => {
    if (!currentUser) return;
    const nextUser = { ...currentUser, ...up };
    setCurrentUser(nextUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...up } : u)),
    );
  };

  // Admin actions
  const handleCreateUser = (u: any): boolean => {
    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split("T")[0],
      ...u,
    };
    setUsers((prev) => [newUser, ...prev]);

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action: "Create User Profile",
      actor: currentUser?.fullName || "System Admin",
      target: `${u.fullName} (${u.email})`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
    alert("New account created successfully.");
    return true;
  };

  const handleEditUser = (id: string, u: any): boolean => {
    setUsers((prev) =>
      prev.map((usr) => (usr.id === id ? { ...usr, ...u } : usr)),
    );

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action: "Update User Profile",
      actor: currentUser?.fullName || "System Admin",
      target: `${u.fullName} (${u.email})`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
    alert("User account details stored successfully.");
    return true;
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;
    setUsers((prev) => prev.filter((usr) => usr.id !== id));

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action: "Delete User Account",
      actor: currentUser?.fullName || "System Admin",
      target: `${targetUser.fullName} (${targetUser.email})`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
    alert("User account deleted.");
  };

  const handleToggleLockUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;
    const nextStatus = targetUser.status === "Locked" ? "Active" : "Locked";
    setUsers((prev) =>
      prev.map((usr) => (usr.id === id ? { ...usr, status: nextStatus } : usr)),
    );

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action:
        nextStatus === "Locked" ? "Lock User Account" : "Unlock User Account",
      actor: currentUser?.fullName || "System Admin",
      target: `${targetUser.fullName} (${targetUser.email})`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
    alert(`Account access status updated to: ${nextStatus}`);
  };

  const handleAssignRole = (userId: string, newRole: Role) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    setUsers((prev) =>
      prev.map((usr) => (usr.id === userId ? { ...usr, role: newRole } : usr)),
    );

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action: "Assign Role Credentials",
      actor: currentUser?.fullName || "System Admin",
      target: `${targetUser.fullName} assigned to ${newRole}`,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
  };

  const handleSaveConfig = (updated: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...updated }));

    const log: AdminActivity = {
      id: `ACT-${Date.now()}`,
      action: "Configure system settings",
      actor: currentUser?.fullName || "System Admin",
      target: "Stored global configurations",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAdminActivities((prev) => [log, ...prev]);
  };

  // Stats calculation
  const publicStats = {
    total: slots.length,
    available: slots.filter((s) => s.status === "Available").length,
    occupied: slots.filter((s) => s.status === "Occupied").length,
    reserved: slots.filter((s) => s.status === "Reserved").length,
  };

  const unpaidTotal = payments
    .filter((p) => p.status === "Unpaid")
    .reduce((acc, p) => acc + p.totalAmount, 0);
  const upcomingRes = reservations.find(
    (r) => r.status === "Confirmed" || r.status === "Pending",
  );

  const getDriverPortalTitle = (view: string) => {
    switch (view) {
      case "myparking":
        return "Trang của tôi";
      case "session":
        return "Lượt gửi hiện tại";
      case "reservations":
        return "Đặt chỗ của tôi";
      case "payments":
        return "Thanh toán";
      case "feedback":
        return "Phản hồi / Hỗ trợ";
      case "profile":
        return "Hồ sơ";
      default:
        return "Trang của tôi";
    }
  };

  // Page layout renderer wrapper
  const renderPortalLayout = () => {
    const themeShellClass = interfaceMode === "dark" ? "theme-dark" : "";

    if (currentUser === null) {
      // Guest public navigation bar flow
      return (
        <div
          className={`min-h-screen bg-slate-50/50 flex flex-col justify-between ${themeShellClass}`}
        >
          <div>
            <PublicNavbar
              currentView={currentView}
              setView={setView}
              user={null}
              onLogout={handleLogout}
            />
            <main
              className={
                ["home", "info", "pricing", "contact"].includes(currentView)
                  ? ""
                  : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
              }
            >
              {currentView === "home" && (
                <Homepage setView={setView} stats={publicStats} />
              )}
              {currentView === "info" && (
                <ParkingInformation setView={setView} />
              )}
              {currentView === "slots" && (
                <AvailableSlotsPage
                  setView={setView}
                  slots={slots}
                  isLoggedIn={false}
                  currentUser={currentUser}
                  savedVehicles={savedVehicles}
                  systemConfig={systemConfig}
                  onAddReservation={handleAddReservation}
                  reservations={reservations}
                />
              )}
              {currentView === "pricing" && (
                <PricingRulesPage setView={setView} />
              )}
              {currentView === "pricing-detail" && (
                <PricingDetail setView={setView} />
              )}
              {currentView === "contact" && <ContactPage />}
              {currentView === "login" && (
                <LoginPage
                  onLogin={handleLogin}
                  setView={setView}
                  users={users}
                />
              )}
              {currentView === "register" && (
                <RegisterPage
                  onRegister={handleRegister}
                  setView={setView}
                  users={users}
                />
              )}
            </main>
          </div>
          <Footer />
        </div>
      );
    }

    if (currentUser.role === "System Administrator") {
      // Administrative dashboard flow
      return (
        <div
          className={`min-h-screen bg-slate-50/50 pl-64 flex flex-col justify-between ${themeShellClass}`}
        >
          <AdminSidebar
            currentView={currentView}
            setView={setView}
            onLogout={handleLogout}
            user={currentUser}
          />
          <div>
            <Topbar user={currentUser} title="Administrator Console Panel" />
            <main className="p-6">
              {currentView === "admindashboard" && (
                <AdminDashboard
                  systemConfig={systemConfig}
                  adminActivities={adminActivities}
                  users={users}
                  roles={rolesList}
                  slots={slots}
                  reservations={reservations}
                  payments={payments}
                />
              )}
              {currentView === "usermanagement" && (
                <UserManagement
                  users={users}
                  onCreateUser={handleCreateUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onToggleLockUser={handleToggleLockUser}
                  activeAdminEmail={currentUser.email}
                />
              )}
              {currentView === "rolemanagement" && (
                <RoleManagement
                  users={users}
                  onAssignRole={handleAssignRole}
                  activeAdminEmail={currentUser.email}
                />
              )}
              {currentView === "systemconfig" && (
                <SystemConfiguration
                  systemConfig={systemConfig}
                  onSaveConfig={handleSaveConfig}
                  onPreviewThemeChange={(mode) => {
                    setInterfaceMode(mode);
                    document.documentElement.setAttribute("data-theme", mode);
                  }}
                />
              )}
            </main>
          </div>
          <footer className="border-t border-slate-100/60 bg-white py-4 text-center text-[10px] text-slate-400">
            System Console Panel • Built on React & Tailwind CSS
          </footer>
        </div>
      );
    }

    if (currentUser.role === "Parking Manager") {
      // Manager dashboard flow - all manager pages handled by ManagerDashboard component
      return (
        <div className={themeShellClass}>
          <ManagerDashboard
            slots={slots}
            payments={payments}
            reservations={reservations}
            users={users}
            setView={setView}
            currentView={currentView}
            floors={floors}
            areas={areas}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        </div>
      );
    }

    if (currentUser.role === "Parking User / Driver") {
      // Driver member portal flow - integrated directly into public site style
      return (
        <div
          className={`min-h-screen bg-slate-50/50 flex flex-col justify-between ${themeShellClass}`}
        >
          <div>
            <PublicNavbar
              currentView={currentView}
              setView={setView}
              user={currentUser}
              onLogout={handleLogout}
            />
            <main
              className={
                ["home", "info", "pricing", "contact"].includes(currentView)
                  ? ""
                  : "mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8"
              }
            >
              {/* Public Pages */}
              {currentView === "home" && (
                <Homepage setView={setView} stats={publicStats} />
              )}
              {currentView === "info" && (
                <ParkingInformation setView={setView} />
              )}
              {currentView === "slots" && (
                <AvailableSlotsPage
                  setView={setView}
                  slots={slots}
                  isLoggedIn={true}
                  currentUser={currentUser}
                  savedVehicles={savedVehicles}
                  systemConfig={systemConfig}
                  onAddReservation={handleAddReservation}
                  reservations={reservations}
                />
              )}
              {currentView === "pricing" && (
                <PricingRulesPage setView={setView} />
              )}
              {currentView === "pricing-detail" && (
                <PricingDetail setView={setView} />
              )}
              {currentView === "contact" && <ContactPage />}

              {/* Driver-Specific Pages with a standard profile layout */}
              {[
                "myparking",
                "session",
                "reservations",
                "payments",
                "feedback",
                "profile",
              ].includes(currentView) && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)]">
                  {/* Driver Portal Navigation Menu Card */}
                  <div className="xl:min-w-0">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="mb-5 flex items-center gap-3 border-b border-slate-50 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                          {currentUser.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {currentUser.fullName}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                            Cổng người dùng
                          </span>
                        </div>
                      </div>
                      <nav className="space-y-1">
                        {[
                          { key: "myparking", label: "Trang của tôi" },
                          { key: "session", label: "Lượt gửi hiện tại" },
                          { key: "reservations", label: "Đặt chỗ của tôi" },
                          { key: "feedback", label: "Phản hồi / Hỗ trợ" },
                          { key: "profile", label: "Hồ sơ" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => setView(item.key)}
                            className={`flex w-full items-center rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                              currentView === item.key
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-850"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center rounded-xl px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Đăng xuất
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Right Side Content Panel */}
                  <div className="min-w-0">
                    {currentView === "myparking" && (
                      <MyParking
                        user={currentUser}
                        setView={setView}
                        currentSession={currentSession}
                        upcomingRes={upcomingRes}
                        unpaidTotal={unpaidTotal}
                        feedbacks={feedbacks}
                        savedVehicles={savedVehicles}
                      />
                    )}
                    {currentView === "session" && (
                      <CurrentSessionPage
                        currentSession={currentSession}
                        setView={setView}
                        onCheckOutSession={handleCheckOutSession}
                        pricingRules={mockPricingRules}
                        currentUser={currentUser}
                        slots={slots}
                        payments={payments}
                      />
                    )}
                    {currentView === "reservations" && (
                      <MyReservations
                        reservations={reservations}
                        onAddReservation={handleAddReservation}
                        onCancelReservation={handleCancelReservation}
                        floors={floors}
                        areas={areas}
                        slots={slots}
                        driverStatus={currentUser.status}
                        savedVehicles={savedVehicles}
                        systemConfig={systemConfig}
                        onCheckInReservation={handleCheckInReservation}
                        onExpireReservation={handleExpireReservation}
                        setView={setView}
                        currentUser={currentUser}
                        currentSession={currentSession}
                      />
                    )}
                    {currentView === "feedback" && (
                      <FeedbackPage
                        feedbacks={feedbacks}
                        onSubmitFeedback={handleSubmitFeedback}
                      />
                    )}
                    {currentView === "profile" && (
                      <ProfilePage
                        user={currentUser}
                        savedVehicles={savedVehicles}
                        onUpdateUser={handleUpdateProfile}
                        onAddVehicle={handleAddVehicle}
                      />
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-center text-xs">
        <div className="bg-white p-6 rounded-2xl shadow border max-w-sm">
          <h4 className="font-bold text-slate-800">Phân quyền không hợp lệ</h4>
          <p className="text-slate-400 mt-1">
            Tài khoản này chưa được cấp đúng quyền để đăng nhập.
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-xl bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-850"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-800 antialiased font-sans">
      {renderPortalLayout()}

      {/* Floating custom toast popup notifications */}
      <div className="fixed top-20 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl p-4 shadow-xl border text-xs font-bold text-white transition-all duration-300 transform translate-y-0 animate-slide-in-right ${
              toast.type === "success"
                ? "bg-emerald-600 border-emerald-500"
                : toast.type === "error"
                  ? "bg-rose-600 border-rose-500"
                  : "bg-slate-800 border-slate-700"
            }`}
          >
            {toast.type === "success" && (
              <svg
                className="h-5 w-5 shrink-0 text-emerald-100 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg
                className="h-5 w-5 shrink-0 text-rose-100 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {toast.type === "info" && (
              <svg
                className="h-5 w-5 shrink-0 text-slate-100 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}

            <div className="flex-1 leading-snug whitespace-pre-line">
              {toast.message}
            </div>

            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="ml-1 hover:opacity-80 focus:outline-none cursor-pointer shrink-0"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
=======
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import BookingPage from './components/BookingPage';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import DashboardView from './components/DashboardView';
import Footer from './components/Footer';
import Notification from './components/Notification';
import InfoModal from './components/InfoModal';

export default function App() {
  const [session, setSession] = React.useState<{ name: string; email: string } | null>(null);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error' | 'info'; message: string; visible: boolean }>({ type: 'success', message: '', visible: false });
  const [modal, setModal] = React.useState({ isOpen: false, title: '', content: '' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type, visible: true });
  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));
  const handleShowModal = (title, content) => setModal({ isOpen: true, title, content });
  const handleCloseModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  // Đăng ký
  const handleRegisterSuccess = async (data) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Không thể tạo tài khoản trên máy chủ');
      showToast(`Chúc mừng ${resData.user.fullName}! Đăng ký tài khoản ParkFlow thành công.`, 'success');
      setSession({ name: resData.user.fullName, email: resData.user.email });
      setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
    } catch (error) {
      showToast(error.message || 'Mất kết nối với máy chủ Express', 'error');
    }
  };
  // Đăng nhập
  const handleLoginSuccess = async (data) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Mật khẩu hoặc thông tin tài khoản không chính xác');
      showToast(resData.message || 'Đăng nhập thành công! Đang đồng bộ hóa dữ liệu bãi xe...', 'success');
      setSession({ name: resData.user.fullName, email: resData.user.email });
      setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
    } catch (error) {
      showToast(error.message || 'Mất kết nối với máy chủ Express', 'error');
    }
  };
  const handleLogActiveSessionOut = () => {
    setSession(null);
    showToast('Đã đăng xuất an toàn khỏi tài khoản ParkFlow.', 'info');
    window.location.href = '/dang-nhap';
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#f4f7fc] text-gray-800 font-sans flex flex-col justify-between">
        {/* Navbar luôn hiển thị, có thể sửa lại để ẩn ở dashboard nếu muốn */}
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-20 pb-10 px-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/bang-gia" element={<PricingPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/dat-cho" element={<BookingPage />} />
            <Route path="/dang-nhap" element={<LoginView onSuccess={handleLoginSuccess} onNavigateToRegister={() => { window.location.href = '/dang-ky'; }} onShowModal={handleShowModal} />} />
            <Route path="/dang-ky" element={<RegisterView onSuccess={handleRegisterSuccess} onNavigateToLogin={() => { window.location.href = '/dang-nhap'; }} onShowModal={handleShowModal} />} />
            <Route path="/dashboard" element={session ? <DashboardView userSession={session} onLogOut={handleLogActiveSessionOut} /> : <LoginView onSuccess={handleLoginSuccess} onNavigateToRegister={() => { window.location.href = '/dang-ky'; }} onShowModal={handleShowModal} />} />
          </Routes>
        </main>
        <Footer onShowModal={handleShowModal} />
        <Notification type={toast.type} message={toast.message} visible={toast.visible} onClose={closeToast} />
        <InfoModal isOpen={modal.isOpen} title={modal.title} content={modal.content} onClose={handleCloseModal} />
      </div>
    </Router>
>>>>>>> 344a747c9562c30e6e5b6d29f6b2b91e3e69baf3
  );
}
