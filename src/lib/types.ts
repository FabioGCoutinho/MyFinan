import type { CreditCard, CreditCardExpense } from '@/lib/credit-card'

// ── Receitas ────────────────────────────────────────────

export interface RevenueItem {
  category: string
  created_at: string
  id: number
  obs: string
  revenue: string
  updated_at: Date
  value: number
}

// ── Despesas ────────────────────────────────────────────

export interface ExpenseItem {
  category: string
  created_at: string
  id: number
  obs: string
  expense: string
  updated_at: Date
  value: number
  is_paid: boolean
}

// ── Dashboard / KPI ─────────────────────────────────────

export interface KpiItem {
  month: string
  year: number
  revenue: number
  expense: number
  monthIndex: number
  dateLabel?: string
  fullDate?: Date
}

// ── Ordenação ───────────────────────────────────────────

export type SortField = 'descricao' | 'categoria' | 'data' | 'valor' | null
export type SortDirection = 'asc' | 'desc'

// ── Despesa Unificada (lista de despesas + faturas) ─────

export type UnifiedExpenseItem =
  | {
      id: number
      type: 'expense'
      description: string
      obs: string
      category: string
      date: string
      value: number
      is_paid: boolean
    }
  | {
      id: string
      type: 'card'
      description: string
      obs: string
      category: string
      date: string
      value: number
      is_paid: boolean
    }

// ── Dashboard Props ─────────────────────────────────────

export interface DashboardOverviewProps {
  revenue: RevenueItem[]
  expense: ExpenseItem[]
  kpiUser: KpiItem[]
  creditCards: CreditCard[]
  creditCardExpenses: CreditCardExpense[]
}
