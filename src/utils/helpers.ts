/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utility helper functions
 */

import type { VehicleKey, Floor } from '../types/parking';
import { vehicleTypes } from '../data/mockData';

/**
 * Format currency in VND
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Get vehicle label by key
 */
export const getVehicleLabel = (key: VehicleKey): string =>
  vehicleTypes.find(vehicle => vehicle.key === key)?.label ?? key;

/**
 * Calculate total stats from floors
 */
export const getTotalStats = (items: Floor[]) =>
  items.reduce(
    (acc, floor) => ({
      totalSlots: acc.totalSlots + floor.totalSlots,
      availableSlots: acc.availableSlots + floor.availableSlots,
      occupiedSlots: acc.occupiedSlots + floor.occupiedSlots,
      reservedSlots: acc.reservedSlots + floor.reservedSlots,
    }),
    { totalSlots: 0, availableSlots: 0, occupiedSlots: 0, reservedSlots: 0 },
  );

/**
 * Calculate duration between two times in hours
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

/**
 * Calculate parking duration from check-in time to now
 */
export const calculateParkingDuration = (checkInTime: string): { hours: number; minutes: number } => {
  const checkIn = new Date(checkInTime);
  const now = new Date();
  
  const diffMs = now.getTime() - checkIn.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return {
    hours: Math.floor(diffMinutes / 60),
    minutes: diffMinutes % 60,
  };
};

/**
 * Format duration for display
 */
export const formatDuration = (hours: number, minutes: number): string => {
  if (hours === 0) {
    return `${minutes} minutes`;
  }
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours}h ${minutes}m`;
};

/**
 * Generate ticket code
 */
export const generateTicketCode = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
  return `PK-${date}-${time}`;
};

/**
 * Generate reservation code
 */
export const generateReservationCode = (): string => {
  return `RSV-${String(Date.now()).slice(-6)}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format datetime for display
 */
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current time in HH:MM format
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

/**
 * Check if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if time is in the past for today
 */
export const isPastTime = (timeString: string, dateString: string): boolean => {
  const today = getTodayDate();
  if (dateString !== today) {
    return false;
  }
  
  const currentTime = getCurrentTime();
  return timeString < currentTime;
};

/**
 * Calculate estimated cost for reservation
 */
export const calculateReservationCost = (
  vehicleType: VehicleKey,
  duration: number,
  pricingRules: Array<{ vehicleType: VehicleKey; hourlyRate: number; dailyRate: number }>
): number => {
  const pricing = pricingRules.find(rule => rule.vehicleType === vehicleType);
  if (!pricing) return 0;
  
  // If duration >= 8 hours, use daily rate
  if (duration >= 8) {
    return pricing.dailyRate;
  }
  
  // Otherwise, use hourly rate
  return Math.ceil(duration) * pricing.hourlyRate;
};
