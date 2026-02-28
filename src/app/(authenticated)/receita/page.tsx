'use client'

import { revalidateAfterInsert } from '@/components/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

export default function Receitas() {
  const supabase = useMemo(() => createClient(), [])
  const [revenue, setRevenue] = useState('')
  const [valor, setValor] = useState('')
  const [value, setValue] = useState(0)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [alertShow, setAlertShow] = useState(false)
  const [user, setUser] = useState<User | null>(null)

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
    // Aqui você pode adicionar a lógica para enviar os dados do formulário
    try {
      const { data, error } = await supabase.from('revenue').insert({
        revenue,
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
    setRevenue('')
    setValor('')
    setValue(0)
    setCategory('')
    setDate('')
    setObs('')
    setAlertShow(false)
  }

  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Adicionar Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="despesa">Receita</Label>
              <Input
                id="despesa"
                placeholder="Nome da receita"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                placeholder="R$ 0,00"
                value={valor}
                onChange={handleValorChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Origem</Label>
              <Select
                onValueChange={e => setCategory(e)}
                value={category}
                required
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salário">Salário</SelectItem>
                  <SelectItem value="Rendimentos">Rendimentos</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Bônus">Bônus</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Adicione uma observação (opcional)"
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-button text-button-foreground hover:bg-brand/80"
            >
              Cadastrar Receita
            </Button>
          </form>
        </CardContent>
      </Card>
      <AlertDialog open={alertShow} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              A receita {revenue} foi cadastrada!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full text-brand-foreground hover:bg-brand/80">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
