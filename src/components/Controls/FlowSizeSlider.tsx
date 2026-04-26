import { useStore } from '../../state/store'

const STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 25, 50]

export function FlowSizeSlider() {
  const { flowSizeMin, setFlowSizeMin } = useStore()
  const idx = STEPS.findIndex((s) => s >= flowSizeMin)
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 uppercase tracking-wide">
        Min flow size: <span className="text-white">${flowSizeMin}M+</span>
      </label>
      <input
        type="range"
        min={0}
        max={STEPS.length - 1}
        value={Math.max(0, idx)}
        onChange={(e) => setFlowSizeMin(STEPS[Number(e.target.value)])}
        className="w-full accent-blue-500"
      />
    </div>
  )
}
