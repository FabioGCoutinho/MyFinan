'use client'

import type { SortDirection, SortField } from '@/lib/types'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useState } from 'react'

export function useSort() {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="ml-1 w-4 h-4 inline" />
    ) : (
      <ArrowDownIcon className="ml-1 w-4 h-4 inline" />
    )
  }

  return { sortField, sortDirection, handleSort, renderSortIcon }
}
