import React, { useState } from 'react';
import { ParkingCircle } from 'lucide-react';
import { User, validateEmail, validateRequired } from '../../data/mockData';
import FormInput from '../../components/FormInput';

export default function Login({ onLogin, setView, users }: {
  onLogin: (user: User) => void;
  setView: (view: string) => void;
  users: User[];
}) {
  const [email, setEmail] = useState('driver@example.com');
  const [password, setPassword] = useState('123456');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) tempErrors.email = emailErr;

    const passErr = validateRequired(password, 'Mật khẩu');
    if (passErr) tempErrors.password = passErr;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const matched = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (!matched) {
      setErrors({ email: 'Không tìm thấy tài khoản nào khớp với email này.' });
      return;
    }

    const expectedPassword = matched.password || '123456';
    if (password !== expectedPassword && password !== 'password') {
      setErrors({ password: 'Mật khẩu bạn nhập không chính xác.' });
      return;
    }

    if (matched.status === 'Locked') {
      setErrors({ email: 'Tài khoản này đã bị khóa. Vui lòng liên hệ hỗ trợ.' });
      return;
    }

    if (matched.status === 'Inactive') {
      setErrors({ email: 'Tài khoản này đang tạm ngưng. Vui lòng kích hoạt để tiếp tục.' });
      return;
    }

    setErrors({});
    onLogin(matched);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-md">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ParkingCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Đăng nhập vào ParkFlow</h2>
          <p className="text-xs text-slate-400">Thông tin vai trò và quyền truy cập sẽ được nạp tự động.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="Địa chỉ email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="driver@example.com"
          />
          <FormInput
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
          />

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition"
            >
              Đăng nhập
            </button>
          </div>
        </form>

        <div className="text-center text-xs space-y-2 text-slate-500 pt-2">
          <p>
            Chưa có tài khoản?{' '}
            <button onClick={() => setView('register')} className="text-blue-600 font-bold hover:underline">
              Tạo tài khoản
            </button>
          </p>
          <button onClick={() => setView('home')} className="text-xs text-slate-400 hover:text-slate-600 block mx-auto pt-2">
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
