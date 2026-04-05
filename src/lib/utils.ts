import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatVariation(current: number, previous: number): string {
  if (previous === 0)
    return current > 0 ? '+100%' : current < 0 ? '-100%' : '0%'
  const variation = ((current - previous) / Math.abs(previous)) * 100
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variation.toFixed(1).replace('.', ',')}%`
}

/**
 * Parses a date string ignoring timezone offset.
 * Supabase stores dates like "2026-04-03 00:00:00+00" (UTC).
 * parseISO would create a UTC Date, which in Brazil (UTC-3) becomes April 2nd.
 * This function extracts the date/time parts and creates a local Date instead.
 */
export function parseLocalDate(dateStr: string): Date {
  // Extract just the "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS" part
  const clean = dateStr.replace(' ', 'T').split('+')[0].split('Z')[0]
  const [datePart, timePart] = clean.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  if (timePart) {
    const [hours, minutes, seconds] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0)
  }
  return new Date(year, month - 1, day, 12, 0, 0) // noon to avoid any edge cases
}
