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
    const checkIsMobile = () => setIsMobile(window.innerWidth < 640)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

export function Expense({ expense }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [despesasFiltradas, setDespesasFiltradas] = useState(expense)

  // console.log(expense)

  const isMobile = useIsMobile()

  useEffect(() => {
    const filteredDespesas = expense.filter(despesa => {
      const despesaDate = parseISO(despesa.created_at)
      return (
        despesaDate.getMonth() === date.getMonth() &&
        despesaDate.getFullYear() === date.getFullYear() &&
        (selectedCategory === 'Todas' || despesa.category === selectedCategory)
      )
    })
    setDespesasFiltradas(filteredDespesas)
  }, [date, selectedCategory, expense])

  const handlePreviousMonth = () => {
    setDate(prevDate => startOfMonth(subMonths(prevDate, 1)))
  }

  const handleNextMonth = () => {
    setDate(prevDate => startOfMonth(addMonths(prevDate, 1)))
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Despesas</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
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

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por selectedCategory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="Moradia">Moradia</SelectItem>
            <SelectItem value="Alimentação">Alimentação</SelectItem>
            <SelectItem value="Transporte">Transporte</SelectItem>
            <SelectItem value="Saúde">Saúde</SelectItem>
            <SelectItem value="Educação">Educação</SelectItem>
            <SelectItem value="Lazer">Lazer</SelectItem>
            <SelectItem value="Vestuário">Vestuário</SelectItem>
            <SelectItem value="Contas">Contas</SelectItem>
            <SelectItem value="Impostos">Impostos</SelectItem>
            <SelectItem value="Dívidas">Dívidas</SelectItem>
            <SelectItem value="Doações">Doações</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={isMobile ? 2 : 0}>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesasFiltradas.map(despesa => (
              <TableRow key={despesa.id}>
                <TableCell colSpan={isMobile ? 2 : 0} className="font-medium">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <TooltipProvider>
                      <Tooltip delayDuration={isMobile ? 1000 : 0}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{despesa.expense}</span>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 bg-gray-700 text-white">
                          <p className="font-semibold">Descrição:</p>
                          <p>{despesa.obs}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-muted-foreground sm:hidden mt-1">
                      {format(parseISO(despesa.created_at), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
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
                {despesasFiltradas
                  .reduce((total, despesa) => total + despesa.value, 0)
                  .toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
