'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/util/supabase/supabase'
import { redirect } from 'next/navigation'
import { useState } from 'react'

interface CriarContaProps {
  onVoltar: () => void
}

export default function CriarConta({ onVoltar }: CriarContaProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDisabled(true)

    // Lógica de criação de conta aqui
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        emailRedirectTo: 'https://app.myfinan.com.br/dashboard',
      },
    })

    if (error) {
      redirect('/error')
    }

    console.log('Conta criada', { data })
  }

  return (
    <div className="w-full max-w-md p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Criar Conta
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            className="bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            required
            className="bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        {confirmarSenha !== senha ? (
          <span className="text-red-500 text-xs">As senhas não são iguais</span>
        ) : (
          ''
        )}
        <Button
          type="submit"
          className="w-full bg-button text-button-foreground hover:bg-purple-900"
          disabled={isDisabled}
        >
          Criar conta
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onVoltar}
          className="text-blue-400 hover:underline"
        >
          Voltar para o login
        </Button>
      </div>
    </div>
  )
}
