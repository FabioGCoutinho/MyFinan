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
  expense: {
    category: string
    created_at: string
    id: number
    obs: string
    expense: string
    updated_at: Date
    value: number
    cat_expense: CatProps
  }[]
}

interface CatProps {
  id: number
  category: string
  created_at: Date
}

// Dados de exemplo
const despesas = [
  {
    id: 1,
    nome: 'Aluguel',
    descricao: 'Pagamento mensal do aluguel',
    data: '2024-10-05',
    categoria: 'Moradia',
    valor: 1500,
  },
  {
    id: 2,
    nome: 'Supermercado',
    descricao: 'Compras da semana',
    data: '2024-10-10',
    categoria: 'Alimentação',
    valor: 400,
  },
  {
    id: 3,
    nome: 'Conta de luz',
    descricao: 'Fatura de energia elétrica',
    data: '2024-10-15',
    categoria: 'Utilidades',
    valor: 200,
  },
  {
    id: 4,
    nome: 'Academia',
    descricao: 'Mensalidade da academia',
    data: '2024-10-01',
    categoria: 'Saúde',
    valor: 120,
  },
  {
    id: 5,
    nome: 'Internet',
    descricao: 'Mensalidade do provedor',
    data: '2024-10-07',
    categoria: 'Utilidades',
    valor: 100,
  },
  {
    id: 6,
    nome: 'Transporte',
    descricao: 'Passagens de ônibus',
    data: '2024-10-20',
    categoria: 'Transporte',
    valor: 150,
  },
  {
    id: 7,
    nome: 'Restaurante',
    descricao: 'Jantar com amigos',
    data: '2024-10-18',
    categoria: 'Lazer',
    valor: 180,
  },
  {
    id: 8,
    nome: 'Farmácia',
    descricao: 'Medicamentos',
    data: '2024-10-12',
    categoria: 'Saúde',
    valor: 80,
  },
  {
    id: 9,
    nome: 'Streaming',
    descricao: 'Assinatura de serviço de streaming',
    data: '2024-10-05',
    categoria: 'Lazer',
    valor: 40,
  },
  {
    id: 10,
    nome: 'Roupas',
    descricao: 'Compra de roupas novas',
    data: '2024-10-22',
    categoria: 'Vestuário',
    valor: 250,
  },
  {
    id: 11,
    nome: 'Manutenção do carro',
    descricao: 'Revisão e troca de óleo',
    data: '2024-10-25',
    categoria: 'Transporte',
    valor: 300,
  },
  {
    id: 12,
    nome: 'Presente',
    descricao: 'Aniversário de um familiar',
    data: '2024-10-28',
    categoria: 'Outros',
    valor: 100,
  },
  {
    id: 13,
    nome: 'Curso online',
    descricao: 'Curso de aperfeiçoamento profissional',
    data: '2024-10-03',
    categoria: 'Educação',
    valor: 200,
  },
  {
    id: 14,
    nome: 'Material de escritório',
    descricao: 'Compra de material para home office',
    data: '2024-10-08',
    categoria: 'Trabalho',
    valor: 70,
  },
]

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

export function Expense({ expense }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [categoria, setCategoria] = useState('Todas')
  const [despesasFiltradas, setDespesasFiltradas] = useState(expense)
  const [category, setCatExpense] = useState<CatProps[]>([])
  const [error, setError] = useState<string | null>(null)

  const categorias = ['Todas', ...category.map(c => c.category)]

  useEffect(() => {
    async function fetchCatExpense() {
      try {
        const { data, error } = await supabase.from('cat_expense').select('*')
        if (error) throw error
        setCatExpense(data)
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        setError(error?.message)
      }
    }

    fetchCatExpense()
  }, [])

  const isMobile = useIsMobile()

  useEffect(() => {
    const filteredDespesas = expense.filter(despesa => {
      const despesaDate = parseISO(despesa.created_at)
      return (
        despesaDate.getMonth() === date.getMonth() &&
        despesaDate.getFullYear() === date.getFullYear() &&
        (categoria === 'Todas' || despesa.cat_expense.category === categoria)
      )
    })
    setDespesasFiltradas(filteredDespesas)
  }, [date, categoria, expense])

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
                <TableCell>{despesa.cat_expense.category}</TableCell>
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
