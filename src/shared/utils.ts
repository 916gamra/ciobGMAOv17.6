import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EMPTY_ARRAY: any[] = [];
export const EMPTY_OBJECT: Record<string, any> = {};
