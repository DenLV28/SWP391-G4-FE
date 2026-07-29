import React from 'react';
import { Bell, UserCircle2, Zap } from 'lucide-react';
import { ParkingSession, User } from '../data/mockData';

export default function Topbar({
  user,
  title,
  currentSession,
}: {
  user: User;
  title: string;
  currentSession?: ParkingSession;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-black tracking-tight text-slate-800">{title}</h2>
        {currentSession && currentSession.sessionStatus === 'Active' && (
          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 animate-pulse">
            <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
            Lượt gửi đang hoạt động: {currentSession.ticketCode}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-7 w-[1px] bg-slate-100" />

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-none text-slate-800">{user.fullName}</span>
            <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wider text-blue-600">{user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
