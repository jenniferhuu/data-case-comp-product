import { useStore } from '../../state/store'
import { MARKER_LABELS, ALL_MARKERS } from '../../types'

export function MarkerSelector() {
  const { selectedMarker, setSelectedMarker } = useStore()

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400" htmlFor="marker-selector">
        Marker:
      </label>
      <select
        id="marker-selector"
        className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
        value={selectedMarker}
        onChange={(e) => setSelectedMarker(e.target.value as typeof selectedMarker)}
      >
        {ALL_MARKERS.map((marker) => (
          <option key={marker} value={marker}>
            {MARKER_LABELS[marker]}
          </option>
        ))}
      </select>
    </div>
  )
}
