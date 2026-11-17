import type { CreditCard } from '@/lib/credit-card'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addMonths, format } from 'date-fns'

const PLUGGY_API_URL = 'https://api.pluggy.ai'
const DEFAULT_ALLOWED_EMAIL = 'clowkun@gmail.com'
export const PLUGGY_AUTHORIZED_USER_ID = 'baa171de-85d2-4cba-a9a5-8933a0a039a6'

export type ExpenseCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Vestuário'
  | 'Contas'
  | 'Compras parceladas'
  | 'Impostos'
  | 'Dívidas'
  | 'Doações'
  | 'Outros'

export type RevenueCategory =
  | 'Salário'
  | 'Rendimentos'
  | 'Freelance'
  | 'Bônus'
  | 'Vendas'
  | 'Outros'

export interface PluggyAccount {
  id: string
  itemId?: string
  type: 'BANK' | 'CREDIT'
  subtype: string
  name: string
  number: string
  balance: number
  creditData?: {
    level?: string
    brand?: string
    balanceCloseDate?: string
    balanceDueDate?: string
  } | null
}

export interface PluggyTransaction {
  id: string
  description: string
  descriptionRaw?: string | null
  amount: number
  date: string
  type: 'DEBIT' | 'CREDIT'
  status?: 'POSTED' | 'PENDING'
  category?: string | null
  creditCardMetadata?: {
    installmentNumber?: number
    totalInstallments?: number
    cardNumber?: string
    purchaseDate?: string | null
    billPostDate?: string | null
  } | null
  paymentData?: {
    receiver?: { name?: string }
    payer?: { name?: string }
  } | null
}

export interface PluggyItemDetails {
  id: string
  connectorName: string
  status?: string
}

export interface PluggyWebhook {
  id: string
  url: string
  event: string
  disabledAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PluggySyncSummary {
  expensesAdded: number
  revenuesAdded: number
  cardExpensesAdded: number
  cardsCreated: number
  skippedDuplicates: number
  ignoredBillPayments: number
}

export function isUserAllowedPluggy(email?: string | null): boolean {
  if (!email) return false
  const allowedEmail = (
    process.env.PLUGGY_ALLOWED_EMAIL || DEFAULT_ALLOWED_EMAIL
  )
    .trim()
    .toLowerCase()
  return email.trim().toLowerCase() === allowedEmail
}

export function parseEnvPluggyItemIds(): string[] {
  const raw = process.env.PLUGGY_ITEM_IDS || ''
  return Array.from(
    new Set(
      raw
        .split(',')
        .map(id => id.trim())
        .filter(Boolean)
    )
  )
}

export function hasPluggyCredentials(): boolean {
  return Boolean(
    process.env.PLUGGY_CLIENT_ID?.trim() &&
      process.env.PLUGGY_CLIENT_SECRET?.trim()
  )
}

export async function getPluggyApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID?.trim()
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw new Error(
      'Credenciais PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configuradas no .env.local'
    )
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Falha ao autenticar na API do Pluggy (${response.status}): ${errorText}`
    )
  }

  const data = (await response.json()) as { apiKey?: string }
  if (!data.apiKey) {
    throw new Error('API do Pluggy não retornou uma apiKey válida.')
  }

  return data.apiKey
}

export async function fetchPluggyItem(
  apiKey: string,
  itemId: string
): Promise<PluggyItemDetails> {
  const response = await fetch(
    `${PLUGGY_API_URL}/items/${encodeURIComponent(itemId)}`,
    {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao buscar item ${itemId} no Pluggy (${response.status}): ${errorText}`
    )
  }

  const data = (await response.json()) as {
    id: string
    status?: string
    connector?: { name?: string }
  }

  return {
    id: data.id || itemId,
    connectorName: data.connector?.name || 'Open Finance',
    status: data.status,
  }
}

