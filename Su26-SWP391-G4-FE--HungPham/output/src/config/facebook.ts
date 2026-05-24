/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * =====================================================
 *   HƯỚNG DẪN CÀI ĐẶT FACEBOOK LOGIN CHO PARKFLOW
 * =====================================================
 * 
 * Bước 1: Tạo Facebook App tại https://developers.facebook.com/
 *   1. Đăng nhập vào Facebook Developer Account
 *   2. Nhấn "Create App" → chọn "Consumer" → Next
 *   3. Đặt tên app (VD: "ParkFlow") → Create App
 *   4. Trong Dashboard, chọn "Facebook Login" → Set Up
 *   5. Chọn "Web" → nhập Site URL: http://localhost:5173 (dev) hoặc domain production
 * 
 * Bước 2: Cấu hình OAuth Settings
 *   1. Vào Settings → Basic → lấy App ID
 *   2. Vào Facebook Login → Settings:
 *      - Valid OAuth Redirect URIs: http://localhost:5173/
 *      - Bật "Login with JavaScript SDK"
 *      - Allowed Domains: localhost (dev), your-domain.com (prod)
 * 
 * Bước 3: Thay đổi App ID
 *   - Mở file index.html
 *   - Thay 'YOUR_FACEBOOK_APP_ID' bằng App ID thật từ Facebook Developer Console
 *   - Hoặc set window.__FB_APP_ID__ trong environment config
 * 
 * Bước 4: Backend API (tùy chọn nhưng khuyến khích)
 *   - Tạo endpoint POST /api/auth/facebook
 *   - Nhận accessToken từ client
 *   - Gọi Facebook Graph API để xác thực token server-side
 *   - Tạo/tìm user trong database
 *   - Trả về JWT token hoặc session
 * 
 * Bước 5: Go Live
 *   1. Vào App Review trong Facebook Developer Console
 *   2. Chuyển App Mode từ "Development" sang "Live"
 *   3. Cần verify business (nếu yêu cầu)
 *   4. Request permissions: public_profile, email
 */

// Facebook App Configuration
export const FACEBOOK_CONFIG = {
  // ⚠️ THAY ĐỔI APP_ID NÀY BẰNG APP ID THẬT CỦA BẠN
  APP_ID: 'YOUR_FACEBOOK_APP_ID',
  
  // API version
  API_VERSION: 'v21.0',
  
  // Permissions to request
  SCOPES: ['public_profile', 'email'],
  
  // Fields to fetch from user profile
  PROFILE_FIELDS: 'id,name,email,picture.width(200).height(200)',
};

export default FACEBOOK_CONFIG;
