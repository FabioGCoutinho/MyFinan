'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface RecuperarSenhaProps {
  onVoltar: () => void
}

export default function RecuperarSenha({ onVoltar }: RecuperarSenhaProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Lógica de recuperação de senha aqui
    console.log('Recuperação de senha solicitada para', email)
  }

  return (
    <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Recuperar Senha
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
        <Button
          type="submit"
          className="w-full bg-button text-button-foreground hover:bg-purple-900"
        >
          Enviar link de recuperação
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
