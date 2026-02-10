function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

interface FinancialItem {
  value: number
  created_at: string
}

interface MonthlyHistory {
  month: string
  monthIndex: number
  year: number
  dateLabel: string
  revenue: number
  expense: number
  fullDate: Date
}

/**
 * Gera o histórico financeiro dos últimos 12 meses,
 * agrupando receitas e despesas por mês.
 */
export function buildFinancialHistory(
  allRevenues: FinancialItem[],
  allExpenses: FinancialItem[]
): MonthlyHistory[] {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1)
  const startDateISO = startDate.toISOString()

  const revenues = allRevenues.filter(item => item.created_at >= startDateISO)
  const expenses = allExpenses.filter(item => item.created_at >= startDateISO)

  // Inicializar mapa com os 12 meses (garante que meses zerados apareçam)
  const historyMap = new Map<string, MonthlyHistory>()

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
    const year = d.getFullYear()
    const monthIndex = d.getMonth()
    const key = `${year}-${monthIndex}`

    const monthName = new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
    }).format(d)

    historyMap.set(key, {
      month: capitalizeFirstLetter(monthName),
      monthIndex: monthIndex + 1,
      year,
      dateLabel: `${String(monthIndex + 1).padStart(2, '0')}/${year}`,
      revenue: 0,
      expense: 0,
      fullDate: d,
    })
  }

  // Somar receitas
  for (const item of revenues) {
    const d = new Date(item.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const entry = historyMap.get(key)
    if (entry) entry.revenue += Number(item.value)
  }

  // Somar despesas
  for (const item of expenses) {
    const d = new Date(item.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const entry = historyMap.get(key)
    if (entry) entry.expense += Number(item.value)
  }

  return Array.from(historyMap.values())
}
