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
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const variation = ((current - previous) / previous) * 100
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variation.toFixed(1).replace('.', ',')}%`
}
