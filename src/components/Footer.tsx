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
            Trợ giúp
          </a>
        </div>
      </div>
    </footer>
  );
}
