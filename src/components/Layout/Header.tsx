import { ModeToggle } from '../Controls/ModeToggle'

export function Header() {
  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-gray-900/95 border-b border-gray-700/60 z-10 backdrop-blur-sm shrink-0">
      <div className="flex items-baseline gap-3">
        <h1 className="text-white font-bold text-lg tracking-wide">PhilanthroGlobe</h1>
        <span className="text-gray-500 text-xs">OECD Private Philanthropy · 2020–2023</span>
      </div>
      <ModeToggle />
    </header>
  )
}
