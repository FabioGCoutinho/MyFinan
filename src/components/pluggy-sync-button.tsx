'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PluggySyncResponse {
  success?: boolean
  error?: string
  warnings?: string[]
  summary?: {
    expensesAdded: number
    revenuesAdded: number
    cardExpensesAdded: number
    cardsCreated: number
    skippedDuplicates: number
    ignoredBillPayments: number
  }
}

interface PluggyStatusResponse {
  allowed: boolean
  hasCredentials?: boolean
  items?: { item_id: string }[]
  lastSyncAt?: string | null
}

interface PluggySyncButtonProps {
  onSyncSuccess?: () => void | Promise<void>
  className?: string
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export function PluggySyncButton({
  onSyncSuccess,
  className,
}: PluggySyncButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [allowed, setAllowed] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const onSyncSuccessRef = useRef(onSyncSuccess)
  onSyncSuccessRef.current = onSyncSuccess

  const runSync = useCallback(
    async (silent: boolean) => {
      setSyncing(true)
      try {
        const res = await fetch('/api/pluggy/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: 45, ignoreBillPayments: true }),
        })

        const data = (await res.json()) as PluggySyncResponse

        if (!res.ok) {
          if (!silent) {
            toast({
              variant: 'destructive',
              title: 'Erro ao sincronizar Pluggy',
              description:
                data.error || 'Não foi possível buscar os dados do Open Finance.',
            })
          }
          return
        }

        const summary = data.summary
        if (!summary) return

        const totalImported =
          summary.expensesAdded +
          summary.revenuesAdded +
          summary.cardExpensesAdded

        if (totalImported > 0) {
          toast({
            title: 'Open Finance sincronizado!',
            description: `${summary.expensesAdded} despesa(s), ${summary.cardExpensesAdded} compra(s) no cartão e ${summary.revenuesAdded} receita(s) importada(s).`,
          })
          await onSyncSuccessRef.current?.()
          router.refresh()
        } else if (!silent) {
          toast({
            title: 'Tudo atualizado!',
            description: 'Nenhuma nova transação encontrada nos últimos 45 dias.',
          })
        }
      } catch {
        if (!silent) {
          toast({
            variant: 'destructive',
            title: 'Erro de conexão',
            description: 'Falha ao conectar com a rota de sincronização.',
          })
        }
      } finally {
        setSyncing(false)
      }
    },
    [router, toast]
  )

  useEffect(() => {
    let active = true

    async function checkAccessAndAutoSync() {
      try {
        const res = await fetch('/api/pluggy/sync', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as PluggyStatusResponse
        if (!active || !data.allowed) return

        setAllowed(true)

        const hasItems =
          Boolean(data.hasCredentials) &&
          Array.isArray(data.items) &&
          data.items.length > 0

        if (!hasItems) return

        const isStale =
          !data.lastSyncAt ||
          Date.now() - new Date(data.lastSyncAt).getTime() > SIX_HOURS_MS

        if (
          isStale &&
          typeof window !== 'undefined' &&
          sessionStorage.getItem('pluggy_autosync_done') !== '1'
        ) {
          sessionStorage.setItem('pluggy_autosync_done', '1')
          await runSync(true)
        }
      } catch {
        // Ignore silent status check failures
      }
    }

    checkAccessAndAutoSync()

    return () => {
      active = false
    }
  }, [runSync])

  if (!allowed) return null

  return (
    <Button
      type="button"
      variant="outline"
      disabled={syncing}
      onClick={() => runSync(false)}
      className={cn(
        'font-semibold gap-2 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40',
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Open Finance'}
    </Button>
  )
}
