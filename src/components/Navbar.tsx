/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export default function Navbar({ currentMode, onModeChange }: NavbarProps) {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-4 fixed top-0 left-0 z-40 transition-all duration-300 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo ParkFlow */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onModeChange('login')}
        >
          <div className="w-9 h-9 bg-park-blue-600 rounded-lg flex items-center justify-center font-display font-black text-xl text-white shadow-md shadow-park-blue-200 transition-transform group-hover:scale-105">
            P
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-park-blue-900 group-hover:text-park-blue-600 transition-colors">
            ParkFlow
          </span>
        </div>

        {/* Dynamic Action Button */}
        <div className="flex items-center gap-4">
          {currentMode === 'register' ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm hidden sm:inline-block">Đã có tài khoản?</span>
              <button
                onClick={() => onModeChange('login')}
                className="px-4 py-2 border border-park-blue-200 hover:border-park-blue-600 text-park-blue-600 hover:bg-park-blue-50 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95"
              >
                Đăng nhập
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm hidden sm:inline-block">Chưa có tài khoản?</span>
              <button
                onClick={() => onModeChange('register')}
                className="px-4 py-2 bg-park-blue-600 hover:bg-park-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-park-blue-200 transition-all duration-200 active:scale-95"
              >
                Đăng ký ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
