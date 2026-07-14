import React, { useEffect, useState } from 'react';
import { Building2, Lock, Mail, Pencil, Phone, ShieldCheck, UserCircle2 } from 'lucide-react';
import type { User } from '../data/mockData';
import { validateEmail, validatePhone, validateRequired } from '../data/mockData';
import ChangePasswordModal from './ChangePasswordModal';
import userService from '../services/userService';

interface Props {
  user: User;
  roleLabel: string;
  locationLabel?: string;
  onUpdateUser: (up: Partial<User>) => Promise<{ ok: boolean; error?: string }>;
}

export default function RoleProfilePage({ user, roleLabel, locationLabel, onUpdateUser }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setPhone(user.phone);
    setEmail(user.email);
  }, [user.id, user.fullName, user.phone, user.email]);

  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: Record<string, string> = {};
    const nameErr = validateRequired(fullName, 'Họ và tên');
    if (nameErr) tempErrors.fullName = nameErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) tempErrors.phone = phoneErr;
    const emailErr = validateEmail(email);
    if (emailErr) tempErrors.email = emailErr;
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const result = await onUpdateUser({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim() });
    setSaving(false);
    if (result.ok) {
      setIsEditing(false);
    } else {
      setErrors({ fullName: result.error || 'Không thể cập nhật thông tin.' });
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const updated = await userService.changePassword(user.id, currentPassword, newPassword);
      await onUpdateUser({ passwordUpdatedAt: updated?.passwordUpdatedAt ?? new Date().toISOString() });
      alert('Đổi mật khẩu thành công.');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Không thể đổi mật khẩu.' };
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Thông tin cá nhân và tài khoản của bạn.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{user.fullName}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-blue-600">
              <ShieldCheck className="h-3.5 w-3.5" /> {roleLabel}
            </p>
            {locationLabel && <p className="mt-0.5 text-xs text-slate-400">{locationLabel}</p>}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Họ và tên</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              {errors.fullName && <p className="mt-1 text-xs font-medium text-rose-600">{errors.fullName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              {errors.phone && <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              {errors.email && <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setErrors({}); setFullName(user.fullName); setPhone(user.phone); setEmail(user.email); }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-slate-50 px-6">
            <div className="flex items-center gap-3 py-3.5">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Email</span>
              <span className="ml-auto text-sm font-semibold text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 py-3.5">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Điện thoại</span>
              <span className="ml-auto text-sm font-semibold text-slate-800">{user.phone || '—'}</span>
            </div>
            {user.assignedParkingLot && (
              <div className="flex items-center gap-3 py-3.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">Bãi xe phụ trách</span>
                <span className="ml-auto text-sm font-semibold text-slate-800">{user.assignedParkingLot}</span>
              </div>
            )}
            <div className="flex items-center gap-3 py-3.5">
              <UserCircle2 className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Ngày tạo tài khoản</span>
              <span className="ml-auto text-sm font-semibold text-slate-800">{user.createdAt || '—'}</span>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Mật khẩu</p>
              <p className="text-xs text-slate-400">
                {user.passwordUpdatedAt ? `Đổi lần cuối: ${new Date(user.passwordUpdatedAt).toLocaleString('vi-VN')}` : 'Chưa từng đổi mật khẩu.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Đổi mật khẩu
          </button>
        </div>
      </section>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
