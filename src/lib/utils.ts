import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCurrencyCompact(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3},)/g, "");
  const normalized = cleaned.replace(",", ".");
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MONTH_SHORT_NAMES = MONTH_NAMES.map((m) => m.slice(0, 3));

export function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function monthLabelShort(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)}/${String(date.getFullYear()).slice(2)}`;
}

export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function fromMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
