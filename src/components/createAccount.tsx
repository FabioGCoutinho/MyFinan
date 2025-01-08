'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/util/supabase/supabase'

interface CriarContaProps {
  onVoltar: () => void
}

export default function CriarConta({ onVoltar }: CriarContaProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Lógica de criação de conta aqui
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        emailRedirectTo: 'http://localhost:3000/dashboard',
      },
    })

    console.log('Conta criada', { data })
  }

  return (
    <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Criar Conta
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
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
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
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
