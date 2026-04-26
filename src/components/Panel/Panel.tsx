import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Panel({ title, onClose, children }: PanelProps) {
  return (
    <aside className="w-80 bg-gray-900/95 border-l border-gray-700/60 flex flex-col overflow-hidden shrink-0 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60 bg-gray-800/50">
        <h2 className="text-white font-semibold text-sm truncate pr-2">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors shrink-0 p-0.5 rounded hover:bg-gray-700"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">{children}</div>
    </aside>
  )
}
