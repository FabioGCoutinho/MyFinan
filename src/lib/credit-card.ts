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
  // Fim do período: dia do fechamento do mês de referência
  const end = new Date(year, month, closingDay, 23, 59, 59, 999)

  // Início do período: dia seguinte ao fechamento do mês anterior
  const startMonth = month === 0 ? 11 : month - 1
  const startYear = month === 0 ? year - 1 : year
  const start = new Date(startYear, startMonth, closingDay + 1, 0, 0, 0, 0)

  return { start, end }
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
