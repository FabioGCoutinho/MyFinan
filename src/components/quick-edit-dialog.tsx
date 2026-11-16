'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/util/supabase/client'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type QuickEditRecordType = 'expense' | 'revenue' | 'card_expense'

export interface QuickEditTarget {
  id: number
  type: QuickEditRecordType
  title: string
  category: string
  obs: string
}

interface QuickEditDialogProps {
  target: QuickEditTarget | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Contas',
  'Compras parceladas',
  'Dívidas',
  'Doações',
  'Educação',
  'Impostos',
  'Lazer',
  'Moradia',
  'Saúde',
  'Transporte',
  'Vestuário',
  'Outros',
]

const REVENUE_CATEGORIES = [
  'Salário',
  'Rendimentos',
  'Freelance',
  'Bônus',
  'Vendas',
  'Outros',
]

const DIALOG_TITLES: Record<QuickEditRecordType, string> = {
  expense: 'Editar Despesa',
  revenue: 'Editar Receita',
  card_expense: 'Editar Gasto no Cartão',
}

export function QuickEditDialog({
  target,
  onClose,
  onSaved,
}: QuickEditDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setTitle(target.title)
      setCategory(target.category)
      setObs(target.obs || '')
      setError(null)
    }
  }, [target])

  const categories = useMemo(() => {
    const base =
      target?.type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES
    if (target?.category && !base.includes(target.category)) {
      return [target.category, ...base]
    }
    return base
  }, [target?.type, target?.category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return

    const cleanTitle = title.trim()
    if (!cleanTitle || !category) {
      setError('Preencha o título e selecione uma categoria.')
      return
    }

    setSaving(true)
    setError(null)

    const cleanObs = obs.trim()
    const updatedAt = new Date().toISOString()

    try {
      let updateError: { message: string } | null = null

      if (target.type === 'expense') {
        const { error: err } = await supabase
          .from('expense')
          .update({
            expense: cleanTitle,
            category,
            obs: cleanObs,
            updated_at: updatedAt,
          })
          .eq('id', target.id)
        updateError = err
      } else if (target.type === 'revenue') {
        const { error: err } = await supabase
          .from('revenue')
          .update({
            revenue: cleanTitle,
            category,
            obs: cleanObs,
            updated_at: updatedAt,
          })
          .eq('id', target.id)
        updateError = err
      } else if (target.type === 'card_expense') {
        const { error: err } = await supabase
          .from('credit_card_expense')
          .update({
            description: cleanTitle,
            category,
            obs: cleanObs,
            updated_at: updatedAt,
          })
          .eq('id', target.id)
        updateError = err
      }

      if (updateError) {
        setError(updateError.message)
        return
      }

      toast({
        title: 'Registro atualizado!',
        description: 'Título, categoria e descrição salvos com sucesso.',
      })

      await onSaved()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro inesperado ao salvar.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={open => !open && onClose()}>
      <DialogContent className="fixed inset-x-0 bottom-0 top-auto z-50 w-full max-w-none translate-x-0 translate-y-0 rounded-t-[28px] rounded-b-none border-t bg-background p-5 pb-8 shadow-2xl max-h-[92dvh] overflow-y-auto sm:inset-auto sm:left-[50%] sm:top-[50%] sm:w-full sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px] sm:border sm:p-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/20 sm:hidden" />

        <DialogHeader className="text-left space-y-1 mb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {target ? DIALOG_TITLES[target.type] : 'Editar Registro'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Atualize rapidamente o título, a categoria e a descrição deste
            lançamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="quick-edit-title"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Título
            </Label>
            <Input
              id="quick-edit-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Mercado, Salário, Uber..."
              required
              className="h-12 rounded-2xl bg-muted/40 border-border/60 px-4 text-base sm:text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="quick-edit-category"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger
                id="quick-edit-category"
                className="h-12 rounded-2xl bg-muted/40 border-border/60 px-4 text-base sm:text-sm font-medium"
              >
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="quick-edit-obs"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Descrição / Observação
            </Label>
            <Textarea
              id="quick-edit-obs"
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Adicione detalhes ou observações sobre este registro"
              rows={3}
              className="min-h-[96px] rounded-2xl bg-muted/40 border-border/60 px-4 py-3 text-base sm:text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-2xl text-center">
              {error}
            </p>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto h-12 rounded-2xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 h-12 rounded-2xl font-bold shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
