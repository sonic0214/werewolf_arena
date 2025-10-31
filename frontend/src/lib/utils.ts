import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time utilities
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

// Game utilities
export function getRoleColor(role: string): string {
  const colors = {
    werewolf: 'text-red-600 bg-red-50 border-red-200',
    villager: 'text-green-600 bg-green-50 border-green-200',
    seer: 'text-blue-600 bg-blue-50 border-blue-200',
    doctor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  };
  return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getRoleIcon(role: string): string {
  const icons = {
    werewolf: '🐺',
    villager: '👤',
    seer: '🔮',
    doctor: '💉',
  };
  return icons[role as keyof typeof icons] || '❓';
}

export function getStatusColor(status: string): string {
  const colors = {
    alive: 'text-green-600',
    dead: 'text-red-600',
    waiting: 'text-yellow-600',
    running: 'text-blue-600',
    finished: 'text-gray-600',
  };
  return colors[status as keyof typeof colors] || 'text-gray-600';
}

// Array utilities
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

// Local storage utilities
export function getLocalStorage(key: string, defaultValue?: any): any {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

export function setLocalStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// URL utilities
export function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Error handling
export function handleApiError(error: any): string {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Random utilities
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateSessionId(): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const random = Math.random().toString(36).substr(2, 6);
  return `session_${timestamp}_${random}`;
}