'use client'
import { Button } from '@/components/ui/button'
import { TriangleAlertIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function error() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen p-4">
      <div className="flex flex-col items-center border border-red-300 rounded-lg shadow-lg p-8">
        <div className="mb-4">
          <TriangleAlertIcon className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Erro ao fazer login
        </h1>
        <p className="text-gray-700 mb-6">
          Dados do usuário incorretos!
          <br />
          Por favor, verifique seu e-mail e senha e tente novamente.
        </p>
        <Button
          type="submit"
          className="w-full bg-button text-button-foreground "
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </div>
    </div>
  )
}
