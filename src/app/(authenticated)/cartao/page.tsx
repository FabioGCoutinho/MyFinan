'use client'

import { revalidateAfterCardAction } from '@/components/actions'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import type { CreditCard, CreditCardExpense } from '@/lib/credit-card'
import { getInvoicePeriod } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCard as CreditCardIcon,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

// ── Página ─────────────────────────────────────────────

export default function CartaoPage() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [expenses, setExpenses] = useState<CreditCardExpense[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('all')
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [alertShow, setAlertShow] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

      const [cardsRes, expensesRes] = await Promise.all([
        supabase.from('credit_card').select('*').eq('user_id', user.id),
        supabase.from('credit_card_expense').select('*').eq('user_id', user.id),
      ])

      setCards(cardsRes.data ?? [])
      setExpenses(expensesRes.data ?? [])
      setLoading(false)
    }
    init()
  }, [supabase])

  // ── Cartão selecionado ───────────────────────────────

  const selectedCard = useMemo(
    () => cards.find(c => c.id === Number(selectedCardId)),
    [cards, selectedCardId]
  )

  // ── Filtragem por ciclo de fatura ────────────────────

  const filteredExpenses = useMemo(() => {
    const targetCards =
      selectedCardId === 'all'
        ? cards
        : cards.filter(c => c.id === Number(selectedCardId))

    if (targetCards.length === 0) return []

    const month = date.getMonth()
    const year = date.getFullYear()

    return expenses
      .filter(exp => {
        const card = targetCards.find(c => c.id === exp.card_id)
        if (!card) return false
        const { start, end } = getInvoicePeriod(year, month, card.closing_day)
        const expDate = parseISO(exp.created_at)
        return expDate >= start && expDate <= end
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
  }, [expenses, cards, selectedCardId, date])

  const total = filteredExpenses.reduce((sum, e) => sum + Number(e.value), 0)

  // ── Navegação de mês ─────────────────────────────────

  const handlePreviousMonth = () =>
    setDate(prev => startOfMonth(subMonths(prev, 1)))
  const handleNextMonth = () =>
    setDate(prev => startOfMonth(addMonths(prev, 1)))

  // ── Exclusão ─────────────────────────────────────────

  const handleDeleteConfirm = (id: number) => {
    setSelectedId(id)
    setAlertShow(true)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    await supabase.from('credit_card_expense').delete().eq('id', selectedId)
    setExpenses(prev => prev.filter(e => e.id !== selectedId))
    setAlertShow(false)
    await revalidateAfterCardAction()
  }

  // ── Helpers ──────────────────────────────────────────

  const getCardName = (cardId: number) => {
    const card = cards.find(c => c.id === cardId)
    return card ? `${card.name} ****${card.last_digits}` : ''
  }

  const getInvoiceLabel = () => {
    if (selectedCard) {
      const { start, end } = getInvoicePeriod(
        date.getFullYear(),
        date.getMonth(),
        selectedCard.closing_day
      )
      return {
        period: `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`,
        dueDate: `${selectedCard.due_day}/${format(date, 'MM/yyyy')}`,
        cards: [selectedCard],
      }
    }

    // Quando "todos os cartões" está selecionado
    if (selectedCardId === 'all' && cards.length > 0) {
      return {
        period: null,
        dueDate: null,
        cards,
      }
    }

    return null
  }

  // ── Renderização ─────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:w-3/4 w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Gastos no Cartão</h2>

      {cards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum cartão cadastrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre um cartão de crédito nas Configurações para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Controles ────────────────────────────── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
                disabled
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'MMMM yyyy', { locale: ptBR })}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>

            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Selecione um cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cartões</SelectItem>
                {cards.map(card => (
                  <SelectItem key={card.id} value={String(card.id)}>
                    {card.name} ****{card.last_digits}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Informações da fatura ────────────────── */}
          {(() => {
            const info = getInvoiceLabel()
            if (!info) return null

            // Cartão específico selecionado
            if (info.period && info.dueDate) {
              return (
                <Card className="bg-surface/50 border-border">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-info" />
                        <span className="text-muted-foreground">Período:</span>
                        <span className="font-medium">{info.period}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Vencimento:
                        </span>
                        <span className="font-medium text-warning">
                          {info.dueDate}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            // Todos os cartões selecionados
            return (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {info.cards.map(card => {
                  const { start, end } = getInvoicePeriod(
                    date.getFullYear(),
                    date.getMonth(),
                    card.closing_day
                  )
                  const cardTotal = filteredExpenses
                    .filter(exp => exp.card_id === card.id)
                    .reduce((sum, exp) => sum + Number(exp.value), 0)

                  return (
                    <Card key={card.id} className="bg-surface/50 border-border">
                      <CardContent className="py-3 px-4 space-y-1">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <CreditCardIcon className="h-3.5 w-3.5 text-info" />
                          {card.name} ****{card.last_digits}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            Período:{' '}
                            <span className="text-foreground font-medium">
                              {format(start, 'dd/MM')} a {format(end, 'dd/MM')}
                            </span>
                          </p>
                          <p>
                            Vencimento:{' '}
                            <span className="text-warning font-medium">
                              dia {card.due_day}
                            </span>
                          </p>
                          {cardTotal > 0 && (
                            <p>
                              Total:{' '}
                              <span className="text-foreground font-medium">
                                {cardTotal.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </span>
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })()}

          {/* ── Tabela ───────────────────────────────── */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-5"> </TableHead>
                  <TableHead colSpan={isMobile ? 2 : 1}>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  {selectedCardId === 'all' && (
                    <TableHead className="hidden md:table-cell">
                      Cartão
                    </TableHead>
                  )}
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum gasto registrado neste período
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-muted-foreground font-medium w-5">
                        <Button
                          variant="ghost"
                          className="py-0 px-2 hover:bg-brand hover:text-brand-foreground transform hover:scale-110"
                          onClick={() => handleDeleteConfirm(exp.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                      <TableCell
                        colSpan={isMobile ? 2 : 1}
                        className="font-medium"
                      >
                        <div className="flex flex-col md:flex-row md:items-center">
                          <TooltipProvider>
                            <Tooltip delayDuration={isMobile ? 1000 : 0}>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {exp.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="w-80 bg-surface text-surface-foreground">
                                <p className="font-semibold">Observação:</p>
                                <p>{exp.obs || 'Sem observação'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-sm text-muted-foreground md:hidden mt-1">
                            {format(parseISO(exp.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(parseISO(exp.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{exp.category}</TableCell>
                      {selectedCardId === 'all' && (
                        <TableCell className="hidden md:table-cell">
                          {getCardName(exp.card_id)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {Number(exp.value).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={selectedCardId === 'all' ? 5 : 4}>
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </>
      )}

      {/* ── Dialog de exclusão ───────────────────────── */}
      <AlertDialog open={alertShow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar a exclusão deste gasto do cartão?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertShow(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-button text-button-foreground hover:bg-brand/80"
              onClick={handleDelete}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
