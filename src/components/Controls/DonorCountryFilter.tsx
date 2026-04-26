import { useStore } from '../../state/store'

interface Props { options: string[] }

export function DonorCountryFilter({ options }: Props) {
  const { donorCountry, setDonorCountry } = useStore()
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">Donor Country</label>
      <select
        className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={donorCountry ?? ''}
        onChange={(e) => setDonorCountry(e.target.value || null)}
      >
        <option value="">All countries</option>
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}
