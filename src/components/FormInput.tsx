import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormInput({ label, error, type = 'text', ...props }: any) {
  // Password fields get a built-in show/hide toggle.
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:ring-1 ${isPassword ? 'pr-10' : ''} ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="block text-[10px] font-semibold text-rose-500">{error}</span>}
    </div>
  );
}
