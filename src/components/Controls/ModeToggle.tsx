import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { useStore } from '../../state/store'

const MODES = [
  { value: 'crisis', label: 'Crisis Response' },
  { value: 'credibility', label: 'Marker Credibility' },
] as const

export function ModeToggle() {
  const { mode, setMode } = useStore()
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleArrowNavigation = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()

    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + MODES.length) % MODES.length
    const nextMode = MODES[nextIndex]

    setMode(nextMode.value)
    buttonRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      aria-label="Display mode"
      className="flex rounded-full overflow-hidden border border-gray-600"
      role="radiogroup"
    >
      {MODES.map(({ value, label }, index) => {
        const isSelected = mode === value

        return (
          <button
            key={value}
            type="button"
            ref={(element) => {
              buttonRefs.current[index] = element
            }}
            aria-checked={isSelected}
            onClick={() => setMode(value)}
            onKeyDown={(event) => handleArrowNavigation(event, index)}
            role="radio"
            tabIndex={isSelected ? 0 : -1}
            className={`px-4 py-1 text-sm font-medium capitalize transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
