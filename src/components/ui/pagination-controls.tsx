'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  visibleItems: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  visibleItems,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 p-4 px-6 border border-border flex items-center justify-between bg-white dark:bg-card rounded-[24px]">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Exibindo {visibleItems} de {totalItems} lançamentos
      </span>
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            type="button"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            type="button"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
