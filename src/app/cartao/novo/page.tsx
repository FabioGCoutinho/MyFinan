'use client'

import { revalidateAfterCardAction } from '@/components/actions'
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
import type { CreditCard } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/client'
import { AlertDialog } from '@radix-ui/react-alert-dialog'
import type { User } from '@supabase/supabase-js'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

export default function NovoGastoCartao() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [cardId, setCardId] = useState('')
  const [description, setDescription] = useState('')
  const [valor, setValor] = useState('')
  const [value, setValue] = useState(0)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [alertShow, setAlertShow] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('credit_card')
          .select('*')
          .eq('user_id', user.id)
        setCards(data ?? [])
      }
      setLoading(false)
    }
    init()
  }, [supabase])

  const formatarValor = (val: string) => {
    const numero = val.replace(/\D/g, '')
    const centavos = Number.parseInt(numero) / 100
    setValue(centavos)
    return centavos.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValor(formatarValor(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!cardId || !description.trim() || !value || !date || !category) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setIsDisabled(true)

    try {
      const { error } = await supabase.from('credit_card_expense').insert({
        card_id: Number(cardId),
        description,
        value,
        category,
        created_at: date,
        obs,
        user_id: user?.id,
      })

      if (error) throw error

      await revalidateAfterCardAction()
      setAlertShow(true)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      setError(err?.message)
      setIsDisabled(false)
    }
  }

  function closeModal() {
    setDescription('')
    setValor('')
    setValue(0)
    setCategory('')
    setDate('')
    setObs('')
    setCardId('')
    setAlertShow(false)
    setIsDisabled(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 space-y-4 p-8 pt-6">
        {cards.length === 0 ? (
          <Card className="w-full max-w-lg mx-auto border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhum cartão cadastrado
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre um cartão de crédito nas Configurações para registrar
                gastos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Gasto no Cartão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card">Cartão</Label>
                  <Select onValueChange={setCardId} value={cardId} required>
                    <SelectTrigger id="card">
                      <SelectValue placeholder="Selecione o cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map(card => (
                        <SelectItem key={card.id} value={String(card.id)}>
                          {card.name} — {card.bank} ****{card.last_digits}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Nome do gasto"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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
                  <Label htmlFor="date">Data da compra</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select onValueChange={setCategory} value={category} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alimentação">Alimentação</SelectItem>
                      <SelectItem value="Contas">Contas</SelectItem>
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
                    'Cadastrar Gasto'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={alertShow} onOpenChange={closeModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sucesso!</AlertDialogTitle>
              <AlertDialogDescription>
                O gasto &quot;{description}&quot; foi registrado no cartão!
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
