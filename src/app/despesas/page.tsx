'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/ui/header'
import { supabase } from '@/util/supabase/supabase'
import { AlertDialog } from '@radix-ui/react-alert-dialog'
import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { User } from '@supabase/supabase-js'
import { addMonths } from 'date-fns'
import PulseLoader from 'react-spinners/PulseLoader'

export default function Despesas() {
  const [expense, setExpense] = useState('')
  const [valor, setValor] = useState('')
  const [value, setValue] = useState(0)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [alertShow, setAlertShow] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [qtd_parcelas, setQtdParcelas] = useState<number>(1)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    //obtem os dados do usuario salvo no localStorage
    const a = localStorage.getItem('user')
    const user = a ? JSON.parse(a) : null
    setUser(user)
  }, [])

  const formatarValor = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numero = value.replace(/\D/g, '')

    // Converte para centavos
    const centavos = Number.parseInt(numero) / 100
    setValue(centavos)

    // Formata o valor
    return centavos.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarValor(e.target.value)
    setValor(valorFormatado)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsDisabled(true)

    // Se for compras parceladas, executa o for para fazer na quantidade de meses referente a qtd de parcelas
    if (category === 'Compras parceladas') {
      let currentDate = new Date(date) // Cria uma cópia da data original

      for (let i = 1; i <= qtd_parcelas; i++) {
        try {
          const { data, error } = await supabase.from('expense').insert({
            expense: `${expense} - Parcela ${i}/${qtd_parcelas}`,
            value: value / qtd_parcelas,
            created_at: currentDate.toISOString(), // Usa a data atual
            category,
            obs,
            user_id: user?.id,
          })

          if (error) throw error

          // Adiciona 1 mês à data para a próxima parcela
          currentDate = addMonths(currentDate, 1)
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
          setError(error?.message)
        }
      }
      setAlertShow(true)
      return
    }

    try {
      const { data, error } = await supabase.from('expense').insert({
        expense,
        value,
        created_at: date,
        category,
        obs,
        user_id: user?.id,
      })

      if (error) throw error

      setAlertShow(true)

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      setError(error?.message)
    }
  }

  function closeModal() {
    setExpense('')
    setValor('')
    setValue(0)
    setCategory('')
    setDate('')
    setObs('')
    setAlertShow(false)
    setIsDisabled(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Adicinar Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense">Despesa</Label>
                <Input
                  id="expense"
                  placeholder="Nome da despesa"
                  value={expense}
                  onChange={e => setExpense(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Valor</Label>
                <Input
                  id="price"
                  placeholder="R$ 0,00"
                  value={valor}
                  onChange={handleValorChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  onValueChange={e => setCategory(e)}
                  value={category}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Alimentação">Alimentação</SelectItem>
                    <SelectItem value="Contas">Contas</SelectItem>
                    <SelectItem value="Compras parceladas">
                      Compras parceladas
                    </SelectItem>
                    <SelectItem value="Dívidas">Dívidas</SelectItem>
                    <SelectItem value="Doações">Doações</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Impostos">Impostos</SelectItem>
                    <SelectItem value="Lazer">Lazer</SelectItem>
                    <SelectItem value="Moradia">Moradia</SelectItem>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Vestuário">Vestuário</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                className={`space-y-2 ${category === 'Compras parceladas' ? '' : 'hidden'}`}
              >
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input
                  id="qtd_parcelas"
                  type="number"
                  value={qtd_parcelas}
                  onChange={e => setQtdParcelas(Number(e.target.value))}
                  required
                />
              </div>
              <div
                className={`space-y-2 ${category === 'Compras parceladas' ? '' : 'hidden'}`}
              >
                <Label htmlFor="valor_parcelas">Valor da Parcela</Label>
                <Input
                  id="valor_parcelas"
                  value={(value / qtd_parcelas).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observação</Label>
                <Textarea
                  id="obs"
                  placeholder="Adicione uma observação (opcional)"
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white hover:bg-purple-900"
                disabled={isDisabled}
              >
                {isDisabled ? (
                  <PulseLoader color="#fff" />
                ) : (
                  'Cadastrar Despesa'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <AlertDialog open={alertShow} onOpenChange={closeModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sucesso!</AlertDialogTitle>
              <AlertDialogDescription>
                A despesa {expense} foi cadastrada!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="w-full text-white hover:bg-purple-900">
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
