import type { AppData } from '../../types'
import { DonorCountryFilter } from '../Controls/DonorCountryFilter'
import { SectorFilter } from '../Controls/SectorFilter'
import { FlowSizeSlider } from '../Controls/FlowSizeSlider'
import { Leaderboard } from './Leaderboard'

interface Props { data: AppData }

export function LeftSidebar({ data }: Props) {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-700 flex flex-col gap-4 p-3 overflow-y-auto shrink-0">
      <DonorCountryFilter options={data.filterOptions.donor_countries} />
      <SectorFilter options={data.filterOptions.sectors} />
      <FlowSizeSlider />
      <hr className="border-gray-700" />
      <Leaderboard data={data} />
    </aside>
  )
}
