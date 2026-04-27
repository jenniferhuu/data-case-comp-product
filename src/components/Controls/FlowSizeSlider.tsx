import { useState } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useStore } from '../../state/store'

const STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 25, 50]
const MAX_IDX = STEPS.length - 1

// idx 0 = no minimum (flowSizeMin = 0)
// idx MAX_IDX = no maximum (flowSizeMax = null)
function idxToMin(idx: number): number {
  return idx === 0 ? 0 : STEPS[idx]
}
function idxToMax(idx: number): number | null {
  return idx === MAX_IDX ? null : STEPS[idx]
}
function minToIdx(min: number): number {
  if (min === 0) return 0
  const i = STEPS.findIndex((s) => s >= min)
  return i < 0 ? MAX_IDX : i
}
function maxToIdx(max: number | null): number {
  if (max === null) return MAX_IDX
  const i = STEPS.findIndex((s) => s >= max)
  return i < 0 ? MAX_IDX : i
}

export function FlowSizeSlider() {
  const { flowSizeMin, setFlowSizeMin, flowSizeMax, setFlowSizeMax } = useStore()

  const [minInput, setMinInput] = useState(flowSizeMin === 0 ? '0' : String(flowSizeMin))
  const [maxInput, setMaxInput] = useState(flowSizeMax === null ? '∞' : String(flowSizeMax))

  const handleSliderChange = (value: number | number[]) => {
    const [lo, hi] = value as number[]
    const newMin = idxToMin(lo)
    const newMax = idxToMax(hi)
    setFlowSizeMin(newMin)
    setFlowSizeMax(newMax)
    setMinInput(newMin === 0 ? '0' : String(newMin))
    setMaxInput(newMax === null ? '∞' : String(newMax))
  }

  const commitMin = () => {
    if (minInput === '0' || minInput === '') {
      setFlowSizeMin(0)
      return
    }
    const v = parseFloat(minInput)
    if (!isNaN(v) && v >= 0) {
      setFlowSizeMin(v)
    } else {
      setMinInput(flowSizeMin === 0 ? '0' : String(flowSizeMin))
    }
  }

  const commitMax = () => {
    if (maxInput === '∞' || maxInput === '') {
      setFlowSizeMax(null)
      return
    }
    const v = parseFloat(maxInput)
    if (!isNaN(v) && v > 0) {
      setFlowSizeMax(v)
    } else {
      setMaxInput(flowSizeMax === null ? '∞' : String(flowSizeMax))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Flow size ($M)</label>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-500">$</span>
          <input
            type="text"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => e.key === 'Enter' && commitMin()}
            className="w-12 text-xs bg-gray-800 border border-gray-600 text-white rounded px-1.5 py-0.5 text-center"
          />
          <span className="text-gray-500">–</span>
          <span className="text-gray-500">$</span>
          <input
            type="text"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => e.key === 'Enter' && commitMax()}
            className="w-12 text-xs bg-gray-800 border border-gray-600 text-white rounded px-1.5 py-0.5 text-center"
          />
        </div>
      </div>
      <Slider
        range
        min={0}
        max={MAX_IDX}
        value={[minToIdx(flowSizeMin), maxToIdx(flowSizeMax)]}
        onChange={handleSliderChange}
        styles={{
          track: { backgroundColor: '#3b82f6', height: 4 },
          rail: { backgroundColor: '#374151', height: 4 },
          handle: {
            borderColor: '#3b82f6',
            backgroundColor: '#1d4ed8',
            opacity: 1,
            width: 14,
            height: 14,
            marginTop: -5,
          },
        }}
      />
    </div>
  )
}
