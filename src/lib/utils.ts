import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-gain";
  if (value < 0) return "text-loss";
  return "text-[#555]";
}

export function actionColor(action: string): string {
  switch (action.toUpperCase()) {
    case "HOLD": return "badge-gain";
    case "WATCH": return "bg-[rgba(255,161,108,0.12)] text-orange border-[rgba(255,161,108,0.2)]";
    case "REDUCE": return "bg-[rgba(255,161,108,0.12)] text-orange border-[rgba(255,161,108,0.2)]";
    case "EXIT": return "badge-loss";
    default: return "bg-[rgba(255,255,255,0.06)] text-[#868F97]";
  }
}
