import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { DonorSummary, MarkerBreakdown } from '../../types'
import { useStore } from '../../state/store'
import { MarkerCredibilityCard } from './MarkerCredibilityCard'
import { SECTOR_COLORS } from '../../lib/colorScales'

interface Props {
  donor: DonorSummary
  markerData: MarkerBreakdown | null
}

export function DonorPanel({ donor, markerData }: Props) {
  const { mode } = useStore()
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="text-gray-400">Country: <span className="text-white">{donor.donor_country}</span></p>
        <p className="text-gray-400">Total disbursed: <span className="text-blue-400 font-bold">${donor.total_usd_m.toFixed(1)}M</span></p>
        <p className="text-gray-400">Projects: <span className="text-white">{donor.n_projects}</span></p>
        <p className="text-gray-400">Countries reached: <span className="text-white">{donor.n_countries}</span></p>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Sectors</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={donor.top_sectors} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m">
              {donor.top_sectors.map((s) => (
                <Cell key={s.name} fill={SECTOR_COLORS[s.name] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Recipients</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={donor.top_recipients} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {mode === 'credibility' && markerData && (
        <MarkerCredibilityCard markerData={markerData} />
      )}
    </div>
  )
}
