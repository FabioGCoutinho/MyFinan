'use client'

import Facebook from '@/app/assets/facebook.svg'
import Google from '@/app/assets/google.svg'
import { login, loginWithGoogle } from '@/components/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

interface LoginFormProps {
  onRecuperarSenha: () => void
  onCriarConta: () => void
}

export default function LoginForm({
  onRecuperarSenha,
  onCriarConta,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsDisabled(true)

    if (email && password) {
      await login({ email, password })
    }

    setIsDisabled(false)
  }

  return (
    <div className="w-full max-w-md p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Entrar</h2>
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
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <Button
          className="w-full bg-button text-button-foreground font-semibold text-base hover:bg-purple-900"
          disabled={isDisabled}
        >
          {isDisabled ? <PulseLoader color="#fff" /> : 'Entrar'}
        </Button>
      </form>
      <div className="mt-4 flex flex-col space-y-2">
        <Button
          variant="outline"
          className="w-full text-white border-gray-600 hover:bg-gray-700"
          onClick={() => loginWithGoogle()}
        >
          <Image
            src={Google}
            width={20}
            alt="Icone do Google"
            className="mr-2"
          />
          Entrar com Google
        </Button>
        <Button
          variant="outline"
          className="w-full text-white border-gray-600 hover:bg-gray-700"
          onClick={() => console.log('Login do Facebook')}
        >
          <Image
            src={Facebook}
            width={20}
            alt="Icone do Facebook"
            className="mr-2"
          />
          Entrar com Facebook
        </Button>
      </div>
      <div className="mt-4 text-center space-y-2">
        <Button
          variant="link"
          onClick={onRecuperarSenha}
          className="text-blue-400 hover:underline"
        >
          Esqueceu sua senha?
        </Button>
        <Button
          variant="link"
          onClick={onCriarConta}
          className="text-blue-400 hover:underline"
        >
          Criar uma conta
        </Button>
      </div>
    </div>
  )
}
