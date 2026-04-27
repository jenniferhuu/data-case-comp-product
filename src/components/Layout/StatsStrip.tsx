import { useMemo } from 'react'
import type { AppData } from '../../types'
import { getFilteredFlows, getFlowStats } from '../../features/filters/derivedData'
import { useStoreFilterSnapshot } from '../../features/filters/storeFilters'

interface Props { data: AppData }

export function StatsStrip({ data }: Props) {
  const filters = useStoreFilterSnapshot()

  const { count, totalUsd } = useMemo(() => {
    const filtered = getFilteredFlows(data.flows.flows, filters)
    return getFlowStats(filtered)
  }, [data.flows.flows, filters])

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
