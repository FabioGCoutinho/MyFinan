'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import { parseLocalDate } from '@/lib/utils'
import { createClient } from '@/util/supabase/client'
import { type ClassValue, clsx } from 'clsx'
import { format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Banknote,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Gift,
  Landmark,
  LineChart,
  Monitor,
  PlusCircle,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ChildComponentProps {
  revenue: {
    category: string
    created_at: string
    id: number
    obs: string
    revenue: string
    updated_at: Date
    value: number
  }[]
  onActionCompleted: () => void
}

type SortField = 'descricao' | 'categoria' | 'data' | 'valor' | null
type SortDirection = 'asc' | 'desc'

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Salário':
      return (
        <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      )
    case 'Rendimentos':
      return <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'Freelance':
      return (
        <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      )
    case 'Bônus':
      return <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    case 'Vendas':
      return (
        <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
      )
    default:
      return <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  }
}

const CategoryBg = ({ category }: { category: string }) => {
  switch (category) {
    case 'Salário':
      return 'bg-emerald-100 dark:bg-emerald-900/30'
    case 'Rendimentos':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'Freelance':
      return 'bg-indigo-100 dark:bg-indigo-900/30'
    case 'Bônus':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'Vendas':
      return 'bg-orange-100 dark:bg-orange-900/30'
    default:
      return 'bg-teal-100 dark:bg-teal-900/30'
  }
}

