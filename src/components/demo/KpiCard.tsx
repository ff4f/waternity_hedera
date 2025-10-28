import React from 'react'
import { Badge } from '@/components/ui/badge'

export default function KpiCard({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string | number; delta?: string }) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-emerald-200">{label}</p>
          <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-emerald-100">{value}</div>
        </div>
        {Icon && <Icon className="h-5 w-5 text-slate-500 dark:text-emerald-300" />}
      </div>
      {delta && (
        <div className="mt-2">
          <Badge className="bg-emerald-500 text-white">{delta}</Badge>
        </div>
      )}
    </div>
  )
}