export async function fetchPluggyAccounts(
  apiKey: string,
  itemId: string
): Promise<PluggyAccount[]> {
  const response = await fetch(
    `${PLUGGY_API_URL}/accounts?itemId=${encodeURIComponent(itemId)}`,
    {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao buscar contas do item ${itemId} (${response.status}): ${errorText}`
    )
  }

  const data = (await response.json()) as { results?: PluggyAccount[] }
  return data.results ?? []
}

export async function fetchPluggyTransactions(
  apiKey: string,
  accountId: string,
  from: string,
  to: string
): Promise<PluggyTransaction[]> {
  const allTransactions: PluggyTransaction[] = []
  let nextQuery: string | null = `?accountId=${encodeURIComponent(accountId)}`
  let pageCount = 0
  const maxPages = 10

  while (nextQuery && pageCount < maxPages) {
    const url = nextQuery.startsWith('http')
      ? nextQuery
      : nextQuery.startsWith('/v2/transactions')
        ? `${PLUGGY_API_URL}${nextQuery}`
        : `${PLUGGY_API_URL}/v2/transactions${nextQuery.startsWith('?') ? nextQuery : `?${nextQuery}`}`

    const response = await fetch(url, {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Erro ao buscar transações da conta ${accountId} (${response.status}): ${errorText}`
      )
    }

    const data = (await response.json()) as {
      results?: PluggyTransaction[]
      next?: string | null
    }

    const results = data.results ?? []
    for (const tx of results) {
      const txDate = (tx.date || '').slice(0, 10)
      if (txDate && txDate >= from && txDate <= to) {
        allTransactions.push(tx)
      }
    }

    nextQuery = data.next || null
    pageCount += 1

    if (!nextQuery || results.length === 0) {
      break
    }
  }

  return allTransactions
}

export async function fetchPluggyAccountById(
  apiKey: string,
  accountId: string
): Promise<PluggyAccount> {
  const response = await fetch(
    `${PLUGGY_API_URL}/accounts/${encodeURIComponent(accountId)}`,
    {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao buscar conta ${accountId} no Pluggy (${response.status}): ${errorText}`
    )
  }

  return (await response.json()) as PluggyAccount
}

export async function fetchPluggyTransactionsByIds(
  apiKey: string,
  accountId: string,
  ids: string[]
): Promise<PluggyTransaction[]> {
  if (ids.length === 0) return []

  const allTransactions: PluggyTransaction[] = []
  const chunkSize = 100

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    let nextQuery: string | null =
      `?accountId=${encodeURIComponent(accountId)}&ids=${encodeURIComponent(chunk.join(','))}`
    let pageCount = 0

    while (nextQuery && pageCount < 10) {
      const url = nextQuery.startsWith('http')
        ? nextQuery
        : nextQuery.startsWith('/v2/transactions')
          ? `${PLUGGY_API_URL}${nextQuery}`
          : `${PLUGGY_API_URL}/v2/transactions${nextQuery.startsWith('?') ? nextQuery : `?${nextQuery}`}`

      const response = await fetch(url, {
        headers: { 'X-API-KEY': apiKey },
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Erro ao buscar transações por ID da conta ${accountId} (${response.status}): ${errorText}`
        )
      }

      const data = (await response.json()) as {
        results?: PluggyTransaction[]
        next?: string | null
      }

      const results = data.results ?? []
      allTransactions.push(...results)
      nextQuery = data.next || null
      pageCount += 1

      if (!nextQuery || results.length === 0) {
        break
      }
    }
  }

  return allTransactions
}

export async function listPluggyWebhooks(
  apiKey: string
): Promise<PluggyWebhook[]> {
  const response = await fetch(`${PLUGGY_API_URL}/webhooks`, {
    headers: { 'X-API-KEY': apiKey },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao listar webhooks no Pluggy (${response.status}): ${errorText}`
    )
  }

  const data = (await response.json()) as
    | { results?: PluggyWebhook[] }
    | PluggyWebhook[]
  return Array.isArray(data) ? data : (data.results ?? [])
}

export async function registerPluggyWebhook(
  apiKey: string,
  url: string,
  event = 'all',
  secret?: string
): Promise<PluggyWebhook> {
  const response = await fetch(`${PLUGGY_API_URL}/webhooks`, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event,
      url,
      ...(secret
        ? { headers: { 'x-pluggy-webhook-secret': secret } }
        : {}),
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao registrar webhook no Pluggy (${response.status}): ${errorText}`
    )
  }

  return (await response.json()) as PluggyWebhook
}

