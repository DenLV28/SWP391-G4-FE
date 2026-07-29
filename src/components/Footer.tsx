<<<<<<< HEAD
import React from 'react';

export default function Footer() {
  return (
    <footer className="public-footer border-t py-8">
      <div className="mx-auto flex max-w-[1460px] flex-col gap-4 px-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold tracking-tight text-[#1f67db]">ParkFlow</span>
        </div>

        <p className="text-center text-[14px] lg:text-left">© 2024 ParkFlow Management System. All rights reserved.</p>

        <div className="flex items-center justify-center gap-8 text-[14px] lg:justify-end">
          <a href="#" className="transition hover:text-[#1f67db]">
            Điều khoản
          </a>
          <a href="#" className="transition hover:text-[#1f67db]">
            Bảo mật
          </a>
          <a href="#" className="transition hover:text-[#1f67db]">
=======
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FooterProps {
  onShowModal: (title: string, content: string) => void;
}

export default function Footer({ onShowModal }: FooterProps) {
  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowModal(
      'Điều khoản dịch vụ',
      'Chào mừng bạn đến với ParkFlow. Khi sử dụng hệ thống quản lý bãi xe thông minh của chúng tôi, bạn đồng ý tuân thủ các quy định bảo mật, quản lý luồng đỗ xe hợp pháp, không lưu trữ thông tin trái phép và chịu trách nhiệm bảo mật thông tin tài khoản cá nhân. ParkFlow cam kết cung cấp dịch vụ quản lý bãi xe đạt uptime 99.9%.'
    );
  };

  const handleOpenPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowModal(
      'Chính sách bảo mật',
      'Chính sách bảo mật của ParkFlow quy định cách thức chúng tôi thu thập biển số xe, số điện thoại, mật khẩu mã hóa một chiều (hashing). Chúng tôi cam kết tuyệt đối không chia sẻ dữ liệu đỗ xe của bãi xe sang bất kỳ bên thứ ba nào khi chưa được đồng ý bằng văn bản.'
    );
  };

  const handleOpenSupport = (e: React.MouseEvent) => {
    e.preventDefault();
    onShowModal(
      'Trợ giúp & Liên hệ',
      'Nếu bạn có bất kỳ thắc mắc hoặc sự cố kỹ thuật nào trong quá trình thiết lập bãi đỗ xe thông minh ParkFlow, vui lòng gửi email tới support@parkflow.vn hoặc liên hệ ngay hotline khẩn cấp 1900 6789 để được hỗ trợ 24/7.'
    );
  };

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-100 py-6 px-8 mt-12 text-xs text-gray-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span>ParkFlow | © 2026 ParkFlow Management System. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a
            href="#terms"
            onClick={handleOpenTerms}
            className="hover:text-park-blue-600 hover:underline transition-all"
          >
            Điều khoản
          </a>
          <a
            href="#privacy"
            onClick={handleOpenPrivacy}
            className="hover:text-park-blue-600 hover:underline transition-all"
          >
            Bảo mật
          </a>
          <a
            href="#support"
            onClick={handleOpenSupport}
            className="hover:text-park-blue-600 hover:underline transition-all"
          >
>>>>>>> 344a747c9562c30e6e5b6d29f6b2b91e3e69baf3
            Trợ giúp
          </a>
        </div>
      </div>
    </footer>
  );
}
