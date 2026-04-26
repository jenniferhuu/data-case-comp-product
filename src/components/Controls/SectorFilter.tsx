import { useStore } from '../../state/store'

interface Props { options: string[] }

export function SectorFilter({ options }: Props) {
  const { sector, setSector } = useStore()
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">Sector</label>
      <select
        className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={sector ?? ''}
        onChange={(e) => setSector(e.target.value || null)}
      >
        <option value="">All sectors</option>
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
