/**
 * Calcula o período de uma fatura com base no mês/ano de referência e o dia de fechamento.
 *
 * Exemplo: closingDay = 8, mês = fev/2026
 * → Período: 09/jan/2026 00:00 até 08/fev/2026 23:59:59
 *
 * A fatura de um mês M contém compras feitas entre:
 *   dia (closingDay + 1) do mês (M - 1)  até  dia closingDay do mês M
 */
export function getInvoicePeriod(
  year: number,
  month: number, // 0-indexed (0 = jan)
  closingDay: number
): { start: Date; end: Date } {
  const end = getDateClamped(year, month, closingDay, 23, 59, 59, 999)

  const previousClosing = getDateClamped(
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1,
    closingDay,
    23,
    59,
    59,
    999
  )
  const start = new Date(previousClosing)
  start.setDate(start.getDate() + 1)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

function getDateClamped(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDayOfMonth)
  return new Date(year, month, clampedDay, hours, minutes, seconds, ms)
}

/**
 * Calcula o período da fatura considerando o mês/ano de VENCIMENTO.
 *
 * Regras:
 * - Se dueDay > closingDay, fechamento acontece no mesmo mês do vencimento.
 * - Se dueDay <= closingDay, fechamento acontece no mês anterior ao vencimento.
 */
export function getInvoicePeriodByDueMonth(
  dueYear: number,
  dueMonth: number,
  closingDay: number,
  dueDay: number
): { start: Date; end: Date } {
  const closingMonthIsPrevious = dueDay <= closingDay
  const closingDate = closingMonthIsPrevious
    ? new Date(dueYear, dueMonth - 1, 1)
    : new Date(dueYear, dueMonth, 1)

  return getInvoicePeriod(
    closingDate.getFullYear(),
    closingDate.getMonth(),
    closingDay
  )
}

export interface CreditCard {
  id: number
  user_id: string
  name: string
  bank: string
  last_digits: string
  brand: string
  due_day: number
  closing_day: number
  created_at: string
}

export interface CreditCardExpense {
  id: number
  user_id: string
  card_id: number
  description: string
  value: number
  category: string
  obs: string
  created_at: string
  updated_at: string
}
