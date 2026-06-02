import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="bg-gray-50 py-10 px-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded mb-2">Smart Parking Rental</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Tìm và thuê chỗ đỗ xe an toàn, tiện lợi</h1>
          <p className="text-gray-600 mb-6">Giải pháp giúp bạn tìm kiếm, đặt chỗ và thanh toán phí gửi xe ngay trên điện thoại. Không còn lo lắng về việc hết chỗ hay thất thoát tiền xe.</p>
          <div className="flex gap-2 mb-2">
            <button onClick={() => navigate('/dat-cho')} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">Tìm chỗ ngay</button>
            <button onClick={() => navigate('/bang-gia')} className="border border-gray-300 px-4 py-2 rounded">Xem Bảng Đồ</button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="rounded-full bg-gray-200 w-6 h-6 flex items-center justify-center">👤</span>
            <span>Hơn 10.000 người dùng đã tìm được chỗ đỗ ưng ý</span>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          <img src="/src/assets/images/xe.jpg" alt="Bãi đỗ xe" className="rounded-xl shadow-lg w-full max-w-md" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
          <img src="/src/assets/images/xe trống.jpg" alt="Tìm vị trí trống" className="rounded mb-2 w-full max-w-xs mx-auto" />
          <h3 className="font-semibold">Tìm vị trí trống tức thì</h3>
          <p className="text-gray-500 text-sm">Xem bản đồ bãi đỗ xe, biết chính xác bãi xe còn chỗ, khoảng cách và giá vé trước khi đến.</p>
        </div>
        <div className="bg-blue-600 text-white rounded-lg shadow p-6 flex flex-col gap-2">
          <span className="text-2xl">💳</span>
          <h3 className="font-semibold">Thanh toán nhanh qua App</h3>
          <p className="text-sm">Quét mã QR để vào/ra và thanh toán tự động qua ví điện tử. Không cần dùng tiền mặt, không phải chờ đợi.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
          <span className="text-blue-600 text-xl">📅</span>
          <h3 className="font-semibold">Quản lý lịch trình gửi xe</h3>
          <p className="text-gray-500 text-sm">Theo dõi lịch sử, đặt gửi xe, gia hạn đăng ký chỗ theo theo tháng dễ dàng ngay trên ứng dụng.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
          <img src="/src/assets/images/an ninh.jpg" alt="Bãi xe an ninh" className="rounded mb-2 w-full max-w-xs mx-auto" />
          <h3 className="font-semibold">Bãi xe an ninh & camera 24/7</h3>
          <p className="text-gray-500 text-sm">Hợp tác với các bãi xe uy tín, trang bị hệ thống nhận diện biển số và AI và camera giám sát toàn diện để bảo vệ tài sản của bạn.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-10 px-4 bg-white">
        <h2 className="text-2xl font-bold text-center mb-8">Bảng giá dịch vụ theo loại xe</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Xe máy */}
          <div className="border rounded-lg p-6 flex-1 flex flex-col items-center bg-gray-50">
            <h4 className="font-semibold mb-2">Xe máy</h4>
            <div className="text-sm text-gray-500 mb-2">Tất cả các dòng xe hai bánh</div>
            <div className="mb-2">Thuê Giờ (0-2h): <span className="font-bold">5.000đ</span></div>
            <div className="mb-2">Theo Tháng: <span className="font-bold">150.000đ</span></div>
            <div className="mb-4">Theo Năm: <span className="font-bold text-blue-600">1.500.000đ</span></div>
            <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded">Thuê ngay</button>
          </div>
          {/* Ô tô 4-7 chỗ */}
          <div className="border-2 border-blue-600 rounded-lg p-6 flex-1 flex flex-col items-center bg-white shadow">
            <h4 className="font-semibold mb-2">Ô tô 4-7 chỗ</h4>
            <div className="text-sm text-gray-500 mb-2">Xe cá nhân, xe gia đình</div>
            <div className="mb-2">Thuê Giờ (0-2h): <span className="font-bold">25.000đ</span></div>
            <div className="mb-2">Theo Tháng: <span className="font-bold">1.200.000đ</span></div>
            <div className="mb-4">Theo Năm: <span className="font-bold text-blue-600">12.000.000đ</span></div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Thuê ngay</button>
          </div>
          {/* Xe tải & Khách */}
          <div className="border rounded-lg p-6 flex-1 flex flex-col items-center bg-gray-50">
            <h4 className="font-semibold mb-2">Xe tải & Khách</h4>
            <div className="text-sm text-gray-500 mb-2">Xe tải & 25-55 chỗ, xe khách</div>
            <div className="mb-2">Thuê Giờ (0-2h): <span className="font-bold">40.000đ</span></div>
            <div className="mb-2">Theo Tháng: <span className="font-bold">2.500.000đ</span></div>
            <div className="mb-4">Theo Năm: <span className="font-bold text-blue-600">25.000.000đ</span></div>
            <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded">Thuê ngay</button>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center mt-4">
          Giá trên đã bao gồm VAT. Đối với dịch vụ gửi xe qua đêm hoặc các loại phương tiện đặc biệt, vui lòng kiểm tra thông tin chi tiết trên ứng dụng.
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4 bg-gradient-to-r from-blue-900 to-blue-600 text-white rounded-lg mx-2 my-8 flex flex-col items-center">
        <h3 className="text-xl font-bold mb-2 text-center">Bạn đã sẵn sàng để gửi xe thông minh hơn?</h3>
        <p className="mb-4 text-center">Đăng ký ngay hôm nay để nhận ưu đãi giảm 50% cho lượt thuê đầu tiên và trải nghiệm dịch vụ gửi xe an toàn nhất.</p>
        <button onClick={() => navigate('/dat-cho')} className="bg-white text-blue-600 px-6 py-2 rounded font-semibold">Đặt ngay</button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-6 px-4 mt-8 border-t">
        <div className="flex flex-col md:flex-row justify-between gap-6 text-xs text-gray-500">
          <div>
            <div className="font-bold text-blue-600 mb-2">ParkFlow</div>
            <div>Nền tảng thuê chỗ gửi xe thông minh hàng đầu Việt Nam, giúp bạn tiết kiệm thời gian và an tâm trong mọi hành trình.</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Dịch vụ</div>
            <div>Tìm chỗ đỗ</div>
            <div>Đặt chỗ theo tháng</div>
            <div>Tài xế đăng nhập</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Về chúng tôi</div>
            <div>Câu chuyện ParkFlow</div>
            <div>Tuyển dụng</div>
            <div>Blog chia sẻ</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Hỗ trợ</div>
            <div>Trung tâm trợ giúp</div>
            <div>Chính sách hoàn tiền</div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 mt-4">© 2024 ParkFlow Parking Rental Service. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default HomePage;
