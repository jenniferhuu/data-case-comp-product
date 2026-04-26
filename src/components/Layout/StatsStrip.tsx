import { useMemo } from 'react'
import { useStore } from '../../state/store'
import { applyFilters } from '../../lib/filters'
import type { AppData } from '../../types'

interface Props { data: AppData }

export function StatsStrip({ data }: Props) {
  const { yearSelection, compareYears, donorCountry, sector, flowSizeMin } = useStore()

  const { count, totalUsd } = useMemo(() => {
    const filtered = applyFilters(data.flows.flows, {
      yearSelection, compareYears, donorCountry, sector, flowSizeMin,
    })
    const totalUsd = filtered.reduce((sum, f) => sum + f.usd_disbursed_m, 0)
    return { count: filtered.length, totalUsd }
  }, [data.flows.flows, yearSelection, compareYears, donorCountry, sector, flowSizeMin])

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="text-white font-medium">{count.toLocaleString()}</span>
      <span>flows</span>
      <span className="text-gray-600">·</span>
      <span className="text-blue-400 font-medium">{fmt(totalUsd)}</span>
    </div>
  )
}