export async function deletePluggyWebhook(
  apiKey: string,
  webhookId: string
): Promise<void> {
  const response = await fetch(
    `${PLUGGY_API_URL}/webhooks/${encodeURIComponent(webhookId)}`,
    {
      method: 'DELETE',
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Erro ao remover webhook no Pluggy (${response.status}): ${errorText}`
    )
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword))
}

export function isCreditCardBillPayment(
  description: string,
  category?: string | null
): boolean {
  const normalizedCategory = normalizeText(category || '')
  if (normalizedCategory === 'credit card payment') {
    return true
  }

  const normalizedDesc = normalizeText(description || '')
  const patterns = [
    /pagamento\s+(de\s+)?fatura/,
    /fatura\s+(do\s+)?cartao/,
    /credit\s+card\s+payment/,
    /pagto\s+fatura/,
    /pgto\s+fatura/,
    /pagamento\s+cartao\s+de\s+credito/,
    /\bcard_network\b/,
  ]

  return patterns.some(pattern => pattern.test(normalizedDesc))
}

export function mapPluggyExpenseCategory(
  pluggyCategory?: string | null,
  description?: string,
  hasInstallments?: boolean
): ExpenseCategory {
  const combined = normalizeText(`${pluggyCategory || ''} ${description || ''}`)

  if (
    matchesAnyKeyword(combined, [
      'food',
      'eating out',
      'restaurant',
      'supermarket',
      'grocery',
      'alimenta',
      'restaurante',
      'ifood',
      'rappi',
      'padaria',
      'mercado',
      'supermercado',
      'lanchonete',
      'cafe',
      'acai',
      'burger',
      'pizza',
    ])
  ) {
    return 'Alimentação'
  }

  if (
    matchesAnyKeyword(combined, [
      'transport',
      'taxi',
      'ride',
      'uber',
      '99app',
      '99*',
      'combustivel',
      'posto',
      'ipiranga',
      'shell',
      'petrobras',
      'estacionamento',
      'pedagio',
      'sem parar',
      'veloe',
      'onibus',
      'metro',
      'passagem',
    ])
  ) {
    return 'Transporte'
  }

  if (
    matchesAnyKeyword(combined, [
      'housing',
      'rent',
      'aluguel',
      'condominio',
      'iptu',
      'moradia',
      'imobiliaria',
    ])
  ) {
    return 'Moradia'
  }

  if (
    matchesAnyKeyword(combined, [
      'utilities',
      'water',
      'electricity',
      'gas',
      'internet',
      'telecom',
      'phone',
      'energia',
      'luz',
      'enel',
      'cpfl',
      'light',
      'cemig',
      'sabesp',
      'agua',
      'claro',
      'vivo',
      'tim',
      'oi',
      'net ',
      'conta',
    ])
  ) {
    return 'Contas'
  }

  if (
    matchesAnyKeyword(combined, [
      'health',
      'pharmacy',
      'doctor',
      'hospital',
      'medical',
      'dentist',
      'saude',
      'farmacia',
      'drogaria',
      'drogasil',
      'droga raia',
      'pague menos',
      'panvel',
      'unimed',
      'consulta',
      'exame',
      'clinica',
      'academia',
      'smartfit',
      'gympass',
      'wellhub',
    ])
  ) {
    return 'Saúde'
  }

  if (
    matchesAnyKeyword(combined, [
      'education',
      'school',
      'university',
      'course',
      'book',
      'educacao',
      'faculdade',
      'escola',
      'curso',
      'alura',
      'udemy',
      'livraria',
      'amazon livros',
    ])
  ) {
    return 'Educação'
  }

  if (
    matchesAnyKeyword(combined, [
      'entertainment',
      'streaming',
      'movies',
      'games',
      'travel',
      'hotel',
      'lazer',
      'netflix',
      'spotify',
      'disney',
      'prime video',
      'hbo',
      'max',
      'youtube',
      'steam',
      'playstation',
      'xbox',
      'nintendo',
      'cinema',
      'ingresso',
      'bar ',
      'show',
      'viagem',
      'airbnb',
      'booking',
    ])
  ) {
    return 'Lazer'
  }

  if (
    matchesAnyKeyword(combined, [
      'clothing',
      'apparel',
      'shoes',
      'fashion',
      'vestuario',
      'roupa',
      'calcado',
      'renner',
      'riachuelo',
      'cea',
      'zara',
      'shein',
      'nike',
      'adidas',
      'centauro',
    ])
  ) {
    return 'Vestuário'
  }

  if (
    matchesAnyKeyword(combined, [
      'tax',
      'taxes',
      'imposto',
      'darf',
      'ipva',
      'iof',
      'receita federal',
      'taxa',
    ])
  ) {
    return 'Impostos'
  }

  if (
    matchesAnyKeyword(combined, [
      'loan',
      'financing',
      'interest',
      'late fee',
      'emprestimo',
      'financiamento',
      'juros',
      'multa',
      'divida',
    ])
  ) {
    return 'Dívidas'
  }

  if (
    matchesAnyKeyword(combined, [
      'donation',
      'charity',
      'gift',
      'doacao',
      'presente',
      'dizimo',
      'ong',
    ])
  ) {
    return 'Doações'
  }

  if (hasInstallments) {
    return 'Compras parceladas'
  }

  return 'Outros'
}

export function mapPluggyRevenueCategory(
  pluggyCategory?: string | null,
  description?: string
): RevenueCategory {
  const combined = normalizeText(`${pluggyCategory || ''} ${description || ''}`)

  if (
    matchesAnyKeyword(combined, [
      'salary',
      'payroll',
      'wage',
      'salario',
      'pagamento folha',
      'remuneracao',
      'pro-labore',
      'adiantamento salarial',
    ])
  ) {
    return 'Salário'
  }

  if (
    matchesAnyKeyword(combined, [
      'investment',
      'interest',
      'dividend',
      'yield',
      'rendimento',
      'dividendo',
      'jcp',
      'tesouro',
      'cdb',
      'fundo',
      'resgate',
    ])
  ) {
    return 'Rendimentos'
  }

  if (
    matchesAnyKeyword(combined, [
      'freelance',
      'service',
      'consulting',
      'servico',
      'consultoria',
      'pj',
      'nota fiscal',
    ])
  ) {
    return 'Freelance'
  }

  if (
    matchesAnyKeyword(combined, [
      'bonus',
      '13',
      'decimo terceiro',
      'plr',
      'participacao lucros',
      'premio',
      'cashback',
    ])
  ) {
    return 'Bônus'
  }

  if (
    matchesAnyKeyword(combined, [
      'sale',
      'vendas',
      'venda',
      'mercado pago',
      'pagseguro',
      'stone',
      'infinitepay',
    ])
  ) {
    return 'Vendas'
  }

  return 'Outros'
}

export function formatPluggyDescription(rawDescription?: string | null): string {
  const trimmed = (rawDescription || '').trim()
  if (!trimmed) return 'Transação Open Finance'

  return trimmed
    .replace(/^compra\s+no\s+/i, '')
    .replace(/^transfer[eê]ncia\s+(?:enviada|recebida)\s+pelo\s+/i, '')
    .trim()
}

export function normalizeCardBrand(
  brand?: string | null,
  name?: string
): string {
  const combined = normalizeText(`${brand || ''} ${name || ''}`)
  if (combined.includes('visa')) return 'visa'
  if (combined.includes('master')) return 'mastercard'
  if (combined.includes('elo')) return 'elo'
  if (combined.includes('amex') || combined.includes('american')) return 'amex'
  if (combined.includes('hiper')) return 'hipercard'
  return 'mastercard'
}

export function createEmptySyncSummary(): PluggySyncSummary {
  return {
    expensesAdded: 0,
    revenuesAdded: 0,
    cardExpensesAdded: 0,
    cardsCreated: 0,
    skippedDuplicates: 0,
    ignoredBillPayments: 0,
  }
}

function clampDay(day: number, fallback: number): number {
  if (!Number.isFinite(day) || day < 1 || day > 31) return fallback
  return day
}

function getDayFromIsoDate(dateStr?: string | null, fallback = 8): number {
  if (!dateStr) return fallback
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return fallback
  return clampDay(parsed.getUTCDate(), fallback)
}

function buildBankObs(account: PluggyAccount, tx: PluggyTransaction): string {
  return `[Open Finance - ${account.name}]${
    tx.descriptionRaw && tx.descriptionRaw !== tx.description
      ? ` ${tx.descriptionRaw}`
      : ''
  }`
}

function buildCardDescriptionAndCategory(tx: PluggyTransaction): {
  title: string
  category: ExpenseCategory
} {
  const baseDesc = formatPluggyDescription(tx.description || 'Compra no Cartão')
  const totalInstallments = tx.creditCardMetadata?.totalInstallments ?? 1
  const installmentNumber = tx.creditCardMetadata?.installmentNumber ?? 1
  const hasInstallments = totalInstallments > 1
  const installmentSuffix = hasInstallments
    ? ` - Parcela ${installmentNumber}/${totalInstallments}`
    : ''

  return {
    title: `${baseDesc}${installmentSuffix}`,
    category: mapPluggyExpenseCategory(tx.category, baseDesc, hasInstallments),
  }
}

export function resolvePluggyCardTransactionDate(tx: PluggyTransaction): string {
  const rawTxDate = (tx.date || '').slice(0, 10)
  const totalInstallments = tx.creditCardMetadata?.totalInstallments ?? 1
  const installmentNumber = tx.creditCardMetadata?.installmentNumber ?? 1

  if (totalInstallments > 1 && installmentNumber > 1) {
    const rawPurchaseDate = (
      tx.creditCardMetadata?.purchaseDate ||
      tx.date ||
      ''
    ).slice(0, 10)

    if (
      rawPurchaseDate &&
      rawTxDate.slice(0, 7) === rawPurchaseDate.slice(0, 7)
    ) {
      const baseDate = new Date(`${rawPurchaseDate}T00:00:00`)
      if (!Number.isNaN(baseDate.getTime())) {
        return format(addMonths(baseDate, installmentNumber - 1), 'yyyy-MM-dd')
      }
    }
  }

  return rawTxDate
}

export function buildUpdatedRecordFields(
  account: PluggyAccount,
  tx: PluggyTransaction,
  targetTable: string
): Record<string, unknown> | null {
  const absValue = Math.abs(Number(tx.amount))
  if (!Number.isFinite(absValue) || absValue <= 0) return null

  if (targetTable === 'credit_card_expense') {
    const txDate = resolvePluggyCardTransactionDate(tx)
    if (!txDate) return null
    const { title, category } = buildCardDescriptionAndCategory(tx)
    return {
      description: title,
      value: absValue,
      category,
      obs: `[Open Finance - ${account.name}]`,
      created_at: txDate,
    }
  }

  const txDate = (tx.date || '').slice(0, 10)
  if (!txDate) return null

  const description = formatPluggyDescription(tx.description)
  const obs = buildBankObs(account, tx)

  if (targetTable === 'expense') {
    return {
      expense: description,
      value: absValue,
      category: mapPluggyExpenseCategory(tx.category, description, false),
      obs,
      created_at: txDate,
    }
  }

  if (targetTable === 'revenue') {
    return {
      revenue: description,
      value: absValue,
      category: mapPluggyRevenueCategory(tx.category, description),
      obs,
      created_at: txDate,
    }
  }

  return null
}

async function resolveOrCreateCreditCard(
  supabase: SupabaseClient,
  userId: string,
  account: PluggyAccount,
  connectorName: string,
  cards: CreditCard[],
  summary: PluggySyncSummary
): Promise<CreditCard> {
  const byPluggyId = cards.find(
    c => !c.is_archived && c.pluggy_account_id === account.id
  )
  if (byPluggyId) return byPluggyId

  const rawDigits = (account.number || '').replace(/\D/g, '').slice(-4)
  if (rawDigits.length === 4) {
    const byDigits = cards.find(
      c => !c.is_archived && c.last_digits === rawDigits
    )
    if (byDigits) {
      if (!byDigits.pluggy_account_id) {
        await supabase
          .from('credit_card')
          .update({ pluggy_account_id: account.id })
          .eq('id', byDigits.id)
          .eq('user_id', userId)
        byDigits.pluggy_account_id = account.id
      }
      return byDigits
    }
  }

  const digits = (rawDigits || '0000').padStart(4, '0')
  const brand = normalizeCardBrand(account.creditData?.brand, account.name)
  const closingDay = getDayFromIsoDate(account.creditData?.balanceCloseDate, 8)
  const dueDay = getDayFromIsoDate(account.creditData?.balanceDueDate, 15)

  const { data: createdCard, error } = await supabase
    .from('credit_card')
    .insert({
      user_id: userId,
      name: account.name || `${connectorName} Cartão`,
      bank: connectorName,
      last_digits: digits,
      brand,
      due_day: dueDay,
      closing_day: closingDay,
      pluggy_account_id: account.id,
    })
    .select()
    .single()

  if (error || !createdCard) {
    throw new Error(
      `Erro ao criar cartão automaticamente: ${error?.message || 'desconhecido'}`
    )
  }

  const typedCard = createdCard as CreditCard
  cards.push(typedCard)
  summary.cardsCreated += 1
  return typedCard
}

interface SyncedTransactionLogInsert {
  user_id: string
  pluggy_transaction_id: string
  pluggy_account_id: string
  target_table: string
  record_id?: number | null
}

async function recordSyncedTransactions(
  supabase: SupabaseClient,
  rows: SyncedTransactionLogInsert[]
): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase
    .from('pluggy_synced_transactions')
    .upsert(rows, {
      onConflict: 'pluggy_transaction_id',
      ignoreDuplicates: true,
    })

  if (error) {
    throw new Error(`Erro ao registrar log de sincronização: ${error.message}`)
  }
}

export async function syncPluggyTransactionsForAccount(params: {
  supabase: SupabaseClient
  userId: string
  account: PluggyAccount
  connectorName: string
  transactions: PluggyTransaction[]
  syncedSet: Set<string>
  cards: CreditCard[]
  summary: PluggySyncSummary
  ignoreBillPayments?: boolean
}): Promise<void> {
  const {
    supabase,
    userId,
    account,
    connectorName,
    transactions,
    syncedSet,
    cards,
    summary,
    ignoreBillPayments = true,
  } = params

  if (account.type === 'BANK') {
    const expensePayloads: {
      user_id: string
      expense: string
      value: number
      created_at: string
      category: ExpenseCategory
      obs: string
      is_paid: boolean
    }[] = []
    const expenseSyncLogs: SyncedTransactionLogInsert[] = []

    const revenuePayloads: {
      user_id: string
      revenue: string
      value: number
      created_at: string
      category: RevenueCategory
      obs: string
    }[] = []
    const revenueSyncLogs: SyncedTransactionLogInsert[] = []
    const ignoredSyncLogs: SyncedTransactionLogInsert[] = []

    for (const tx of transactions) {
      if (syncedSet.has(tx.id)) {
        summary.skippedDuplicates += 1
        continue
      }

      const rawAmount = Number(tx.amount)
      const absValue = Math.abs(rawAmount)
      if (!Number.isFinite(absValue) || absValue <= 0) continue

      const txDate = tx.date.slice(0, 10)
      const description = formatPluggyDescription(tx.description)
      const obs = buildBankObs(account, tx)

      if (
        /card_network/i.test(description) ||
        /card_network/i.test(tx.description || '')
      ) {
        syncedSet.add(tx.id)
        ignoredSyncLogs.push({
          user_id: userId,
          pluggy_transaction_id: tx.id,
          pluggy_account_id: account.id,
          target_table: 'ignored',
          record_id: null,
        })
        continue
      }

      const isDebit = tx.type === 'DEBIT' || rawAmount < 0
      const isCredit = !isDebit && tx.type === 'CREDIT' && rawAmount > 0

      if (isDebit) {
        if (
          ignoreBillPayments &&
          isCreditCardBillPayment(description, tx.category)
        ) {
          syncedSet.add(tx.id)
          ignoredSyncLogs.push({
            user_id: userId,
            pluggy_transaction_id: tx.id,
            pluggy_account_id: account.id,
            target_table: 'ignored',
            record_id: null,
          })
          continue
        }

        const category = mapPluggyExpenseCategory(tx.category, description, false)
        syncedSet.add(tx.id)
        expensePayloads.push({
          user_id: userId,
          expense: description,
          value: absValue,
          created_at: txDate,
          category,
          obs,
          is_paid: true,
        })
        expenseSyncLogs.push({
          user_id: userId,
          pluggy_transaction_id: tx.id,
          pluggy_account_id: account.id,
          target_table: 'expense',
        })
      } else if (isCredit) {
        const category = mapPluggyRevenueCategory(tx.category, description)
        syncedSet.add(tx.id)
        revenuePayloads.push({
          user_id: userId,
          revenue: description,
          value: absValue,
          created_at: txDate,
          category,
          obs,
        })
        revenueSyncLogs.push({
          user_id: userId,
          pluggy_transaction_id: tx.id,
          pluggy_account_id: account.id,
          target_table: 'revenue',
        })
      }
    }

    if (ignoredSyncLogs.length > 0) {
      await recordSyncedTransactions(supabase, ignoredSyncLogs)
      summary.ignoredBillPayments += ignoredSyncLogs.length
    }

    if (expensePayloads.length > 0) {
      const { data: insertedExpenses, error } = await supabase
        .from('expense')
        .insert(expensePayloads)
        .select('id')
      if (error) {
        throw new Error(`Erro ao salvar despesas: ${error.message}`)
      }
      const logsWithIds = expenseSyncLogs.map((log, index) => ({
        ...log,
        record_id:
          insertedExpenses && insertedExpenses.length === expenseSyncLogs.length
            ? (insertedExpenses[index]?.id ?? null)
            : null,
      }))
      await recordSyncedTransactions(supabase, logsWithIds)
      summary.expensesAdded += expensePayloads.length
    }

    if (revenuePayloads.length > 0) {
      const { data: insertedRevenues, error } = await supabase
        .from('revenue')
        .insert(revenuePayloads)
        .select('id')
      if (error) {
        throw new Error(`Erro ao salvar receitas: ${error.message}`)
      }
      const logsWithIds = revenueSyncLogs.map((log, index) => ({
        ...log,
        record_id:
          insertedRevenues && insertedRevenues.length === revenueSyncLogs.length
            ? (insertedRevenues[index]?.id ?? null)
            : null,
      }))
      await recordSyncedTransactions(supabase, logsWithIds)
      summary.revenuesAdded += revenuePayloads.length
    }
    return
  }

  if (account.type === 'CREDIT') {
    const targetCard = await resolveOrCreateCreditCard(
      supabase,
      userId,
      account,
      connectorName,
      cards,
      summary
    )

    const cardExpensePayloads: {
      user_id: string
      card_id: number
      description: string
      value: number
      category: ExpenseCategory
      obs: string
      created_at: string
    }[] = []
    const cardExpenseSyncLogs: SyncedTransactionLogInsert[] = []
    const ignoredCardSyncLogs: SyncedTransactionLogInsert[] = []

    for (const tx of transactions) {
      if (syncedSet.has(tx.id)) {
        summary.skippedDuplicates += 1
        continue
      }

      const rawAmount = Number(tx.amount)
      const absValue = Math.abs(rawAmount)
      if (!Number.isFinite(absValue) || absValue <= 0) continue

      const { title, category } = buildCardDescriptionAndCategory(tx)
      const isParentInstallmentRow =
        (tx.creditCardMetadata?.totalInstallments ?? 1) > 1 &&
        !tx.creditCardMetadata?.installmentNumber

      if (
        isParentInstallmentRow ||
        tx.type === 'CREDIT' ||
        rawAmount < 0 ||
        isCreditCardBillPayment(title, tx.category)
      ) {
        syncedSet.add(tx.id)
        ignoredCardSyncLogs.push({
          user_id: userId,
          pluggy_transaction_id: tx.id,
          pluggy_account_id: account.id,
          target_table: 'ignored',
          record_id: null,
        })
        continue
      }

      if (tx.type === 'DEBIT' && rawAmount > 0) {
        syncedSet.add(tx.id)
        cardExpensePayloads.push({
          user_id: userId,
          card_id: targetCard.id,
          description: title,
          value: absValue,
          category,
          obs: `[Open Finance - ${account.name}]`,
          created_at: resolvePluggyCardTransactionDate(tx),
        })
        cardExpenseSyncLogs.push({
          user_id: userId,
          pluggy_transaction_id: tx.id,
          pluggy_account_id: account.id,
          target_table: 'credit_card_expense',
        })
      }
    }

    if (ignoredCardSyncLogs.length > 0) {
      await recordSyncedTransactions(supabase, ignoredCardSyncLogs)
      summary.ignoredBillPayments += ignoredCardSyncLogs.length
    }

    if (cardExpensePayloads.length > 0) {
      const { data: insertedCardExpenses, error } = await supabase
        .from('credit_card_expense')
        .insert(cardExpensePayloads)
        .select('id')
      if (error) {
        throw new Error(`Erro ao salvar gastos de cartão: ${error.message}`)
      }
      const logsWithIds = cardExpenseSyncLogs.map((log, index) => ({
        ...log,
        record_id:
          insertedCardExpenses &&
          insertedCardExpenses.length === cardExpenseSyncLogs.length
            ? (insertedCardExpenses[index]?.id ?? null)
            : null,
      }))
      await recordSyncedTransactions(supabase, logsWithIds)
      summary.cardExpensesAdded += cardExpensePayloads.length
    }
  }
}
