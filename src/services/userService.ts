export interface ParkingUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
}

const API_BASE = import.meta.env.VITE_PARKING_API_URL || 'http://localhost:8084/Parking/api';
const DEFAULT_GIDZL = import.meta.env.VITE_PARKING_API_GIDZL || 'ZXI1G1X4JyBa9E0HQ3IIqaGq4P4eHCjI2HnmQWqBZUHST64xLHh0k6aCP5uj7vI8VJVA0Vsz1mkEGW';

export async function fetchParkingUsers(gidzl: string = DEFAULT_GIDZL): Promise<ParkingUser[]> {
  const url = `${API_BASE}/users?gidzl=${encodeURIComponent(gidzl)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Lỗi khi truy xuất API người dùng: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
