import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(value: number): string {
  return `\u20a9 ${Math.round(value).toLocaleString('ko-KR')}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number, maxFractionDigits = 8): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: maxFractionDigits });
}
