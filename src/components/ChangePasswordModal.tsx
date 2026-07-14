import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-[15px] outline-none transition focus:border-[#1f67db] focus:ring-2 focus:ring-[#1f67db]/10"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ isOpen, onClose, onSubmit }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError('');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!currentPassword) { setError('Vui lòng nhập mật khẩu hiện tại.'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
    if (newPassword === currentPassword) { setError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }

    setError('');
    setSaving(true);
    const result = await onSubmit(currentPassword, newPassword);
    setSaving(false);
    if (result.ok) {
      reset();
      onClose();
    } else {
      setError(result.error || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff5ff] text-[#1f67db]">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900">Đổi mật khẩu</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <PasswordField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent((v) => !v)}
            autoFocus
          />

          <div className="border-t border-slate-100 pt-4">
            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNew}
              onToggleVisible={() => setShowNew((v) => !v)}
            />
            <p className="mt-1.5 text-[12px] text-slate-400">Cần ít nhất 6 ký tự, khác với mật khẩu hiện tại.</p>
          </div>

          <PasswordField
            label="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((v) => !v)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="rounded-xl bg-[#1f67db] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#1a56ba] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
