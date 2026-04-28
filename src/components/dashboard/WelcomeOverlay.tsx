'use client'

import React, { useState } from 'react'

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(true)

  function dismiss() {
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-sm">
      <section className="relative w-full max-w-xl rounded-[1.75rem] border border-white/12 bg-slate-950/95 p-5 text-white shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <button
          type="button"
          aria-label="Dismiss welcome overlay"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full border border-white/10 px-2.5 py-1 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
        >
          Close
        </button>
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Welcome</p>
        <h2 className="mt-2 text-2xl font-semibold">How to read the dashboard</h2>
        <p className="mt-2 text-sm text-slate-300">
          Start with the left filters, use the globe to move into a donor or country, and read the matching breakdowns on the right.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-medium text-white">Left rail</p>
            <p className="mt-1.5 text-sm text-slate-300">Switch funding mode and filter by donor, country, sector, or year.</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-medium text-white">Center globe</p>
            <p className="mt-1.5 text-sm text-slate-300">Hover for corridor context. Click a donor or country to focus the map.</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-medium text-white">Right rail</p>
            <p className="mt-1.5 text-sm text-slate-300">Review sector mix, delivery channels, geography, and yearly trends.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">This guide reopens when the page reloads.</p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
          >
            Start exploring
          </button>
        </div>
      </section>
    </div>
  )
}
