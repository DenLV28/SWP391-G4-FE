import React from 'react';
import { Bell, UserRound } from 'lucide-react';
import { User } from '../data/mockData';

export default function PublicNavbar({
  currentView,
  setView,
  user,
  onLogout: _onLogout,
  brandLabel,
}: {
  currentView: string;
  setView: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  brandLabel?: string;
}) {
  const isDriverUser = user?.role === 'Parking User / Driver';

  const tabs = [
    { key: 'home', label: 'Trang chủ' },
    { key: 'slots', label: 'Đặt chỗ' },
    { key: 'pricing', label: 'Bảng giá' },
    { key: 'contact', label: 'Liên hệ' },
    { key: 'info', label: 'Giới thiệu' },
  ];

  return (
    <nav className="public-nav sticky top-0 z-30 w-full border-b backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[56px] items-center justify-between sm:h-[60px]">
          <button type="button" onClick={() => setView('home')} className="flex items-center text-left">
            <span className="text-[22px] font-extrabold tracking-tight text-[#1a56db]">
              {brandLabel ?? 'ParkFlow'}
            </span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`pb-1 text-[15px] font-medium transition ${
                  currentView === tab.key
                    ? 'border-b-2 border-[#1a56db] text-[#1a56db]'
                    : 'text-slate-600 hover:text-[#1a56db]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  aria-label="Thông báo"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-50 hover:text-[#1a56db]"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                <button
                  type="button"
                  aria-label="Tài khoản"
                  onClick={() => {
                    if (isDriverUser) setView('myparking');
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2d78e5] text-white shadow-[0_8px_16px_rgba(45,120,229,0.24)] transition hover:bg-[#2568cb]"
                >
                  <UserRound className="h-4.5 w-4.5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setView('login')}
                  className="text-[15px] font-medium text-[#1a56db] transition hover:text-blue-800"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setView('register')}
                  className="text-[15px] font-medium text-slate-700 transition hover:text-[#1a56db]"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
