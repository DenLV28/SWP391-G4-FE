/**
 * Authentication Service
 * Handles API communication for login, register, and authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface LoginCredentials {
  identifier: string; // email or phone
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    isActive: boolean;
    createdAt: string | null;
  };
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  phone: string;
  plateNumber: string;
  vehicleType: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    isActive: boolean;
    createdAt: string | null;
  };
}

export interface ApiError {
  error: string;
}

class AuthService {
  /**
   * Login user with email/phone and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || 'Đăng nhập thất bại');
      }

      return data as LoginResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(errorData.error || 'Đăng ký thất bại');
      }

      return data as RegisterResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Store auth token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  /**
   * Get stored auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Clear auth token on logout
   */
  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }
}

export default new AuthService();
