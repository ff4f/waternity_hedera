import React from 'react'

export default function SectionHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-emerald-300">{title}</h3>
        {desc && <p className="text-sm text-slate-700 dark:text-emerald-200">{desc}</p>}
      </div>
      {actions}
    </div>
  )
}