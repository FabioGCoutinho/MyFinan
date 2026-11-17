'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Globe,
  Landmark,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface PluggyItemEntry {
  item_id: string
  connector_name: string
  last_sync_at: string | null
  isEnv: boolean
}

interface PluggyWebhookEntry {
  id: string
  url: string
  event: string
  disabledAt?: string | null
  createdAt?: string
}

interface PluggyWebhookLogEntry {
  id: number
  event: string
  item_id: string | null
  account_id: string | null
  details?: Record<string, unknown> | null
  created_at: string
}

interface PluggyStatusData {
  allowed: boolean
  hasCredentials?: boolean
  items?: PluggyItemEntry[]
  totalSynced?: number
  lastSyncAt?: string | null
  webhooks?: PluggyWebhookEntry[]
  webhookLogs?: PluggyWebhookLogEntry[]
}

interface SyncResultSummary {
  expensesAdded: number
  revenuesAdded: number
  cardExpensesAdded: number
  cardsCreated: number
  skippedDuplicates: number
  ignoredBillPayments: number
}

export function PluggyConfigSection() {
  const router = useRouter()
  const [status, setStatus] = useState<PluggyStatusData | null>(null)
  const [loading, setLoading] = useState(true)

  const [newItemId, setNewItemId] = useState('')
  const [newConnectorName, setNewConnectorName] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const [days, setDays] = useState('45')
  const [syncing, setSyncing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(
    'https://app.myfinan.com.br/api/pluggy/webhook'
  )
  const [registeringWebhook, setRegisteringWebhook] = useState(false)
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(
    null
  )
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
    summary?: SyncResultSummary
  } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pluggy/sync', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as PluggyStatusData
      setStatus(data)
    } catch {
      // ignore error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const handleRefresh = () => {
      fetchStatus()
    }
    window.addEventListener('pluggy:refresh', handleRefresh)
    return () => {
      window.removeEventListener('pluggy:refresh', handleRefresh)
    }
  }, [fetchStatus])

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemId.trim()) return

    setSavingItem(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: newItemId.trim(),
          connectorName: newConnectorName.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Erro ao adicionar Item ID.',
        })
        return
      }

      setNewItemId('')
      setNewConnectorName('')
      setFeedback({
        type: 'success',
        text: 'Item ID adicionado com sucesso!',
      })
      await fetchStatus()
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de comunicação ao salvar o Item ID.',
      })
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteItem(itemId: string) {
    setDeletingItemId(itemId)
    setFeedback(null)

    try {
      const res = await fetch(
        `/api/pluggy/sync?itemId=${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      )
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Erro ao remover Item ID.',
        })
        return
      }

      await fetchStatus()
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de comunicação ao remover o Item ID.',
      })
    } finally {
      setDeletingItemId(null)
    }
  }

  async function handleSyncNow() {
    setSyncing(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: Number(days),
          ignoreBillPayments: true,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        warnings?: string[]
        summary?: SyncResultSummary
      }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Falha ao sincronizar com o Pluggy.',
        })
        return
      }

      setFeedback({
        type: 'success',
        text: data.warnings?.length
          ? `Sincronização parcial: ${data.warnings.join(' | ')}`
          : 'Sincronização concluída com sucesso!',
        summary: data.summary,
      })

      await fetchStatus()
      router.refresh()
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de rede ao tentar sincronizar com o Pluggy.',
      })
    } finally {
      setSyncing(false)
    }
  }

  async function handleRegisterWebhook(e: React.FormEvent) {
    e.preventDefault()
    if (!webhookUrl.trim()) return

    setRegisteringWebhook(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_webhook',
          webhookUrl: webhookUrl.trim(),
        }),
      })
      const data = (await res.json()) as {
        error?: string
        alreadyExists?: boolean
        webhooks?: PluggyWebhookEntry[]
      }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Erro ao registrar webhook no Pluggy.',
        })
        return
      }

      setFeedback({
        type: 'success',
        text: data.alreadyExists
          ? 'Webhook já estava registrado e ativo para o evento "all".'
          : 'Webhook registrado no Pluggy para o evento "all" com sucesso!',
      })
      await fetchStatus()
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de comunicação ao registrar o webhook.',
      })
    } finally {
      setRegisteringWebhook(false)
    }
  }

  async function handleDeleteWebhook(webhookId: string) {
    setDeletingWebhookId(webhookId)
    setFeedback(null)

    try {
      const res = await fetch(
        `/api/pluggy/sync?webhookId=${encodeURIComponent(webhookId)}`,
        { method: 'DELETE' }
      )
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Erro ao remover webhook do Pluggy.',
        })
        return
      }

      setFeedback({
        type: 'success',
        text: 'Webhook removido do Pluggy.',
      })
      await fetchStatus()
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de comunicação ao remover o webhook.',
      })
    } finally {
      setDeletingWebhookId(null)
    }
  }

  if (loading || !status?.allowed) {
    return null
  }

  const items = status.items ?? []
  const webhooks = status.webhooks ?? []
  const webhookLogs = status.webhookLogs ?? []

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm overflow-hidden relative">
      <Landmark className="absolute -right-8 -top-8 w-56 h-56 text-slate-50 dark:text-slate-800/20 pointer-events-none" />

      <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-10">
        <div>
          <p className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
            Exclusivo Open Finance
          </p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Open Finance (Pluggy)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Importação automática de conta corrente, receitas e faturas de cartão.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            status.hasCredentials
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
          }`}
        >
          {status.hasCredentials ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Credenciais Configuradas
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              Pendente no .env.local
            </>
          )}
        </span>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Resumo rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-100/60 dark:bg-slate-950/60 p-4">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Transações já sincronizadas
            </p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {status.totalSynced ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-100/60 dark:bg-slate-950/60 p-4">
            <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Última sincronização
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2">
              {status.lastSyncAt
                ? format(new Date(status.lastSyncAt), "dd 'de' MMM, HH:mm", {
                    locale: ptBR,
                  })
                : 'Ainda não sincronizado'}
            </p>
          </div>
        </div>

        {/* Lista de Item IDs */}
        <div className="space-y-2.5">
          <Label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Conexões Bancárias (Item IDs)
          </Label>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-sm text-slate-500">
              Nenhum Item ID cadastrado. Adicione o UUID do item conectado no
              painel do Pluggy abaixo ou configure em{' '}
              <code className="font-mono text-xs">PLUGGY_ITEM_IDS</code>.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100/60 dark:bg-slate-950/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {item.connector_name}
                      </span>
                      {item.isEnv && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          .env
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                      {item.item_id}
                    </p>
                    {item.last_sync_at && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Sincronizado em{' '}
                        {format(
                          new Date(item.last_sync_at),
                          'dd/MM/yyyy HH:mm',
                          { locale: ptBR }
                        )}
                      </p>
                    )}
                  </div>

                  {!item.isEnv && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={deletingItemId === item.item_id}
                      onClick={() => handleDeleteItem(item.item_id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl shrink-0"
                    >
                      {deletingItemId === item.item_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form para adicionar novo Item ID */}
        <form
          onSubmit={handleAddItem}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1"
        >
          <div className="sm:col-span-6 space-y-1">
            <Label
              htmlFor="pluggyItemId"
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1"
            >
              Novo Item ID (UUID do Pluggy)
            </Label>
            <Input
              id="pluggyItemId"
              placeholder="ex: 8b6e1f2a-..."
              value={newItemId}
              onChange={e => setNewItemId(e.target.value)}
              className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <Label
              htmlFor="pluggyConnectorName"
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1"
            >
              Banco / Apelido (opcional)
            </Label>
            <Input
              id="pluggyConnectorName"
              placeholder="Ex: Nubank, Itaú"
              value={newConnectorName}
              onChange={e => setNewConnectorName(e.target.value)}
              className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <Button
              type="submit"
              disabled={savingItem || !newItemId.trim()}
              variant="secondary"
              className="w-full h-12 rounded-2xl font-bold gap-1.5"
            >
              {savingItem ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Controles de sincronização manual */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              Período de busca
            </Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-bold">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="45">Últimos 45 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="h-12 px-7 rounded-2xl shadow-lg shadow-teal-500/20 font-bold gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
        </div>

        {/* Feedback / Resultado da sincronização */}
        {feedback && (
          <div
            className={`rounded-2xl p-4 text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            }`}
          >
            <p>{feedback.text}</p>
            {feedback.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs font-bold">
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Despesas: +{feedback.summary.expensesAdded}
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Cartão: +{feedback.summary.cardExpensesAdded}
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Receitas: +{feedback.summary.revenuesAdded}
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Cartões criados: {feedback.summary.cardsCreated}
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Duplicadas ignoradas: {feedback.summary.skippedDuplicates}
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
                  Faturas ignoradas: {feedback.summary.ignoredBillPayments}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Webhooks (Tempo Real) */}
        <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div>
            <Label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
              Webhooks (Tempo Real)
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-1">
              Recebe eventos automáticos do Pluggy (<code className="font-mono">item/created</code>,{' '}
              <code className="font-mono">item/updated</code>,{' '}
              <code className="font-mono">transactions/created</code>,{' '}
              <code className="font-mono">transactions/updated</code>,{' '}
              <code className="font-mono">transactions/deleted</code> via evento{' '}
              <code className="font-mono font-bold">all</code>).
            </p>
          </div>

          <form
            onSubmit={handleRegisterWebhook}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              id="pluggyWebhookUrl"
              type="url"
              placeholder="https://app.myfinan.com.br/api/pluggy/webhook"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="h-12 flex-1 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-mono text-xs sm:text-sm"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={
                registeringWebhook ||
                !webhookUrl.trim() ||
                !status.hasCredentials
              }
              className="h-12 px-5 rounded-2xl font-bold gap-2 shrink-0"
            >
              {registeringWebhook ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              Registrar Webhook
            </Button>
          </form>

          {webhooks.length > 0 ? (
            <div className="space-y-2">
              {webhooks.map(webhook => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100/60 dark:bg-slate-950/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 font-mono">
                        {webhook.event}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          webhook.disabledAt
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {webhook.disabledAt ? 'Desativado' : 'Ativo'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate mt-1">
                      {webhook.url}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deletingWebhookId === webhook.id}
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl shrink-0"
                  >
                    {deletingWebhookId === webhook.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 ml-1">
              Nenhum webhook registrado ainda no Pluggy. Clique em &quot;Registrar
              Webhook&quot; após publicar a rota em produção.
            </p>
          )}

          {webhookLogs.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Últimos eventos recebidos
              </p>
              <div className="space-y-1.5">
                {webhookLogs.map(log => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                        {log.event}
                      </span>
                      {log.item_id && (
                        <span className="font-mono text-[11px] text-slate-400 truncate">
                          ({log.item_id.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {format(new Date(log.created_at), 'dd/MM HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
