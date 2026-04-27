'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useDashboardState } from '../../features/dashboard/useDashboardState'

interface FiltersResponse {
  donors: string[]
  donorCountries: string[]
  recipientCountries: string[]
  sectors: string[]
  years: number[]
  markers: string[]
  donorIdMap: Record<string, string>
  recipientCountryIsoMap: Record<string, string>
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  options: string[]
  onChange: (value: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const displayValue = value === '' ? placeholder : value

  return (
    <div ref={containerRef} className="grid min-w-0 gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-slate-900/70 px-3 py-3 text-left text-sm text-white outline-none transition focus:border-cyan-300/60"
        >
          <span className={value === '' ? 'text-slate-400' : ''}>{displayValue}</span>
          <svg
            className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-white/20 bg-slate-900 shadow-xl">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false) }}
              className="w-full px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => { onChange(option); setOpen(false) }}
                className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-white/5 hover:text-white ${
                  option === value ? 'bg-cyan-400/10 text-cyan-300' : 'text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ControlRail() {
  const [filters, setFilters] = useState<FiltersResponse | null>(null)
  const [filtersError, setFiltersError] = useState<string | null>(null)
  const patchQuery = useDashboardState((state) => state.patchQuery)
  const resetSelection = useDashboardState((state) => state.resetSelection)
  const selectCountry = useDashboardState((state) => state.selectCountry)
  const selectDonor = useDashboardState((state) => state.selectDonor)
  const setIdleMode = useDashboardState((state) => state.setIdleMode)
  const yearMode = useDashboardState((state) => state.yearMode)
  const year = useDashboardState((state) => state.year)
  const compareFrom = useDashboardState((state) => state.compareFrom)
  const compareTo = useDashboardState((state) => state.compareTo)
  const donor = useDashboardState((state) => state.donor)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const recipientCountry = useDashboardState((state) => state.recipientCountry)
  const sector = useDashboardState((state) => state.sector)
  useEffect(() => {
    let cancelled = false

    void fetch('/api/filters')
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { message?: string } | null
          throw new Error(payload?.message ?? 'Filter data is unavailable.')
        }

        return response.json() as Promise<FiltersResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setFilters(data)
          setFiltersError(null)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFilters(null)
          setFiltersError(error instanceof Error ? error.message : 'Filter data is unavailable.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const years = filters?.years ?? []
  const yearOptions = filters?.years.map(String) ?? []

  function activateManualMode() {
    setIdleMode(false)
  }

  function updateYearMode(nextMode: 'all' | 'single' | 'compare') {
    activateManualMode()

    if (nextMode === 'all') {
      patchQuery({
        yearMode: 'all',
        year: undefined,
        compareFrom: undefined,
        compareTo: undefined,
      })
      return
    }

    if (years.length === 0) {
      return
    }

    if (nextMode === 'single') {
      patchQuery({
        yearMode: 'single',
        year: year ?? years.at(-1),
        compareFrom: undefined,
        compareTo: undefined,
      })
      return
    }

    patchQuery({
      yearMode: 'compare',
      year: undefined,
      compareFrom: compareFrom ?? years.at(-2),
      compareTo: compareTo ?? years.at(-1),
    })
  }

  function clearFilters() {
    resetSelection()
    patchQuery({
      yearMode: 'all',
      year: undefined,
      compareFrom: undefined,
      compareTo: undefined,
      donor: undefined,
      donorCountry: undefined,
      recipientCountry: undefined,
      sector: undefined,
      marker: undefined,
      selectionType: undefined,
      selectionId: undefined,
    })
  }

  return (
    <aside className="border-r border-white/10 bg-slate-950/45 px-4 pb-12 pt-28 backdrop-blur lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-5">
      <div className="space-y-5">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Controls</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Filter the global flow map</h2>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3.5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">View mode</p>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-1">
            {(['all', 'single', 'compare'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateYearMode(mode)}
                disabled={mode !== 'all' && years.length === 0}
                className={`rounded-xl px-2 py-2 text-xs font-medium capitalize transition ${
                  yearMode === mode ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                } ${
                  mode !== 'all' && years.length === 0 ? 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-slate-300' : ''
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3.5 rounded-[1.5rem] border border-white/15 bg-slate-900/50 p-3.5">
          {filters === null ? (
            filtersError === null ? (
              <p className="text-sm text-slate-300">Loading dashboard filters...</p>
            ) : (
              <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
                {filtersError}
              </p>
            )
          ) : (
            <>
              {yearMode === 'single' ? (
                <SelectField
                  label="Year"
                  value={year?.toString() ?? ''}
                  placeholder="Select a year"
                  options={yearOptions}
                  onChange={(value) => {
                    activateManualMode()
                    patchQuery({ year: value === undefined ? undefined : Number(value) })
                  }}
                />
              ) : null}

              {yearMode === 'compare' ? (
                <div className="grid gap-3">
                  <SelectField
                    label="Compare from"
                    value={compareFrom?.toString() ?? ''}
                    placeholder="Choose baseline year"
                    options={yearOptions}
                    onChange={(value) => {
                      activateManualMode()
                      patchQuery({ compareFrom: value === undefined ? undefined : Number(value) })
                    }}
                  />
                  <SelectField
                    label="Compare to"
                    value={compareTo?.toString() ?? ''}
                    placeholder="Choose current year"
                    options={yearOptions}
                    onChange={(value) => {
                      activateManualMode()
                      patchQuery({ compareTo: value === undefined ? undefined : Number(value) })
                    }}
                  />
                </div>
              ) : null}

              <SelectField
                label="Donor"
                value={donor ?? ''}
                placeholder="All donors"
                options={filters.donors ?? []}
                onChange={(value) => {
                  activateManualMode()
                  patchQuery({ donor: value })
                  if (value !== undefined) {
                    const id = filters.donorIdMap[value]
                    if (id !== undefined) {
                      selectDonor(id)
                    }
                  } else {
                    resetSelection()
                  }
                }}
              />

              <SelectField
                label="Donor country"
                value={donorCountry ?? ''}
                placeholder="All donor countries"
                options={filters.donorCountries}
                onChange={(value) => {
                  activateManualMode()
                  patchQuery({ donorCountry: value })
                  resetSelection()
                }}
              />

              <SelectField
                label="Recipient country"
                value={recipientCountry ?? ''}
                placeholder="All recipient countries"
                options={filters.recipientCountries ?? []}
                onChange={(value) => {
                  activateManualMode()
                  patchQuery({ recipientCountry: value })
                  if (value !== undefined) {
                    const iso3 = filters.recipientCountryIsoMap[value]
                    if (iso3 !== undefined) {
                      selectCountry(iso3)
                    }
                  } else {
                    resetSelection()
                  }
                }}
              />

              <SelectField
                label="Sector"
                value={sector ?? ''}
                placeholder="All sectors"
                options={filters.sectors}
                onChange={(value) => {
                  activateManualMode()
                  patchQuery({ sector: value })
                }}
              />

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-white/20 bg-slate-800/60 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700/60 hover:border-white/30"
              >
                Reset filters
              </button>
            </>
          )}
        </section>

      </div>
    </aside>
  )
}
