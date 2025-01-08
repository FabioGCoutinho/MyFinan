'use client'

import { useState } from 'react'
import Image from 'next/image'
import LoginForm from '@/components/loginForm'
import RecuperarSenha from '@/components/recoverPassword'
import CriarConta from '@/components/createAccount'
import WelcomeMessage from '@/components/welcomeMessage'

type FormType = 'login' | 'recuperarSenha' | 'criarConta'

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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      <div className="relative flex-grow">
        <Image
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          alt="Fundo de finanças"
          priority={true}
          fill={true}
          className="z-0 opacity-50 bg-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50 z-10" />
        <div className="absolute inset-0 flex items-center justify-center z-20 md:hidden">
          {renderForm()}
        </div>
        <div className="hidden md:flex absolute inset-0 items-center justify-center z-20">
          <WelcomeMessage />
        </div>
      </div>
      <div className="hidden md:flex w-1/3 bg-gray-800 items-center justify-center">
        {renderForm()}
      </div>
    </div>
  )
}
