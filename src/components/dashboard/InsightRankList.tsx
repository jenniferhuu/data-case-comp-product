import React from 'react'

interface InsightRankItem {
  id?: string
  label: string
  value: string
  detail?: string
}

interface InsightRankListProps {
  title: string
  items: InsightRankItem[]
  onSelect?: (id: string) => void
}

export function InsightRankList({ title, items, onSelect }: InsightRankListProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Ranked</p>
      </div>
      <ol className="mt-4 space-y-3">
        {items.map((item, index) => {
          const clickable = onSelect !== undefined && item.id !== undefined

          return (
            <li
              key={`${item.label}-${index}`}
              onClick={clickable ? () => onSelect!(item.id!) : undefined}
              className={`flex items-start justify-between gap-3 rounded-[1.1rem] border border-white/8 bg-slate-950/45 px-3 py-3 transition ${
                clickable
                  ? 'cursor-pointer hover:border-cyan-300/30 hover:bg-slate-800/60'
                  : ''
              }`}
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/65">{index + 1}</p>
                <p className="mt-1 text-sm text-white">{item.label}</p>
                {item.detail ? <p className="mt-1 text-xs text-slate-400">{item.detail}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-medium text-slate-200">{item.value}</p>
                {clickable ? (
                  <span className="text-[10px] text-cyan-400/60">→</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
