'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/ui/header'
import { supabase } from '@/util/supabase/server'
import { useToast } from '@/hooks/use-toast'

export default function Category() {
  const [catRevenue, setCatRevenue] = useState('')
  const [catExpense, setCatExpense] = useState('')

  const { toast } = useToast()

  const handleSubmitCatRevenue = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    // Aqui você pode adicionar a lógica para enviar os dados do formulário
    const { data, error } = await supabase
      .from('cat_revenue')
      .insert({
        category: catRevenue,
      })
      .select()

    if (data) {
      toast({
        variant: 'default',
        title: 'Sucesso!',
        description: `A receita do tipo ${catRevenue} foi cadastrado!`,
      })
      setCatRevenue('')
    }
  }

  const handleSubmitCatExpense = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    // Aqui você pode adicionar a lógica para enviar os dados do formulário
    const { data, error } = await supabase
      .from('cat_expense')
      .insert({
        category: catExpense,
      })
      .select()

    if (data) {
      toast({
        variant: 'default',
        title: 'Sucesso!',
        description: `A despesa do tipo ${catExpense} foi cadastrado!`,
      })
      setCatExpense('')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Cadastro de tipos de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitCatExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense">Despesa</Label>
                <Input
                  id="expense"
                  placeholder="Nome da Despesa"
                  value={catExpense}
                  onChange={e => setCatExpense(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white hover:bg-purple-900 hover:text-black hover:font-medium"
              >
                Cadastrar
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Cadastro de tipos de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitCatRevenue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revenue">Receita</Label>
                <Input
                  id="revenue"
                  placeholder="Nome do tipo da Receita"
                  value={catRevenue}
                  onChange={e => setCatRevenue(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white hover:bg-purple-900 hover:text-black hover:font-medium"
              >
                Cadastrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
