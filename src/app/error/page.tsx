'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function error() {
  const router = useRouter()

  return (
    <div className="items-center justify-center h-screen w-screen flex flex-col">
      <div>
        <Button variant="link" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
      <div>
        <h1>Dados do usuario incorretos!</h1>
      </div>
    </div>
  )
}
