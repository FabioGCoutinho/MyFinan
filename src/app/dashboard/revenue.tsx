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
import { supabase } from '@/util/supabase/supabase'

interface ChildComponentProps {
  revenue: {
    category: string
    created_at: string
    id: number
    obs: string
    revenue: string
    updated_at: Date
    value: number
    cat_revenue: CatProps
  }[]
}

interface CatProps {
  id: number
  category: string
  created_at: Date
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

export function Revenue({ revenue }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [categoria, setCategoria] = useState('Todas')
  const [despesasFiltradas, setDespesasFiltradas] = useState(revenue)
  const [category, setCatRevenue] = useState<CatProps[]>([])
  const [error, setError] = useState<string | null>(null)

  const categorias = ['Todas', ...category.map(c => c.category)]

  useEffect(() => {
    async function fetchCatRevenue() {
      try {
        const { data, error } = await supabase.from('cat_revenue').select('*')
        if (error) throw error
        setCatRevenue(data)
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        setError(error?.message)
      }
    }

    fetchCatRevenue()
  }, [])

  const isMobile = useIsMobile()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const filteredDespesas = revenue.filter(despesa => {
      const despesaDate = parseISO(despesa.created_at)
      return (
        despesaDate.getMonth() === date.getMonth() &&
        despesaDate.getFullYear() === date.getFullYear() &&
        (categoria === 'Todas' || despesa.cat_revenue.category === categoria)
      )
    })
    setDespesasFiltradas(filteredDespesas)
  }, [date, categoria])

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

        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesasFiltradas.map(despesa => (
              <TableRow key={despesa.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <TooltipProvider>
                      <Tooltip delayDuration={isMobile ? 1000 : 0}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{despesa.revenue}</span>
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
                <TableCell>{despesa.cat_revenue.category}</TableCell>
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
