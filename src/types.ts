/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppMode = 'login' | 'register';

export interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  plateNumber: string;
  vehicleType: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export interface LoginForm {
  identifier: string; // Phone number or Plate number
  password: string;
  rememberMe: boolean;
}

export interface FormErrors {
<<<<<<< HEAD
  general?: string;
=======
>>>>>>> 344a747c9562c30e6e5b6d29f6b2b91e3e69baf3
  fullName?: string;
  email?: string;
  phone?: string;
  plateNumber?: string;
  vehicleType?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
  identifier?: string;
}

export interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
}

export interface VehicleOption {
  value: string;
  label: string;
  icon: string;
}
