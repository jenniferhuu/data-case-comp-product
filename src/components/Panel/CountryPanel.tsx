import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import type { CountrySummary } from '../../types'
import { SECTOR_COLORS } from '../../lib/colorScales'

interface Props { country: CountrySummary }

export function CountryPanel({ country }: Props) {
  const yearData = Object.entries(country.by_year)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, usd_m]) => ({ year, usd_m }))

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="text-gray-400">Total received: <span className="text-blue-400 font-bold">${country.total_received_usd_m.toFixed(1)}M</span></p>
        <p className="text-gray-400">Donors: <span className="text-white">{country.n_donors}</span></p>
        <p className="text-gray-400">Projects: <span className="text-white">{country.n_projects}</span></p>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Funding Over Time</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={yearData} margin={{ left: 8, right: 8 }}>
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Line type="monotone" dataKey="usd_m" stroke="#3b82f6" dot={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Sectors</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={country.top_sectors} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#d1d5db', fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => `$${v.toFixed(1)}M`} contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Bar dataKey="usd_m">
              {country.top_sectors.map((s) => (
                <Cell key={s.name} fill={SECTOR_COLORS[s.name] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase mb-2">Top Donors</p>
        <ol className="space-y-1">
          {country.top_donors.map((d, i) => (
            <li key={d.donor_id} className="flex justify-between text-xs">
              <span className="text-gray-300">{i + 1}. {d.donor_name}</span>
              <span className="text-blue-400">${d.usd_m.toFixed(1)}M</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
