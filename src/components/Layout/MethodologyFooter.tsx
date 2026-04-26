export function MethodologyFooter() {
  return (
    <footer className="px-4 py-1 bg-gray-900 border-t border-gray-700 text-gray-400 text-xs space-y-0.5">
      <p>Source: OECD Private Philanthropy for Development. NDA-aggregated rows excluded from time-series.</p>
      <p>Markers: 0=not targeted, 1=significant, 2=principal. NULL=not screened.</p>
      <p>Credibility = principal_pct + 0.5 × significant_pct. Higher = better alignment.</p>
    </footer>
  )
}
