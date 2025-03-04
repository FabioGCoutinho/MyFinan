'use client'

import { useState, useEffect } from 'react'
import { addMonths, format, subMonths, startOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  expense: {
    category: string
    created_at: string
    id: number
    obs: string
    expense: string
    updated_at: Date
    value: number
  }[]
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

export function Relatorio({ revenue, expense }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [categoria, setCategoria] = useState('Todas')
  const [receitasFiltradas, setReceitasFiltradas] = useState(revenue)
  const [despesasFiltradas, setDespesasFiltradas] = useState(expense)

  const isMobile = useIsMobile()

  useEffect(() => {
    const filteredReceitas = revenue
      .filter(receitas => {
        const despesaDate = parseISO(receitas.created_at)
        return (
          despesaDate.getMonth() === date.getMonth() &&
          despesaDate.getFullYear() === date.getFullYear()
        )
      })
      .sort((a, b) => {
        const dateA = parseISO(a.created_at).getTime()
        const dateB = parseISO(b.created_at).getTime()
        return dateA - dateB // Ordem decrescente
      })
    setReceitasFiltradas(filteredReceitas)
    const filteredDespesas = expense
      .filter(despesa => {
        const despesaDate = parseISO(despesa.created_at)
        return (
          despesaDate.getMonth() === date.getMonth() &&
          despesaDate.getFullYear() === date.getFullYear()
        )
      })
      .sort((a, b) => {
        const dateA = parseISO(a.created_at).getTime()
        const dateB = parseISO(b.created_at).getTime()
        return dateA - dateB // Ordem decrescente
      })
    setDespesasFiltradas(filteredDespesas)
  }, [date, revenue, expense])

  const handlePreviousMonth = () => {
    setDate(prevDate => startOfMonth(subMonths(prevDate, 1)))
  }

  const handleNextMonth = () => {
    setDate(prevDate => startOfMonth(addMonths(prevDate, 1)))
  }

  const totalReceitas = receitasFiltradas.reduce(
    (total, receitas) => total + receitas.value,
    0
  )
  const totalDespesas = despesasFiltradas.reduce(
    (total, despesa) => total + despesa.value,
    0
  )

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
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
      </div>

      <div className="flex gap-4 md:flex-row flex-col">
        <div className="w-full md:w-1/4 h-min border rounded-lg p-4">
          <h1 className="text-2xl font-semibold">Resumo</h1>
          <hr />
          <div className="mt-2">
            <span>Receitas: </span>
            <span className="text-green-500">
              {totalReceitas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
          <div className="mb-2">
            <span>Despesas: </span>
            <span className="text-red-500">
              {totalDespesas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
          <hr />
          <div className="mt-4">
            <span>Saldo: </span>
            <span
              className={`${
                totalReceitas - totalDespesas >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              {(totalReceitas - totalDespesas).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>

        <div className="overflow-hidden w-full md:w-3/4">
          <h1 className="text-3xl font-bold">Receitas</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={isMobile ? 2 : 0}>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitasFiltradas.map(despesa => (
                <TableRow key={despesa.id}>
                  <TableCell colSpan={isMobile ? 2 : 0} className="font-medium">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <TooltipProvider>
                        <Tooltip delayDuration={isMobile ? 1000 : 0}>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {despesa.revenue}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="w-80 bg-gray-700 text-white">
                            <p className="font-semibold">Descrição:</p>
                            <p>{despesa.obs}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-muted-foreground md:hidden mt-1">
                        {format(parseISO(despesa.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(parseISO(despesa.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{despesa.category}</TableCell>
                  <TableCell className="text-right">
                    {despesa.value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right font-bold">
                  {totalReceitas.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <h1 className="text-3xl font-bold mt-6">Despesa</h1>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={isMobile ? 2 : 0}>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesasFiltradas.map(despesa => (
                <TableRow key={despesa.id}>
                  <TableCell colSpan={isMobile ? 2 : 0} className="font-medium">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <TooltipProvider>
                        <Tooltip delayDuration={isMobile ? 1000 : 0}>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {despesa.expense}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="w-80 bg-gray-700 text-white">
                            <p className="font-semibold">Descrição:</p>
                            <p>{despesa.obs}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-muted-foreground md:hidden mt-1">
                        {format(parseISO(despesa.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(parseISO(despesa.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{despesa.category}</TableCell>
                  <TableCell className="text-right">
                    {despesa.value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right font-bold">
                  {totalDespesas.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  )
}
