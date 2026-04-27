import { useEffect, useState } from 'react'
import { useStore } from '../../state/store'
import type { AppData } from '../../types'
import { getFilteredFlows, getLeaderboardEntries } from '../../features/filters/derivedData'
import { useStoreFilterSnapshot } from '../../features/filters/storeFilters'

interface Props {
  data: AppData
}

export function Leaderboard({ data }: Props) {
  const [tab, setTab] = useState<'donors' | 'countries'>('donors')
  const [query, setQuery] = useState<string>('')
  const filters = useStoreFilterSnapshot()
  const {
    selectedDonorId,
    selectedCountryIso3,
    selectDonor,
    selectCountry,
  } = useStore()
  const filtered = getFilteredFlows(data.flows.flows, filters)

  useEffect(() => {
    if (selectedDonorId) {
      setTab('donors')
      return
    }
    if (selectedCountryIso3) {
      setTab('countries')
    }
  }, [selectedCountryIso3, selectedDonorId])

  useEffect(() => {
    setQuery('')
  }, [tab])

  const allEntries = getLeaderboardEntries(filtered, tab, 1000)

  const filteredEntries = query
    ? allEntries.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
    : allEntries

  const entries = filteredEntries.slice(0, 10)

  function selectEntry(id: string) {
    if (tab === 'donors') {
      selectDonor(id)
    } else {
      selectCountry(id)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['donors', 'countries'] as const).map((nextTab) => {
          const isActive = tab === nextTab
          return (
            <button
              key={nextTab}
              type="button"
              className={`flex-1 text-xs py-1 rounded transition-colors capitalize ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setTab(nextTab)}
            >
              {nextTab}
            </button>
          )
        })}
      </div>

      <div className="text-xs text-gray-500 uppercase tracking-wide">
        Top 10 {tab}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        className="w-full bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 placeholder-gray-500 mb-2"
      />

      <ol aria-label={`Top 10 ${tab}`} className="space-y-1">
        {entries.length === 0 ? (
          <li className="text-xs text-gray-500 px-1 py-1">No matching {tab}.</li>
        ) : (
          entries.map((entry, index) => {
            const isSelected = tab === 'donors'
              ? selectedDonorId === entry.id
              : selectedCountryIso3 === entry.id

            return (
              <li
                key={entry.id}
                tabIndex={0}
                data-selected={isSelected ? 'true' : 'false'}
                className={`flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                  isSelected ? 'bg-gray-800 text-white' : ''
                }`}
                onClick={() => selectEntry(entry.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectEntry(entry.id)
                  }
                }}
              >
                <span className="text-gray-500 text-xs w-4">{index + 1}</span>
                <span className="text-white text-xs flex-1 truncate">{entry.name}</span>
                <span className="text-blue-400 text-xs">{entry.total_usd_m.toFixed(1)}M</span>
              </li>
            )
          })
        )}
      </ol>
    </div>
  )
}
