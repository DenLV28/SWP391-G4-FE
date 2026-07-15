import React, { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, ParkingCircle, LayoutDashboard, DollarSign, Settings, ChevronRight, LogOut } from 'lucide-react';
import { User, Slot, Reservation, Payment, Floor, Area } from '../../data/mockData';
import ManagerParkingLots from './ManagerParkingLots';
import ManagerPricingVehicles from './ManagerPricingVehicles';
import ManagerReports from './ManagerReports';
import ManagerExceptions from './ManagerExceptions';

interface ManagerDashboardProps {
  slots: Slot[];
  payments: Payment[];
  reservations: Reservation[];
  users: User[];
  setView: (view: string) => void;
  currentView?: string;
  floors?: Floor[];
  areas?: Area[];
  currentUser?: User;
  onLogout?: () => void;
}

export default function ManagerDashboard({
  slots,
  payments,
  reservations,
  users,
  setView,
  currentView = 'managerdashboard',
  floors = [],
  areas = [],
  currentUser,
  onLogout,
}: ManagerDashboardProps) {
  useEffect(() => {
    // Sync view state with valid manager routes
    if (!['managerdashboard', 'parkinglots', 'pricing-vehicles', 'reports', 'exceptions'].includes(currentView)) {
      setView('managerdashboard');
    }
  }, [currentView, setView]);

  const menuItems = [
    { key: 'managerdashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { key: 'parkinglots', label: 'Quản lý bãi đỗ', icon: ParkingCircle },
    { key: 'pricing-vehicles', label: 'Giá & loại xe', icon: DollarSign },
    { key: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { key: 'exceptions', label: 'Ngoại lệ', icon: AlertCircle },
  ];

  const handleMenuClick = (menuKey: string) => {
    setView(menuKey);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'parkinglots':
        return <ManagerParkingLots floors={floors} areas={areas} slots={slots} setView={setView} />;
      case 'pricing-vehicles':
        return <ManagerPricingVehicles setView={setView} />;
      case 'reports':
        return <ManagerReports setView={setView} />;
      case 'exceptions':
        return <ManagerExceptions setView={setView} />;
      default:
        return <DashboardContent slots={slots} payments={payments} reservations={reservations} users={users} />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col overflow-y-auto z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <ParkingCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">Manager Portal</h1>
            <p className="text-xs text-slate-400">Parking System</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="px-3 py-6 border-t border-slate-700 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200">
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Cài đặt</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manager Portal</h2>
              <p className="text-sm text-slate-500 mt-1">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            {currentUser && (
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {currentUser.fullName?.charAt(0) || 'M'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{currentUser.fullName || 'Manager'}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">{renderContent()}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-8 text-center text-xs text-slate-500">
          <p>Manager Portal • Parking Management System v1.0 • © 2026</p>
        </footer>
      </div>
    </div>
  );
}

function DashboardContent({
  slots,
  payments,
  reservations,
  users,
}: {
  slots: Slot[];
  payments: Payment[];
  reservations: Reservation[];
  users: User[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng khe đỗ" value={slots.length.toString()} />
        <StatCard title="Khe available" value={slots.filter((s) => s.status === 'Available').length.toString()} />
        <StatCard title="Khe reserved" value={slots.filter((s) => s.status === 'Reserved').length.toString()} />
        <StatCard title="Tổng người dùng" value={users.length.toString()} />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Thống kê cơ bản</h3>
        <p className="text-slate-600">Chọn mục từ menu bên trái để xem chi tiết</p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <p className="text-sm text-slate-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
