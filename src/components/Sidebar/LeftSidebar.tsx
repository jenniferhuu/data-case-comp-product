import type { AppData } from '../../types'
import { DonorCountryFilter } from '../Controls/DonorCountryFilter'
import { SectorFilter } from '../Controls/SectorFilter'
import { FlowSizeSlider } from '../Controls/FlowSizeSlider'
import { Leaderboard } from './Leaderboard'

interface Props { data: AppData }

export function LeftSidebar({ data }: Props) {
  return (
    <aside className="w-60 bg-gray-900/95 border-r border-gray-700/60 flex flex-col gap-5 p-4 overflow-y-auto shrink-0 backdrop-blur-sm">
      <div className="space-y-4">
        <DonorCountryFilter options={data.filterOptions.donor_countries} />
        <SectorFilter options={data.filterOptions.sectors} />
        <FlowSizeSlider />
      </div>
      <div className="border-t border-gray-700/60 pt-4">
        <Leaderboard data={data} />
      </div>
    </aside>
  )
}
