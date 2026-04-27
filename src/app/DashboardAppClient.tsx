'use client'

import dynamic from 'next/dynamic'

const DashboardApp = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/70">PhilanthroGlobe</p>
        <h1 className="mt-4 text-3xl font-semibold">Preparing the live funding globe</h1>
      </div>
    </div>
  ),
})

export default function DashboardAppClient() {
  return <DashboardApp />
}
