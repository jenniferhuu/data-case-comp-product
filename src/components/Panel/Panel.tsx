import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Panel({ title, onClose, children }: PanelProps) {
  return (
    <aside className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-semibold text-sm truncate">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
    </aside>
  )
}
