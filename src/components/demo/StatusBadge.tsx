import React from 'react'
import { Badge } from '@/components/ui/badge'

export default function StatusBadge({ status }: { status: 'success'|'pending'|'failed' }) {
  const map = {
    success: 'bg-emerald-500',
    pending: 'bg-amber-500',
    failed: 'bg-rose-500'
  } as const
  const label = {
    success: 'Success',
    pending: 'Pending',
    failed: 'Failed'
  } as const
  return (
    <Badge className={`${map[status]} text-white`}>{label[status]}</Badge>
  )
}