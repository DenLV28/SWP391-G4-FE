/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FacebookLoginButton - Real Facebook OAuth login button for ParkFlow
 */

import React from 'react';

interface FacebookLoginButtonProps {
  onLogin: () => void;
  isProcessing: boolean;
  label?: string;
  className?: string;
}

export default function FacebookLoginButton({ 
  onLogin, 
  isProcessing, 
  label = 'Facebook',
  className = ''
}: FacebookLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogin}
      disabled={isProcessing}
      className={`flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 shadow-xs hover:shadow-sm active:scale-98 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? (
        <>
          <svg className="animate-spin h-4 w-4 text-[#1877F2]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[#1877F2]">Đang kết nối...</span>
        </>
      ) : (
        <>
          {/* Facebook blue icon */}
          <svg className="w-4 h-4 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
