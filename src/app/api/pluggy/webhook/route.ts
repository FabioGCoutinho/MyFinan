import type { CreditCard } from '@/lib/credit-card'
import {
  PLUGGY_AUTHORIZED_USER_ID,
  type PluggyTransaction,
  buildUpdatedRecordFields,
  createEmptySyncSummary,
  fetchPluggyAccountById,
  fetchPluggyAccounts,
  fetchPluggyItem,
  fetchPluggyTransactions,
  fetchPluggyTransactionsByIds,
  getPluggyApiKey,
  syncPluggyTransactionsForAccount,
} from '@/lib/pluggy'
import { createServerClient } from '@supabase/ssr'
import { format, subDays } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

interface PluggyWebhookPayload {
  event?: string
  eventId?: string
  itemId?: string
  accountId?: string
  transactionIds?: string[]
  deletedTransactionIds?: string[]
  ids?: string[]
  createdTransactionsCount?: number
  error?: { code?: string; message?: string }
}

function createWebhookSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://kzlifujmpgnasvchfpzh.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlmdWptcGduYXN2Y2hmcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzY0MjAsImV4cCI6MjA0MzgxMjQyMH0.wUzeee7YjhLVRRXdDTwg67Gpi59SmkAfRukbGrae8DU',
    {
      global: {
        headers: {
          'x-pluggy-internal-secret':
            process.env.PLUGGY_CLIENT_SECRET?.trim() || '',
        },
      },
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

function extractTransactionIds(body: PluggyWebhookPayload): string[] {
  const candidates =
    body.transactionIds ?? body.deletedTransactionIds ?? body.ids ?? []
  if (!Array.isArray(candidates)) return []
  return candidates
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    .map(id => id.trim())
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/pluggy/webhook',
  })
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET?.trim()
  if (
    webhookSecret &&
    request.headers.get('x-pluggy-webhook-secret') !== webhookSecret
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PluggyWebhookPayload
  try {
    body = (await request.json()) as PluggyWebhookPayload
  } catch {
    return NextResponse.json(
      { error: 'Corpo JSON inválido.' },
      { status: 400 }
    )
  }

  const event = body.event?.trim()
  if (!event) {
    return NextResponse.json(
      { error: 'Campo event ausente.' },
      { status: 400 }
    )
  }

  const userId = PLUGGY_AUTHORIZED_USER_ID
  const supabase = createWebhookSupabaseClient()
  const itemId = body.itemId?.trim() || null
  const accountId = body.accountId?.trim() || null
  const txIds = extractTransactionIds(body)

  try {
    if (event === 'transactions/deleted') {
      let deletedCount = 0

      if (txIds.length > 0) {
        const { data: matchedRows, error: fetchError } = await supabase
          .from('pluggy_synced_transactions')
          .select('pluggy_transaction_id, target_table, record_id')
          .eq('user_id', userId)
          .in('pluggy_transaction_id', txIds)

        if (fetchError) {
          throw new Error(
            `Erro ao consultar transações para exclusão: ${fetchError.message}`
          )
        }

        const idsByTable: Record<
          'expense' | 'revenue' | 'credit_card_expense',
          number[]
        > = {
          expense: [],
          revenue: [],
          credit_card_expense: [],
        }

        const typedMatchedRows = (matchedRows ?? []) as {
          pluggy_transaction_id: string
          target_table: string
          record_id: number | null
        }[]

        for (const row of typedMatchedRows) {
          if (
            row.record_id != null &&
            (row.target_table === 'expense' ||
              row.target_table === 'revenue' ||
              row.target_table === 'credit_card_expense')
          ) {
            idsByTable[row.target_table].push(Number(row.record_id))
          }
        }

        for (const table of [
          'expense',
          'revenue',
          'credit_card_expense',
        ] as const) {
          if (idsByTable[table].length > 0) {
            const { error: deleteRecError } = await supabase
              .from(table)
              .delete()
              .eq('user_id', userId)
              .in('id', idsByTable[table])
            if (deleteRecError) {
              throw new Error(
                `Erro ao excluir registros em ${table}: ${deleteRecError.message}`
              )
            }
          }
        }

        const { error: deleteLogError } = await supabase
          .from('pluggy_synced_transactions')
          .delete()
          .eq('user_id', userId)
          .in('pluggy_transaction_id', txIds)

        if (deleteLogError) {
          throw new Error(
            `Erro ao remover rastreamento de transações: ${deleteLogError.message}`
          )
        }

        deletedCount = (matchedRows ?? []).length
      }

      await supabase.from('pluggy_webhook_logs').insert({
        user_id: userId,
        event,
        item_id: itemId,
        account_id: accountId,
        details: {
          eventId: body.eventId ?? null,
          deletedIds: txIds,
          deletedCount,
        },
      })
    } else if (event === 'transactions/updated') {
      let updatedCount = 0
      const summary = createEmptySyncSummary()

      if (accountId && txIds.length > 0) {
        const apiKey = await getPluggyApiKey()
        const [account, txs] = await Promise.all([
          fetchPluggyAccountById(apiKey, accountId),
          fetchPluggyTransactionsByIds(apiKey, accountId, txIds),
        ])

        const resolvedItemId = itemId || account.itemId || null
        let connectorName = 'Open Finance'
        if (resolvedItemId) {
          try {
            const itemInfo = await fetchPluggyItem(apiKey, resolvedItemId)
            connectorName = itemInfo.connectorName || connectorName
          } catch {
            // Keep default connector name
          }
        }

        const { data: syncedRows } = await supabase
          .from('pluggy_synced_transactions')
          .select('pluggy_transaction_id, target_table, record_id')
          .eq('user_id', userId)
          .in('pluggy_transaction_id', txIds)

        const syncMap = new Map(
          (syncedRows ?? []).map(row => [row.pluggy_transaction_id, row])
        )
        const newlyPostedTxs: PluggyTransaction[] = []

        for (const tx of txs) {
          const existing = syncMap.get(tx.id)
          if (!existing) {
            newlyPostedTxs.push(tx)
            continue
          }

          if (
            existing.record_id != null &&
            (existing.target_table === 'expense' ||
              existing.target_table === 'revenue' ||
              existing.target_table === 'credit_card_expense')
          ) {
            const fields = buildUpdatedRecordFields(
              account,
              tx,
              existing.target_table
            )
            if (fields) {
              const { error: updateErr } = await supabase
                .from(existing.target_table)
                .update(fields)
                .eq('id', existing.record_id)
                .eq('user_id', userId)

              if (updateErr) {
                throw new Error(
                  `Erro ao atualizar transação ${tx.id}: ${updateErr.message}`
                )
              }
              updatedCount += 1
            }
          }
        }

        if (newlyPostedTxs.length > 0) {
          const { data: existingCards } = await supabase
            .from('credit_card')
            .select('*')
            .eq('user_id', userId)

          await syncPluggyTransactionsForAccount({
            supabase,
            userId,
            account,
            connectorName,
            transactions: newlyPostedTxs,
            syncedSet: new Set<string>(),
            cards: [...((existingCards ?? []) as CreditCard[])],
            summary,
            ignoreBillPayments: true,
          })
        }

        if (resolvedItemId) {
          await supabase.from('pluggy_items').upsert(
            {
              user_id: userId,
              item_id: resolvedItemId,
              connector_name: connectorName,
              last_sync_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,item_id' }
          )
        }
      }

      await supabase.from('pluggy_webhook_logs').insert({
        user_id: userId,
        event,
        item_id: itemId,
        account_id: accountId,
        details: {
          eventId: body.eventId ?? null,
          updatedIds: txIds,
          updatedCount,
          summary,
        },
      })
    } else if (
      event === 'transactions/created' ||
      event === 'item/created' ||
      event === 'item/updated'
    ) {
      const apiKey = await getPluggyApiKey()
      let resolvedItemId = itemId
      let connectorName = 'Open Finance'

      const accounts = accountId
        ? [await fetchPluggyAccountById(apiKey, accountId)]
        : resolvedItemId
          ? await fetchPluggyAccounts(apiKey, resolvedItemId)
          : []

      if (!resolvedItemId && accounts[0]?.itemId) {
        resolvedItemId = accounts[0].itemId
      }

      if (resolvedItemId) {
        try {
          const itemInfo = await fetchPluggyItem(apiKey, resolvedItemId)
          connectorName = itemInfo.connectorName || connectorName
        } catch {
          // Keep default connector name
        }
      }

      const [{ data: syncedRows }, { data: existingCards }] = await Promise.all([
        supabase
          .from('pluggy_synced_transactions')
          .select('pluggy_transaction_id')
          .eq('user_id', userId)
          .limit(10000),
        supabase.from('credit_card').select('*').eq('user_id', userId),
      ])

      const syncedSet = new Set<string>(
        (syncedRows ?? []).map(
          (r: { pluggy_transaction_id: string }) => r.pluggy_transaction_id
        )
      )
      const cards = [...((existingCards ?? []) as CreditCard[])]
      const summary = createEmptySyncSummary()

      const now = new Date()
      const to = format(now, 'yyyy-MM-dd')
      const from = format(subDays(now, 90), 'yyyy-MM-dd')

      for (const account of accounts) {
        const transactions = await fetchPluggyTransactions(
          apiKey,
          account.id,
          from,
          to
        )

        await syncPluggyTransactionsForAccount({
          supabase,
          userId,
          account,
          connectorName,
          transactions,
          syncedSet,
          cards,
          summary,
          ignoreBillPayments: true,
        })
      }

      if (resolvedItemId) {
        await supabase.from('pluggy_items').upsert(
          {
            user_id: userId,
            item_id: resolvedItemId,
            connector_name: connectorName,
            last_sync_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,item_id' }
        )
      }

      await supabase.from('pluggy_webhook_logs').insert({
        user_id: userId,
        event,
        item_id: resolvedItemId,
        account_id: accountId,
        details: {
          eventId: body.eventId ?? null,
          createdTransactionsCount: body.createdTransactionsCount ?? null,
          summary,
        },
      })
    } else {
      await supabase.from('pluggy_webhook_logs').insert({
        user_id: userId,
        event,
        item_id: itemId,
        account_id: accountId,
        details: {
          eventId: body.eventId ?? null,
          error: body.error ?? null,
        },
      })
    }

    revalidatePath('/dashboard', 'page')
    revalidatePath('/despesas', 'page')
    revalidatePath('/receitas', 'page')
    revalidatePath('/cartao', 'page')

    return NextResponse.json({ ok: true, event })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro ao processar webhook Pluggy.'
    console.error('[Pluggy Webhook Error]', event, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
