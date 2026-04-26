import { useStore } from '../../state/store'

const YEARS = [2020, 2021, 2022, 2023]

export function YearControls() {
  const { yearSelection, setYearSelection, compareYears, setCompareYears } = useStore()

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {YEARS.map((y) => (
        <button
          key={y}
          onClick={() => setYearSelection(y)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            yearSelection === y
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {y}
        </button>
      ))}
      <button
        onClick={() => setYearSelection('all')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          yearSelection === 'all'
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setYearSelection('compare')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          yearSelection === 'compare'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        Compare ⇄
      </button>
      {yearSelection === 'compare' && (
        <div className="flex items-center gap-2 ml-2">
          <select
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
            value={compareYears[0]}
            onChange={(e) => setCompareYears([Number(e.target.value), compareYears[1]])}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-gray-400">→</span>
          <select
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
            value={compareYears[1]}
            onChange={(e) => setCompareYears([compareYears[0], Number(e.target.value)])}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
