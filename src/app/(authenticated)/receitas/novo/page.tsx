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
import { formatarValor } from '@/lib/utils'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function NovaReceitaPage() {
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


  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted, numeric } = formatarValor(e.target.value)
    setValor(formatted)
    setValue(numeric)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from('revenue').insert({
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
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
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Finanças
          </Link>
          <span className="text-muted-foreground/50">›</span>
          <Link
            href="/receitas"
            className="hover:text-foreground transition-colors"
          >
            Receitas
          </Link>
          <span className="text-muted-foreground/50">›</span>
          <span className="text-primary font-semibold">Adicionar</span>
        </nav>

        {/* Title & description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nova Receita
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Registre seus novos ganhos para manter seu fluxo de caixa atualizado
            e visualizar sua projeção de crescimento.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-6 bg-card rounded-2xl border border-border p-6 shadow-sm"
          >
            {/* Nome da receita */}
            <div className="space-y-2">
              <Label
                htmlFor="receita"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nome da Receita
              </Label>
              <Input
                id="receita"
                placeholder="Ex: Consultoria Projeto X"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                required
                className="h-12 rounded-xl bg-background border-border"
              />
            </div>

            {/* Valor + Data side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="valor"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Valor (BRL)
                </Label>
                <Input
                  id="valor"
                  placeholder="R$ 0,00"
                  value={valor}
                  onChange={handleValorChange}
                  required
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="data"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Data do Recebimento
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>
            </div>

            {/* Fonte da receita */}
            <div className="space-y-2">
              <Label
                htmlFor="categoria"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Fonte da Receita
              </Label>
              <Select
                onValueChange={e => setCategory(e)}
                value={category}
                required
              >
                <SelectTrigger
                  id="categoria"
                  className="h-12 rounded-xl bg-background border-border"
                >
                  <SelectValue placeholder="Selecione a fonte" />
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

            {/* Observação */}
            <div className="space-y-2">
              <Label
                htmlFor="observacao"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Observação (Opcional)
              </Label>
              <Textarea
                id="observacao"
                placeholder="Adicione detalhes relevantes sobre este ganho..."
                value={obs}
                onChange={e => setObs(e.target.value)}
                className="min-h-[100px] rounded-xl bg-background border-border resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit only visible on mobile (lg has submit in sidebar) */}
            <div className="lg:hidden">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base"
              >
                Salvar Receita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Right: Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Resumo da Ação
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Ao salvar, este valor será somado ao seu saldo total e refletido
                nos gráficos de crescimento mensal.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    Atualização instantânea
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    Conciliação bancária
                  </span>
                </div>
              </div>

              {/* Submit button (desktop) — uses form attribute to trigger submit */}
              <Button
                type="submit"
                form="revenue-form"
                className="hidden lg:flex w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold text-base items-center justify-center gap-2"
                onClick={() => {
                  // Trigger the form submit via ref
                  const form = document.querySelector(
                    'form'
                  ) as HTMLFormElement | null
                  if (form) form.requestSubmit()
                }}
              >
                Salvar Receita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Tip Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Dica de Curador
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Categorizar corretamente suas fontes ajuda o MyFinan a gerar
                    insights mais precisos sobre sua liberdade financeira.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={alertShow} onOpenChange={closeModal}>
        <AlertDialogContent className="max-w-sm text-center">
          <AlertDialogHeader className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">
              Receita Salva!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Sua transação foi registrada com sucesso e já está impactando
              seu dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-col gap-2 sm:space-x-0 pt-4">
            <AlertDialogAction asChild>
              <Link
                href="/receitas"
                className="w-full h-12 rounded-2xl border-none font-bold flex items-center justify-center m-0"
              >
                Ver Extrato
              </Link>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link
              href="#"
              onClick={closeModal}
              className="w-full h-12 rounded-2xl border-none font-bold flex items-center justify-center m-0"
              >
              Nova Transação
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
