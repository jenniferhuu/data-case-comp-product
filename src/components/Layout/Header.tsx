import { ModeToggle } from '../Controls/ModeToggle'

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 z-10">
      <h1 className="text-white font-bold text-lg tracking-wide">PhilanthroGlobe</h1>
      <ModeToggle />
    </header>
  )
}
