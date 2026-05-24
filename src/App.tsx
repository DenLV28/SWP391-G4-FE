/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppMode, RegisterForm, LoginForm, NotificationState } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RegisterView from './components/RegisterView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import Notification from './components/Notification';
import InfoModal from './components/InfoModal';

export default function App() {
  // Navigation states
  const [mode, setMode] = useState<AppMode | 'dashboard'>('login');
  
  // Simulated user session
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);

  // Global notification toast state
  const [toast, setToast] = useState<NotificationState>({
    type: 'success',
    message: '',
    visible: false
  });

  // Modal display states
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    content: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      message,
      type,
      visible: true
    });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleShowModal = (title: string, content: string) => {
    setModal({
      isOpen: true,
      title,
      content
    });
  };

  const handleCloseModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Submit handlings
  const handleRegisterSuccess = async (data: RegisterForm) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          plateNumber: data.plateNumber,
          vehicleType: data.vehicleType,
          password: data.password
        }),
      });
      
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Không thể tạo tài khoản trên máy chủ');
      }

      // Show success notice from server response
      showToast(`Chúc mừng ${resData.user.fullName}! Đăng ký tài khoản ParkFlow thành công.`, 'success');
      
      // Update session with correct data stored in Node.js memory
      setSession({
        name: resData.user.fullName,
        email: resData.user.email
      });
      
      // Smooth transition to dashboard to showcase simulated parking panel!
      setTimeout(() => {
        setMode('dashboard');
      }, 1500);
    } catch (error: any) {
      showToast(error.message || 'Mất kết nối với máy chủ Express', 'error');
    }
  };

  const handleLoginSuccess = async (data: LoginForm) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Mật khẩu hoặc thông tin tài khoản không chính xác');
      }

      showToast(resData.message || 'Đăng nhập thành công! Đang đồng bộ hóa dữ liệu bãi xe...', 'success');
      
      setSession({
        name: resData.user.fullName,
        email: resData.user.email
      });

      setTimeout(() => {
        setMode('dashboard');
      }, 1500);
    } catch (error: any) {
      showToast(error.message || 'Mất kết nối với máy chủ Express', 'error');
    }
  };

  const handleLogActiveSessionOut = () => {
    setSession(null);
    setMode('login');
    showToast('Đã đăng xuất an toàn khỏi tài khoản ParkFlow.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-gray-800 font-sans flex flex-col justify-between">
      
      {/* Top Header Navigation (Hidden if inside active dashboard container to save spacing) */}
      {mode !== 'dashboard' && (
        <Navbar 
          currentMode={mode as AppMode} 
          onModeChange={(newMode) => setMode(newMode)} 
        />
      )}

      {/* Main Container Layout */}
      <main className={`flex-1 flex items-center justify-center ${mode !== 'dashboard' ? 'pt-28 pb-10 px-4' : 'pt-4'}`}>
        {mode === 'register' && (
          <RegisterView 
            onSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setMode('login')}
            onShowModal={handleShowModal}
          />
        )}

        {mode === 'login' && (
          <LoginView
            onSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setMode('register')}
            onShowModal={handleShowModal}
          />
        )}

        {mode === 'dashboard' && session && (
          <DashboardView
            userSession={session}
            onLogOut={handleLogActiveSessionOut}
          />
        )}
      </main>

      {/* Bottom Footer Section */}
      <Footer onShowModal={handleShowModal} />

      {/* Elegant Floating Notification popup banner */}
      <Notification
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={closeToast}
      />

      {/* Beautiful modal sheet for legals / info */}
      <InfoModal
        isOpen={modal.isOpen}
        title={modal.title}
        content={modal.content}
        onClose={handleCloseModal}
      />
    </div>
  );
}
