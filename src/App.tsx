import { useEffect, useState } from 'react'
import { loadAppData } from './lib/dataLoader'
import type { AppData } from './types'
import { Header } from './components/Layout/Header'
import { MethodologyFooter } from './components/Layout/MethodologyFooter'
import { LeftSidebar } from './components/Sidebar/LeftSidebar'
import { CesiumGlobe } from './components/Globe/CesiumGlobe'
import { Panel } from './components/Panel/Panel'
import { DonorPanel } from './components/Panel/DonorPanel'
import { CountryPanel } from './components/Panel/CountryPanel'
import { YearControls } from './components/Controls/YearControls'
import { MarkerSelector } from './components/Controls/MarkerSelector'
import { ArcLegend } from './components/Controls/ArcLegend'
import { useStore } from './state/store'

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { selectedDonorId, setSelectedDonorId, selectedCountryIso3, setSelectedCountryIso3, mode } = useStore()

  useEffect(() => {
    loadAppData().then(setData).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-500 p-8">{error}</div>
  if (!data) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <div className="text-center space-y-3">
        <div className="text-2xl font-bold tracking-wide">PhilanthroGlobe</div>
        <div className="text-gray-400 text-sm">Loading data…</div>
      </div>
    </div>
  )

  const selectedDonor   = selectedDonorId     ? data.donors.find(d => d.donor_id === selectedDonorId) ?? null : null
  const selectedCountry = selectedCountryIso3  ? data.countries.find(c => c.iso3 === selectedCountryIso3) ?? null : null
  const markerData      = selectedDonorId      ? data.markers.find(m => m.donor_id === selectedDonorId) ?? null : null

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar data={data} />
        <div className="flex-1 relative">
          <CesiumGlobe data={data} />
        </div>
        {(selectedDonor || selectedCountry) && (
          <Panel
            title={selectedDonor?.donor_name ?? selectedCountry?.name ?? ''}
            onClose={() => { setSelectedDonorId(null); setSelectedCountryIso3(null) }}
          >
            {selectedDonor   && <DonorPanel donor={selectedDonor} markerData={markerData} />}
            {selectedCountry && !selectedDonor && <CountryPanel country={selectedCountry} />}
          </Panel>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-t border-gray-700 overflow-x-auto">
        <YearControls />
        {mode === 'credibility' && <MarkerSelector />}
        <ArcLegend />
      </div>
      <MethodologyFooter />
    </div>
  )
}
