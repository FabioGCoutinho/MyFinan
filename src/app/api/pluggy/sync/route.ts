import {
  type PluggyWebhook,
  createEmptySyncSummary,
  deletePluggyWebhook,
  fetchPluggyAccounts,
  fetchPluggyItem,
  fetchPluggyTransactions,
  getPluggyApiKey,
  hasPluggyCredentials,
  isUserAllowedPluggy,
  listPluggyWebhooks,
  parseEnvPluggyItemIds,
  registerPluggyWebhook,
  syncPluggyTransactionsForAccount,
} from '@/lib/pluggy'
import type { CreditCard } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/server'
import { format, subDays } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

interface PluggyItemRow {
  id: number
  user_id: string
  item_id: string
  connector_name: string | null
  last_sync_at: string | null
  created_at: string
}

const DEFAULT_WEBHOOK_URL = 'https://app.myfinan.com.br/api/pluggy/webhook'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isUserAllowedPluggy(user.email)) {
    return NextResponse.json({ allowed: false }, { status: 200 })
  }

  const envItemIds = parseEnvPluggyItemIds()
  const envSet = new Set(envItemIds)
  const credentialsConfigured = hasPluggyCredentials()

  const [{ data: dbItems }, { count: totalSynced }, { data: webhookLogs }] =
    await Promise.all([
      supabase
        .from('pluggy_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pluggy_synced_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('pluggy_webhook_logs')
        .select('id, event, item_id, account_id, details, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  let webhooks: PluggyWebhook[] = []
  if (credentialsConfigured) {
    try {
      const apiKey = await getPluggyApiKey()
      webhooks = await listPluggyWebhooks(apiKey)
    } catch {
      // Ignore Pluggy API errors during passive status fetch
    }
  }

  const typedDbItems = (dbItems ?? []) as PluggyItemRow[]
  const dbMap = new Map(typedDbItems.map(item => [item.item_id, item]))

  const items = [
    ...envItemIds
      .filter(id => !dbMap.has(id))
      .map(id => ({
        item_id: id,
        connector_name: 'Configurado via .env',
        last_sync_at: null as string | null,
        isEnv: true,
      })),
    ...typedDbItems.map(row => ({
      item_id: row.item_id,
      connector_name: row.connector_name || 'Open Finance',
      last_sync_at: row.last_sync_at,
      isEnv: envSet.has(row.item_id),
    })),
  ]

  const lastSyncAt = typedDbItems.reduce<string | null>((latest, row) => {
    if (!row.last_sync_at) return latest
    if (!latest) return row.last_sync_at
    return new Date(row.last_sync_at) > new Date(latest)
      ? row.last_sync_at
      : latest
  }, null)

  return NextResponse.json({
    allowed: true,
    hasCredentials: credentialsConfigured,
    items,
    totalSynced: totalSynced ?? 0,
    lastSyncAt,
    webhooks,
    webhookLogs: webhookLogs ?? [],
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  if (!isUserAllowedPluggy(user.email)) {
    return NextResponse.json(
      { error: 'Acesso não autorizado para esta funcionalidade.' },
      { status: 403 }
    )
  }

  let body: {
    action?: string
    webhookUrl?: string
    itemId?: string
    connectorName?: string
  }
  try {
    body = (await request.json()) as {
      action?: string
      webhookUrl?: string
      itemId?: string
      connectorName?: string
    }
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição inválido.' },
      { status: 400 }
    )
  }

  if (body.action === 'register_webhook') {
    const webhookUrl = (body.webhookUrl || DEFAULT_WEBHOOK_URL).trim()

    if (
      !webhookUrl.startsWith('https://') ||
      /localhost|127\.0\.0\.1/i.test(webhookUrl)
    ) {
      return NextResponse.json(
        {
          error:
            'Informe uma URL pública HTTPS válida (não-localhost), ex: https://app.myfinan.com.br/api/pluggy/webhook.',
        },
        { status: 400 }
      )
    }

    try {
      const apiKey = await getPluggyApiKey()
      const existing = await listPluggyWebhooks(apiKey)
      const matched = existing.find(
        w => w.url === webhookUrl && w.event === 'all' && !w.disabledAt
      )

      const webhook =
        matched ??
        (await registerPluggyWebhook(
          apiKey,
          webhookUrl,
          'all',
          process.env.PLUGGY_WEBHOOK_SECRET?.trim()
        ))

      const webhooks = await listPluggyWebhooks(apiKey)
      return NextResponse.json({
        webhook,
        webhooks,
        alreadyExists: Boolean(matched),
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao registrar webhook.'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  const cleanItemId = body.itemId?.trim() || ''
  if (!cleanItemId) {
    return NextResponse.json(
      { error: 'Informe um Item ID válido do Pluggy.' },
      { status: 400 }
    )
  }

  let resolvedConnectorName = body.connectorName?.trim() || 'Conta Open Finance'

  if (hasPluggyCredentials()) {
    try {
      const apiKey = await getPluggyApiKey()
      const itemDetails = await fetchPluggyItem(apiKey, cleanItemId)
      if (itemDetails.connectorName) {
        resolvedConnectorName = itemDetails.connectorName
      }
    } catch (err) {
      console.warn('Não foi possível consultar detalhes do item no Pluggy:', err)
    }
  }

  const { data, error } = await supabase
    .from('pluggy_items')
    .upsert(
      {
        user_id: user.id,
        item_id: cleanItemId,
        connector_name: resolvedConnectorName,
      },
      { onConflict: 'user_id,item_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  if (!isUserAllowedPluggy(user.email)) {
    return NextResponse.json(
      { error: 'Acesso não autorizado para esta funcionalidade.' },
      { status: 403 }
    )
  }

  const webhookId = request.nextUrl.searchParams.get('webhookId')?.trim() || ''
  if (webhookId) {
    try {
      const apiKey = await getPluggyApiKey()
      await deletePluggyWebhook(apiKey, webhookId)
      const webhooks = await listPluggyWebhooks(apiKey)
      return NextResponse.json({ deleted: true, webhooks })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao remover webhook.'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  let itemId = request.nextUrl.searchParams.get('itemId')?.trim() || ''
  if (!itemId) {
    try {
      const body = (await request.json()) as { itemId?: string }
      itemId = body.itemId?.trim() || ''
    } catch {
      // ignore empty body
    }
  }

  if (!itemId) {
    return NextResponse.json(
      { error: 'Informe o Item ID para remover.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('pluggy_items')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', itemId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  if (!isUserAllowedPluggy(user.email)) {
    return NextResponse.json(
      { error: 'Acesso não autorizado para esta funcionalidade.' },
      { status: 403 }
    )
  }

  let body: { days?: number; ignoreBillPayments?: boolean; itemIds?: string[] } =
    {}
  try {
    body = (await request.json()) as {
      days?: number
      ignoreBillPayments?: boolean
      itemIds?: string[]
    }
  } catch {
    // Allow empty POST body
  }

  const days = Math.min(Math.max(Number(body.days) || 45, 1), 365)
  const ignoreBillPayments = body.ignoreBillPayments ?? true

  const [{ data: dbItems }, { data: syncedRows }, { data: existingCards }] =
    await Promise.all([
      supabase
        .from('pluggy_items')
        .select('item_id, connector_name')
        .eq('user_id', user.id),
      supabase
        .from('pluggy_synced_transactions')
        .select('pluggy_transaction_id')
        .eq('user_id', user.id)
        .limit(10000),
      supabase.from('credit_card').select('*').eq('user_id', user.id),
    ])

  const envItemIds = parseEnvPluggyItemIds()
  const dbItemIds = (dbItems ?? [])
    .map((r: { item_id: string }) => r.item_id.trim())
    .filter(Boolean)

  const requestedItemIds = Array.isArray(body.itemIds)
    ? body.itemIds.map(id => id.trim()).filter(Boolean)
    : []

  const itemIds = Array.from(
    new Set(
      requestedItemIds.length > 0
        ? requestedItemIds
        : [...envItemIds, ...dbItemIds]
    )
  )

  if (itemIds.length === 0) {
    return NextResponse.json(
      {
        error:
          'Nenhum Item ID do Pluggy configurado. Adicione o PLUGGY_ITEM_IDS no .env.local ou cadastre nas Configurações.',
      },
      { status: 400 }
    )
  }

  let apiKey: string
  try {
    apiKey = await getPluggyApiKey()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro ao autenticar no Pluggy.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const now = new Date()
  const to = format(now, 'yyyy-MM-dd')
  const from = format(subDays(now, days), 'yyyy-MM-dd')

  const syncedSet = new Set<string>(
    (syncedRows ?? []).map(
      (r: { pluggy_transaction_id: string }) => r.pluggy_transaction_id
    )
  )
  const cards = [...((existingCards ?? []) as CreditCard[])]

  const summary = createEmptySyncSummary()
  const itemErrors: string[] = []

  for (const itemId of itemIds) {
    try {
      let connectorName =
        (dbItems ?? []).find(
          (d: { item_id: string; connector_name: string | null }) =>
            d.item_id === itemId
        )?.connector_name || 'Open Finance'

      try {
        const itemInfo = await fetchPluggyItem(apiKey, itemId)
        connectorName = itemInfo.connectorName || connectorName
      } catch {
        // Proceed to fetch accounts even if item endpoint fails
      }

      const accounts = await fetchPluggyAccounts(apiKey, itemId)

      for (const account of accounts) {
        const transactions = await fetchPluggyTransactions(
          apiKey,
          account.id,
          from,
          to
        )

        await syncPluggyTransactionsForAccount({
          supabase,
          userId: user.id,
          account,
          connectorName,
          transactions,
          syncedSet,
          cards,
          summary,
          ignoreBillPayments,
        })
      }

      await supabase.from('pluggy_items').upsert(
        {
          user_id: user.id,
          item_id: itemId,
          connector_name: connectorName,
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,item_id' }
      )
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Erro ao sincronizar item ${itemId}`
      itemErrors.push(msg)
    }
  }

  revalidatePath('/dashboard', 'page')
  revalidatePath('/despesas', 'page')
  revalidatePath('/receitas', 'page')
  revalidatePath('/cartao', 'page')

  const totalImported =
    summary.expensesAdded + summary.revenuesAdded + summary.cardExpensesAdded

  if (itemErrors.length > 0 && totalImported === 0 && itemErrors.length === itemIds.length) {
    return NextResponse.json(
      { error: itemErrors.join(' | '), summary },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    period: { from, to, days },
    summary,
    warnings: itemErrors.length > 0 ? itemErrors : undefined,
  })
}
