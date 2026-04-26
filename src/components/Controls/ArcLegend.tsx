import { useStore } from '../../state/store'
import { SECTOR_COLORS } from '../../lib/colorScales'

const GROWTH_ITEMS = [
  { color: '#22c55e', label: 'Growing >10%' },
  { color: '#86efac', label: 'Growing' },
  { color: '#9ca3af', label: 'Stable' },
  { color: '#fca5a5', label: 'Declining' },
  { color: '#ef4444', label: 'Declining >10%' },
]

const COMPARE_ITEMS = [
  { color: '#22c55e', label: 'New in year 2' },
  { color: '#9ca3af', label: 'Stable' },
  { color: '#ef4444', label: 'Ended' },
]

const CREDIBILITY_ITEMS = [
  { color: '#93c5fd', label: 'Low (<0.25)' },
  { color: '#60a5fa', label: 'Medium' },
  { color: '#3b82f6', label: 'High (>0.5)' },
]

export function ArcLegend() {
  const { mode, yearSelection } = useStore()

  let items: { color: string; label: string }[]
  if (mode === 'credibility') {
    items = CREDIBILITY_ITEMS
  } else if (yearSelection === 'compare') {
    items = COMPARE_ITEMS
  } else if (yearSelection === 'all') {
    items = GROWTH_ITEMS
  } else {
    items = Object.entries(SECTOR_COLORS).map(([name, color]) => ({ color, label: name }))
  }

  return (
    <div className="flex items-center gap-3 ml-auto">
      <span className="text-gray-500 text-xs uppercase tracking-wide">Legend</span>
      <div className="flex items-center gap-2 flex-wrap">
        {items.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-300 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