export function Revenue({ revenue, onActionCompleted }: ChildComponentProps) {
  const supabase = useMemo(() => createClient(), [])

  const last12Months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(new Date(), i)
      return {
        value: format(startOfMonth(d), 'yyyy-MM-dd'),
        label: format(d, 'MMMM yyyy', { locale: ptBR }),
      }
    })
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(
    last12Months[0].value
  )
  const [categoria, setCategoria] = useState('Todas')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [alertShow, setAlertShow] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  const isMobile = useIsMobile()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = isMobile ? 10 : 15

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  const { currentMonthTotal, previousMonthTotal } = useMemo(() => {
    const currentMonthDate = parseLocalDate(selectedMonth)
    const previousMonthDate = subMonths(currentMonthDate, 1)

    let current = 0
    let previous = 0

    for (const r of revenue) {
      const d = parseLocalDate(r.created_at)
      if (
        d.getFullYear() === currentMonthDate.getFullYear() &&
        d.getMonth() === currentMonthDate.getMonth()
      ) {
        current += r.value
      }
      if (
        d.getFullYear() === previousMonthDate.getFullYear() &&
        d.getMonth() === previousMonthDate.getMonth()
      ) {
        previous += r.value
      }
    }

    return { currentMonthTotal: current, previousMonthTotal: previous }
  }, [selectedMonth, revenue])

  const percentageChange =
    previousMonthTotal === 0
      ? currentMonthTotal > 0
        ? 100
        : 0
      : ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100

  const receitasFiltradas = useMemo(() => {
    const filtered = revenue.filter(r => {
      const rDate = parseLocalDate(r.created_at)
      const sDate = parseLocalDate(selectedMonth)
      return (
        rDate.getMonth() === sDate.getMonth() &&
        rDate.getFullYear() === sDate.getFullYear() &&
        (categoria === 'Todas' || r.category === categoria)
      )
    })

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''
        switch (sortField) {
          case 'descricao':
            aValue = a.revenue.toLowerCase()
            bValue = b.revenue.toLowerCase()
            break
          case 'categoria':
            aValue = a.category.toLowerCase()
            bValue = b.category.toLowerCase()
            break
          case 'data':
            aValue = parseLocalDate(a.created_at).getTime()
            bValue = parseLocalDate(b.created_at).getTime()
            break
          case 'valor':
            aValue = a.value
            bValue = b.value
            break
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    } else {
      filtered.sort((a, b) => {
        return (
          parseLocalDate(b.created_at).getTime() -
          parseLocalDate(a.created_at).getTime()
        )
      })
    }

    return filtered
  }, [selectedMonth, categoria, revenue, sortField, sortDirection])

  const totalPages = Math.max(
    1,
    Math.ceil(receitasFiltradas.length / itemsPerPage)
  )
  const paginatedRevenue = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return receitasFiltradas.slice(start, start + itemsPerPage)
  }, [receitasFiltradas, currentPage, itemsPerPage])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="ml-1 w-4 h-4 inline" />
    ) : (
      <ArrowDownIcon className="ml-1 w-4 h-4 inline" />
    )
  }

  function handleDeleteConfirm(id: number) {
    setAlertShow(true)
    setSelectedId(id)
  }

  const handleDeleteRevenue = async () => {
    try {
      await supabase.from('revenue').delete().eq('id', selectedId)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao excluir receita'
      setError(message)
      console.error(message)
    }

    setAlertShow(false)
    onActionCompleted()
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="w-full flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Fluxo de Caixa
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight mt-1">
            Minhas Receitas
          </h2>
        </div>
        <Button asChild className="px-6 font-semibold">
          <Link href="/receitas/novo">
            <PlusCircle className="mr-2 h-5 w-5 text-white" /> Nova Receita
          </Link>
        </Button>
      </div>

      {/* Hero Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Recebido Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-card to-card/50 dark:from-card dark:to-background border rounded-2xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-muted-foreground font-medium mb-2">
              Total Recebido (Mensal)
            </p>
            <h3 className="text-5xl font-black text-brand mb-4">
              {currentMonthTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                  percentageChange >= 0
                    ? 'bg-brand/10 text-brand'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {percentageChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {percentageChange > 0 ? '+' : ''}
                {percentageChange.toFixed(1)}% vs mês passado
              </div>
            </div>
          </div>
          {/* Decorative Icon */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-surface p-4 rounded-2xl hidden sm:block">
            <Landmark className="w-12 h-12 text-brand" />
          </div>
        </div>

        {/* Filtros Rápidos Card */}
        <div className="md:col-span-1 bg-surface border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-lg">Filtros Rápidos</h4>
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="periodo-select"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Período
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger
                  id="periodo-select"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {last12Months.map(m => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      className="capitalize"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="categoria-select"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Categoria
              </label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger
                  id="categoria-select"
                  className="w-full bg-background"
                >
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas Categorias</SelectItem>
                  <SelectItem value="Salário">Salário</SelectItem>
                  <SelectItem value="Rendimentos">Rendimentos</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Bônus">Bônus</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* List Headers */}
      {!isMobile && (
        <div className="grid grid-cols-[1fr_150px_120px_160px_60px] gap-4 px-6 py-3 mb-2 text-xs font-bold text-muted-foreground tracking-wider">
          <button
            type="button"
            onClick={() => handleSort('descricao')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Descrição {renderSortIcon('descricao')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('categoria')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Categoria {renderSortIcon('categoria')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('data')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Data {renderSortIcon('data')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('valor')}
            className="text-right flex items-center justify-end hover:text-foreground transition-colors"
          >
            Valor {renderSortIcon('valor')}
          </button>
          <div className="text-center">Ação</div>
        </div>
      )}

      {/* List Items */}
      <div className="space-y-3">
        {paginatedRevenue.length > 0 ? (
          paginatedRevenue.map(receita => (
            <div
              key={receita.id}
              className="bg-card border rounded-2xl p-4 sm:px-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:grid sm:grid-cols-[1fr_150px_120px_160px_60px] items-start sm:items-center gap-4 group"
            >
              {/* Descrição */}
              <div className="flex items-center gap-4 w-full">
                <div
                  className={cn(
                    'p-3 rounded-xl flex-shrink-0',
                    CategoryBg({ category: receita.category })
                  )}
                >
                  <CategoryIcon category={receita.category} />
                </div>
                <div>
                  <p className="font-bold text-foreground truncate">
                    {receita.revenue}
                  </p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px] xl:max-w-[400px]">
                    {receita.obs || 'Sem descrição'}
                  </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 sm:contents">
                {/* Categoria */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Categoria
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface text-surface-foreground capitalize">
                    {receita.category.toLowerCase()}
                  </span>
                </div>

                {/* Data */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block text-muted-foreground text-sm font-medium">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Data
                  </span>
                  {format(parseLocalDate(receita.created_at), 'dd MMM, yyyy', {
                    locale: ptBR,
                  })}
                </div>

                {/* Valor */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block text-left sm:text-right">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Valor
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    {receita.value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                {/* Ação */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Ação
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteConfirm(receita.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-surface border rounded-2xl text-muted-foreground">
            {revenuesEmptyMessage(selectedMonth)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 p-4 px-6 border border-border flex items-center justify-between bg-white dark:bg-card rounded-[24px]">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Exibindo {paginatedRevenue.length} de {receitasFiltradas.length}{' '}
            lançamentos
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={alertShow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita permanentemente? Essa
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertShow(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteRevenue}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function revenuesEmptyMessage(month: string) {
  const d = parseLocalDate(month)
  return `Nenhuma receita encontrada em ${format(d, 'MMMM', { locale: ptBR })}.`
}
