'use client'

import { revalidateAfterInsert } from '@/components/actions'
import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/ui/header'
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
import { createClient } from '@/util/supabase/client'
import { AlertDialog } from '@radix-ui/react-alert-dialog'
import type { User } from '@supabase/supabase-js'
import { addMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

export default function Despesas() {
  const supabase = useMemo(() => createClient(), [])
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
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

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
    setError(null)

    if (!expense.trim() || !value || !date || !category) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (
      category === 'Compras parceladas' &&
      (!qtd_parcelas || qtd_parcelas < 1)
    ) {
      setError('Informe a quantidade de parcelas.')
      return
    }

    setIsDisabled(true)

    // Se for compras parceladas, cria todos os registros de uma vez
    if (category === 'Compras parceladas') {
      try {
        const baseDate = new Date(date)
        const records = Array.from({ length: qtd_parcelas }, (_, i) => ({
          expense: `${expense} - Parcela ${i + 1}/${qtd_parcelas}`,
          value: value / qtd_parcelas,
          created_at: addMonths(baseDate, i).toISOString(),
          category,
          obs,
          user_id: user?.id,
        }))

        const { error } = await supabase.from('expense').insert(records)

        if (error) throw error
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        setError(error?.message)
      }
      await revalidateAfterInsert()
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

      await revalidateAfterInsert()
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
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-button text-button-foreground hover:bg-brand/80"
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
              <AlertDialogAction className="w-full bg-button text-button-foreground hover:bg-brand/80">
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
