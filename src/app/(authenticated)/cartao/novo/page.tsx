'use client'

import { revalidateAfterCardAction } from '@/components/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCardVisual } from '@/components/ui/credit-card-visual'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getExpenseFormIcon } from '@/lib/categories'
import type { CreditCard } from '@/lib/credit-card'
import { formatarValor } from '@/lib/utils'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import { addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard as CreditCardIcon,
  Info,
  Layers,
  Lightbulb,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

export default function NovoGastoCartao() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [cardId, setCardId] = useState('')
  const [description, setDescription] = useState('')
  const [valor, setValor] = useState('')
  const [value, setValue] = useState(0)
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [obs, setObs] = useState('')
  const [qtd_parcelas, setQtdParcelas] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [alertShow, setAlertShow] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [loading, setLoading] = useState(true)

  const [isInstallment, setIsInstallment] = useState(false)

  const selectedCard = useMemo(() => {
    return cards.find(c => String(c.id) === cardId)
  }, [cards, cardId])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('credit_card')
          .select('*')
          .eq('user_id', user.id)
        setCards(data ?? [])
      }
      setLoading(false)
    }
    init()
  }, [supabase])


  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted, numeric } = formatarValor(e.target.value)
    setValor(formatted)
    setValue(numeric)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!cardId || !description.trim() || !value || !date || !category) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (isInstallment && (!qtd_parcelas || qtd_parcelas < 1)) {
      setError('Informe a quantidade de parcelas.')
      return
    }

    setIsDisabled(true)

    if (isInstallment) {
      try {
        const baseDate = new Date(date + "T00:00:00")
        const records = Array.from({ length: qtd_parcelas }, (_, i) => ({
          card_id: Number(cardId),
          description: `${description} - Parcela ${i + 1}/${qtd_parcelas}`,
          value: value / qtd_parcelas,
          category,
          created_at: format(addMonths(baseDate, i), 'yyyy-MM-dd'),
          obs,
          user_id: user?.id,
        }))

        const { error } = await supabase
          .from('credit_card_expense')
          .insert(records)

        if (error) throw error
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (err: any) {
        setError(err?.message)
        setIsDisabled(false)
        return
      }
      await revalidateAfterCardAction()
      setAlertShow(true)
      return
    }

    try {
      const { error } = await supabase.from('credit_card_expense').insert({
        card_id: Number(cardId),
        description,
        value,
        category,
        created_at: date,  // já é string 'yyyy-MM-dd'
        obs,
        user_id: user?.id,
      })

      if (error) throw error

      await revalidateAfterCardAction()
      setAlertShow(true)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      setError(err?.message)
      setIsDisabled(false)
    }
  }

  function closeModal() {
    setDescription('')
    setValor('')
    setValue(0)
    setCategory('')
    setDate('')
    setObs('')
    setCardId('')
    setIsInstallment(false)
    setQtdParcelas(1)
    setAlertShow(false)
    setIsDisabled(false)
  }

  const getCategoryIcon = getExpenseFormIcon

  const formattedDate = date ? format(new Date(date + "T00:00:00"), 'dd MMM yyyy', { locale: ptBR }) : '---'

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto py-10 px-4 max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors font-semibold">
            Finanças
          </Link>
          <span className="text-muted-foreground/50">›</span>
          <Link href="/cartao" className="hover:text-foreground transition-colors font-semibold">
            Cartões
          </Link>
          <span className="text-muted-foreground/50">›</span>
          <span className="text-foreground font-semibold">Nova Transação</span>
        </nav>

        {cards.length === 0 ? (
          <Card className="w-full max-w-lg mx-auto border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum cartão cadastrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre um cartão de crédito nas Configurações para registrar as
                despesas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            
            {/* ETAPA 1: Seleção de Cartão - Semelhante à imagem */}
            <div>
               <div className="flex justify-between items-end mb-6 pl-2 pr-2">
                 <div>
                    <p className="text-[10px] font-extrabold text-[#34d399] tracking-[0.15em] mb-1">
                      PASSO 1
                    </p>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      Selecione o Cartão
                    </h2>
                 </div>
                 <span className="text-xs font-semibold text-slate-400">Deslize para ver mais</span>
               </div>
               
               <div className="flex gap-4 overflow-x-auto pb-6 snap-x custom-scrollbar">
                 {cards.map(card => (
                   <div key={card.id} className="snap-start shrink-0">
                     <CreditCardVisual
                       card={card}
                       selectable
                       selected={cardId === String(card.id)}
                       onClick={() => setCardId(String(card.id))}
                     />
                   </div>
                 ))}
               </div>
            </div>

            {/* Renderizar Passo 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-4 fade-in duration-500">
                
                {/* LEFT PANEL: FORM */}
                <div className="lg:col-span-7 bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-sm relative overflow-hidden">
                  <p className="text-[10px] font-extrabold text-[#34d399] tracking-[0.15em] mb-1">
                    PASSO 2
                  </p>
                  <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-8 tracking-tight">
                    Detalhes da Transação
                  </h1>

                  <form onSubmit={handleSubmit} id="expense-form" className="space-y-5 relative z-10">
                    
                    {/* Descrição do Gasto */}
                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Descrição do Gasto
                      </Label>
                      <Input
                        id="description"
                        placeholder="Ex: Jantar Restaurante Coco Bambu"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        className="h-14 rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none placeholder:text-muted-foreground/60 px-4 font-medium"
                      />
                    </div>

                    {/* Valor / Data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="price" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                          Valor
                        </Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                          <Input
                            id="price"
                            placeholder="0,00"
                            value={valor}
                            onChange={handleValorChange}
                            required
                            className="h-14 rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none placeholder:text-muted-foreground/60 pl-11 pr-4 font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="date" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                           Data
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          required
                          className="h-14 rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none px-4 font-medium text-slate-600 dark:text-slate-300"
                        />
                      </div>
                    </div>

                    {/* Categoria do Lançamento */}
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="categoria" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Categoria do Lançamento
                      </Label>
                      <Select onValueChange={e => setCategory(e)} value={category} required>
                        <SelectTrigger id="categoria" className="h-14 rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none px-4 font-medium">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alimentação">Alimentação</SelectItem>
                          <SelectItem value="Contas">Contas</SelectItem>
                          <SelectItem value="Dívidas">Dívidas</SelectItem>
                          <SelectItem value="Doações">Doações</SelectItem>
                          <SelectItem value="Educação">Educação</SelectItem>
                          <SelectItem value="Impostos">Impostos</SelectItem>
                          <SelectItem value="Lazer">Lazer</SelectItem>
                          <SelectItem value="Moradia">Moradia</SelectItem>
                          <SelectItem value="Saúde">Saúde</SelectItem>
                          <SelectItem value="Transporte">Transporte</SelectItem>
                          <SelectItem value="Vestuário">Vestuário</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pagamento Parcelado Toggle Block */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm dark:shadow-none mt-2">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Pagamento Parcelado</h4>
                          <p className="text-[11px] font-semibold text-slate-400">Dividir esta compra em meses</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInstallment(!isInstallment)}
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isInstallment ? 'bg-[#34d399]' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform shadow-sm ${isInstallment ? 'translate-x-[26px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>

                    {/* Número de Parcelas - Animates when visible */}
                    {isInstallment && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in mt-2">
                        <Label htmlFor="qtd_parcelas" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                          Número de Parcelas
                        </Label>
                        <Select onValueChange={e => setQtdParcelas(Number(e))} value={qtd_parcelas.toString()}>
                          <SelectTrigger id="qtd_parcelas" className="h-14 rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none px-4 font-medium">
                            <SelectValue placeholder="Selecione o número de parcelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }).map((_, i) => {
                              const x = i + 1;
                              const v = value > 0 ? (value / x).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'}) : ''
                              return (
                                <SelectItem key={x} value={x.toString()}>
                                  {x}x {x === 1 ? '(À vista)' : v ? `(de ${v})` : ''}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Observação (optional) */}
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="obs" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Observação
                      </Label>
                      <Textarea
                        id="obs"
                        placeholder="Adicione uma observação opcional"
                        value={obs}
                        onChange={e => setObs(e.target.value)}
                        className="rounded-2xl bg-white dark:bg-slate-950 border-none shadow-sm dark:shadow-none resize-none px-4 py-3 placeholder:text-muted-foreground/60 min-h-[80px]"
                      />
                    </div>

                    {error && (
                      <p className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-2xl text-center">
                        {error}
                      </p>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isDisabled}
                        className="w-full h-14 bg-gradient-to-r from-teal-500 to-[#34d399] hover:from-teal-600 hover:to-teal-500 text-white rounded-2xl shadow-lg shadow-teal-500/30 text-base font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isDisabled ? <PulseLoader color="#fff" size={8} /> : (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Confirmar Transação
                          </>
                        )}
                      </Button>
                    </div>

                  </form>
                </div>

                {/* RIGHT PANEL: SUMMARY & TIPS */}
                <div className="lg:col-span-5 space-y-6">
                   <h3 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">
                     Resumo do Lançamento
                   </h3>

                   {/* White Card */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                       
                       {/* Top Row: category | card */}
                       <div className="flex justify-between items-center mb-8">
                          <div className="flex items-center gap-3">
                             <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[14px]">
                                {getCategoryIcon(category)}
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                  Categoria
                                </p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                  {category || '—'}
                                </p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                               Cartão
                             </p>
                             <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                               {selectedCard?.name || '—'}
                             </p>
                          </div>
                       </div>

                       {/* Middle Row: Total Estimado */}
                       <div className="mb-6 flex flex-col items-center justify-center">
                           <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1">
                              Total Estimado
                           </p>
                           <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
                              {valor || 'R$ 0,00'}
                           </h2>
                           <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-[14px] h-[14px]" />
                              <span className="text-[11px] font-bold text-center">
                                Lançamento na Fatura de {date ? format(new Date(date + "T00:00:00"), 'MMMM', { locale: ptBR }) : '...'}
                              </span>
                           </div>
                       </div>

                       {/* Divider */}
                       <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                       {/* Key Values List */}
                       <div className="space-y-4 mb-6 px-1">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500 dark:text-slate-400 font-medium">Descrição</span>
                             <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[150px] truncate text-right">
                               {description || '—'}
                             </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500 dark:text-slate-400 font-medium">Data</span>
                             <span className="font-bold text-slate-800 dark:text-slate-200 text-right capitalize">
                               {formattedDate}
                             </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500 dark:text-slate-400 font-medium">Parcelas</span>
                             <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                               {isInstallment ? `${qtd_parcelas}x` : 'À vista'}
                             </span>
                          </div>
                       </div>

                       {/* Note Box */}
                       <div className="bg-[#eff2fc] dark:bg-slate-800/60 rounded-[18px] p-4 flex gap-3 items-start">
                          <Info className="w-[18px] h-[18px] text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                            Esta transação reduzirá seu limite disponível imediatamente e será conciliada na próxima fatura.
                          </p>
                       </div>
                   </div>

                   {/* Gestão Inteligente Blue Box */}
                   <div className="bg-[#2563eb] rounded-[32px] p-7 shadow-lg shadow-blue-500/20 relative overflow-hidden">
                      <div className="relative z-10 max-w-[75%]">
                         <h3 className="text-white font-extrabold text-lg mb-1 tracking-tight">
                           Gestão Inteligente
                         </h3>
                         <p className="text-blue-100/90 text-[13px] font-medium leading-relaxed">
                           Suas finanças categorizadas em tempo real com IA.
                         </p>
                      </div>
                      <div className="absolute right-[-10%] bottom-[-15%] opacity-20 text-white pointer-events-none">
                         <BarChart3 className="w-36 h-36 border-none" strokeWidth={3} />
                      </div>
                   </div>
                </div>
              </div>
          </div>
        )}
      </div>

      <AlertDialog open={alertShow} onOpenChange={closeModal}>
        <AlertDialogContent className="max-w-sm text-center">
          <AlertDialogHeader className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/15">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              Transação Salva!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-medium">
              A transação "{description}" foi registrada com sucesso na fatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-col gap-2 sm:space-x-0 pt-4">
            <AlertDialogAction asChild>
              <Link
                href="/cartao"
                className="w-full h-12 rounded-2xl border-none font-bold flex items-center justify-center m-0"
              >
                Ver Faturas
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link
              href="#"
              onClick={closeModal}
              className="w-full h-12 rounded-2xl border-none font-bold flex items-center justify-center m-0"
              >
              Nova Transação
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
