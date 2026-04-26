import { useState } from 'react'
import { useStore } from '../../state/store'

const STEPS = [0.01, 0.1, 0.5, 1, 2, 5, 10, 25, 50]

export function FlowSizeSlider() {
  const { flowSizeMin, setFlowSizeMin } = useStore()
  const [inputVal, setInputVal] = useState(String(flowSizeMin))
  const idx = STEPS.findIndex((s) => s >= flowSizeMin)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value)
  }

  const commitInput = () => {
    const parsed = parseFloat(inputVal)
    if (!isNaN(parsed) && parsed >= 0) {
      setFlowSizeMin(parsed)
      setInputVal(String(parsed))
    } else {
      setInputVal(String(flowSizeMin))
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = STEPS[Number(e.target.value)]
    setFlowSizeMin(newValue)
    setInputVal(String(newValue))
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          Min flow size:
        </label>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">$</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && commitInput()}
            onBlur={commitInput}
            className="w-16 text-xs bg-gray-800 border border-gray-600 text-white rounded px-1.5 py-0.5"
          />
          <span className="text-gray-500 text-xs">M+</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={STEPS.length - 1}
        value={Math.max(0, idx)}
        onChange={handleSliderChange}
        className="w-full accent-blue-500"
      />
    </div>
  )
}
