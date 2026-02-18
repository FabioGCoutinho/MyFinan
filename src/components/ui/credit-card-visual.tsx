'use client'

import {
  AmexLogo,
  EloLogo,
  HipercardLogo,
  MastercardLogo,
  VisaLogo,
} from '@/components/icons'
import type { CreditCard } from '@/lib/credit-card'
import { cn } from '@/lib/utils'
import { Wifi } from 'lucide-react'

/**
 * Mapeia cada bandeira para um gradiente de fundo.
 * As cores foram escolhidas para remeter à identidade visual de cada bandeira.
 */
const brandGradients: Record<string, string> = {
  visa: 'from-blue-900 via-blue-800 to-indigo-900',
  mastercard: 'from-gray-900 via-gray-800 to-gray-900',
  elo: 'from-cyan-900 via-teal-800 to-cyan-900',
  amex: 'from-sky-800 via-sky-700 to-sky-900',
  hipercard: 'from-red-950 via-red-900 to-red-950',
}

function BrandLogo({
  brand,
  className,
}: { brand: string; className?: string }) {
  switch (brand) {
    case 'visa':
      return <VisaLogo className={className} />
    case 'mastercard':
      return <MastercardLogo className={className} />
    case 'elo':
      return <EloLogo className={className} />
    case 'amex':
      return <AmexLogo className={className} />
    case 'hipercard':
      return <HipercardLogo className={className} />
    default:
      return null
  }
}

interface CreditCardVisualProps {
  card: CreditCard
  selected?: boolean
  selectable?: boolean
  onClick?: () => void
  className?: string
}

export function CreditCardVisual({
  card,
  selected = false,
  selectable = false,
  onClick,
  className,
}: CreditCardVisualProps) {
  const gradient = brandGradients[card.brand] || 'from-gray-800 to-gray-900'

  return (
    <div
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
      className={cn(
        'relative w-full aspect-[1.586/1] max-w-[340px] rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-xl transition-all duration-300',
        `bg-gradient-to-br ${gradient}`,
        selectable && 'cursor-pointer hover:scale-[1.03] hover:shadow-2xl',
        selected &&
          'ring-3 ring-brand ring-offset-2 ring-offset-background scale-[1.03]',
        className
      )}
    >
      {/* Padrão decorativo de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/30" />
        <div className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-white/20" />
      </div>

      {/* Conteúdo do cartão */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Topo: banco + contactless */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest uppercase opacity-90">
            {card.bank}
          </span>
          <Wifi className="h-5 w-5 rotate-90 opacity-70" />
        </div>

        {/* Chip */}
        <div className="flex items-center gap-3 my-auto">
          <div className="h-9 w-12 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-inner" />
        </div>

        {/* Número (mascarado) */}
        <div className="space-y-3">
          <p
            className={cn(
              'text-sm base sm:text-lg tracking-[0.2em] font-mono',
              selected && 'font-mono sm:text-sm base tracking-[0.2em]',
              className
            )}
          >
            •••• •••• •••• {card.last_digits}
          </p>

          {/* Rodapé: nome + bandeira */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase opacity-60 tracking-wider">
                {card.name}
              </p>
              <p className="text-[10px] uppercase opacity-50 mt-0.5">
                Venc. {String(card.due_day).padStart(2, '0')} · Fech.{' '}
                {String(card.closing_day).padStart(2, '0')}
              </p>
            </div>
            <BrandLogo
              brand={card.brand}
              className="h-10 w-16 object-contain drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Overlay de seleção */}
      {selectable && selected && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-brand/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-foreground shadow-lg">
            ✓ Selecionado
          </div>
        </div>
      )}
    </div>
  )
}
