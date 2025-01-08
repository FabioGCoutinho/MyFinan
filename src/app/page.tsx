'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    redirect('/login')
  }, [])

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      <h1>Bem vindo</h1>
    </div>
  )
}
