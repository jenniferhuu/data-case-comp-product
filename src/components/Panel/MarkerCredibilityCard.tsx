import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { MarkerBreakdown } from '../../types'
import { MARKER_LABELS, ALL_MARKERS } from '../../types'

interface Props { markerData: MarkerBreakdown }

export function MarkerCredibilityCard({ markerData }: Props) {
  const chartData = ALL_MARKERS.map((key) => ({
    name: MARKER_LABELS[key],
    score: markerData.markers[key]?.credibility_score ?? 0,
  }))

  return (
    <div>
      <p className="text-gray-400 text-xs uppercase mb-2">Marker Credibility Scores</p>
      <p className="text-gray-500 text-xs mb-2">principal_pct + 0.5 × significant_pct</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 9 }} width={110} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} contentStyle={{ background: '#1f2937', border: 'none' }} />
          <Bar dataKey="score">
            {chartData.map((d) => (
              <Cell key={d.name} fill={d.score > 0.5 ? '#3b82f6' : d.score > 0.25 ? '#60a5fa' : '#93c5fd'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
