'use client'

import { useState } from 'react'
import Image from 'next/image'
import LoginForm from '@/components/loginForm'
import RecuperarSenha from '@/components/recoverPassword'
import CriarConta from '@/components/createAccount'
import WelcomeMessage from '@/components/welcomeMessage'

type FormType = 'login' | 'recuperarSenha' | 'criarConta'

import background from './background.jpg'

export default function LoginPage() {
  const [currentForm, setCurrentForm] = useState<FormType>('login')

  const renderForm = () => {
    switch (currentForm) {
      case 'login':
        return (
          <LoginForm
            onRecuperarSenha={() => setCurrentForm('recuperarSenha')}
            onCriarConta={() => setCurrentForm('criarConta')}
          />
        )
      case 'recuperarSenha':
        return <RecuperarSenha onVoltar={() => setCurrentForm('login')} />
      case 'criarConta':
        return <CriarConta onVoltar={() => setCurrentForm('login')} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-white">
      <div className="relative flex-grow">
        <Image
          src="/background.jpg"
          alt="Fundo de finanças"
          priority={true}
          fill={true}
          className="z-0 opacity-50 bg-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50 z-10" />
        <div className="absolute inset-0 flex items-center justify-center z-20 lg:hidden">
          {renderForm()}
        </div>
        <div className="hidden lg:flex absolute inset-0 items-center justify-center z-20">
          <WelcomeMessage />
        </div>
      </div>
      <div className="hidden lg:flex w-1/3 items-center justify-center">
        {renderForm()}
      </div>
    </div>
  )
}
