'use client'

import { useState, useEffect } from 'react'
import { addMonths, format, subMonths, startOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash,
  Trash2,
} from 'lucide-react'
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

export function Revenue({ revenue, onActionCompleted }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [categoria, setCategoria] = useState('Todas')
  const [receitasFiltradas, setReceitasFiltradas] = useState(revenue)
  const [error, setError] = useState<string | null>(null)
  const [alertShow, setAlertShow] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    const filteredRevenue = revenue
      .filter(receitas => {
        const receitasDate = parseISO(receitas.created_at)
        return (
          receitasDate.getMonth() === date.getMonth() &&
          receitasDate.getFullYear() === date.getFullYear() &&
          (categoria === 'Todas' || receitas.category === categoria)
        )
      })
      .sort((a, b) => {
        const dateA = parseISO(a.created_at).getTime()
        const dateB = parseISO(b.created_at).getTime()
        return dateA - dateB // Ordem decrescente
      })

    setReceitasFiltradas(filteredRevenue)
  }, [date, categoria, revenue])

  const handlePreviousMonth = () => {
    setDate(prevDate => startOfMonth(subMonths(prevDate, 1)))
  }

  const handleNextMonth = () => {
    setDate(prevDate => startOfMonth(addMonths(prevDate, 1)))
  }

  function handleDeledComfim(id: number) {
    setAlertShow(true)
    setSelectedId(id)
  }

  const handleDeledRevenue = async () => {
    //Realiza a exclusão dos dados no banco de dados
    try {
      const response = await supabase
        .from('revenue')
        .delete()
        .eq('id', selectedId)

      console.log(response)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      setError(error?.message)
      console.error(error?.message)
    }

    setAlertShow(false)
    // Após a ação ser concluída, chame o callback para recarregar os dados
    onActionCompleted()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Receitas</h1>

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

        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="Salário">Salário</SelectItem>
            <SelectItem value="Rendimentos">Rendimentos</SelectItem>
            <SelectItem value="Freelance">Freelance</SelectItem>
            <SelectItem value="Bônus">Bônus</SelectItem>
            <SelectItem value="Vendas">Vendas</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-5"> </TableHead>
              <TableHead colSpan={isMobile ? 2 : 0}>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receitasFiltradas.map(receitas => (
              <TableRow key={receitas.id}>
                <TableCell className="text-gray-700 font-medium w-5">
                  <Button
                    variant="ghost"
                    className="py-0 px-2 hover:bg-purple-600 hover:text-white transform hover:scale-110"
                    onClick={() => handleDeledComfim(receitas.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
                <TableCell colSpan={isMobile ? 2 : 0} className="font-medium">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <TooltipProvider>
                      <Tooltip delayDuration={isMobile ? 1000 : 0}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {receitas.revenue}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 bg-gray-700 text-white">
                          <p className="font-semibold">Descrição:</p>
                          <p>{receitas.obs}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-muted-foreground md:hidden mt-1">
                      {format(parseISO(receitas.created_at), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(parseISO(receitas.created_at), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>{receitas.category}</TableCell>
                <TableCell className="text-right">
                  {receitas.value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="text-right font-bold">
                {receitasFiltradas
                  .reduce((total, receitas) => total + receitas.value, 0)
                  .toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <AlertDialog open={alertShow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar a exclusão da receita? ID: {selectedId}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertShow(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className=" text-white hover:bg-purple-900"
              onClick={() => handleDeledRevenue()}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
