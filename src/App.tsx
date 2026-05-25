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
  );
}
