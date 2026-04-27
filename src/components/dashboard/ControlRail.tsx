'use client'

import React, { useEffect, useState } from 'react'
import { useDashboardState } from '../../features/dashboard/useDashboardState'

interface FiltersResponse {
  donorCountries: string[]
  sectors: string[]
  years: number[]
  markers: string[]
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
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
        className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ControlRail() {
  const [filters, setFilters] = useState<FiltersResponse | null>(null)
  const patchQuery = useDashboardState((state) => state.patchQuery)
  const setIdleMode = useDashboardState((state) => state.setIdleMode)
  const yearMode = useDashboardState((state) => state.yearMode)
  const year = useDashboardState((state) => state.year)
  const compareFrom = useDashboardState((state) => state.compareFrom)
  const compareTo = useDashboardState((state) => state.compareTo)
  const donorCountry = useDashboardState((state) => state.donorCountry)
  const sector = useDashboardState((state) => state.sector)
  const selectionType = useDashboardState((state) => state.selectionType)
  const selectionId = useDashboardState((state) => state.selectionId)

  useEffect(() => {
    let cancelled = false

    void fetch('/api/filters')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Filter request failed')
        }

        return response.json() as Promise<FiltersResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setFilters(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFilters(null)
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
    activateManualMode()
    patchQuery({
      yearMode: 'all',
      year: undefined,
      compareFrom: undefined,
      compareTo: undefined,
      donorCountry: undefined,
      sector: undefined,
      marker: undefined,
    })
  }

  return (
    <aside className="border-r border-white/10 bg-slate-950/45 px-6 py-28 backdrop-blur">
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Controls</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Filter the global flow map</h2>
          <p className="mt-2 text-sm text-slate-300">
            Shift from ambient motion into an analyst workspace with year, donor, and sector filters.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">View mode</p>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/70 p-1">
            {(['all', 'single', 'compare'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateYearMode(mode)}
                disabled={mode !== 'all' && years.length === 0}
                className={`rounded-xl px-3 py-2 text-sm capitalize transition ${
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

        <section className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-4">
          {filters === null ? (
            <p className="text-sm text-slate-300">Loading dashboard filters...</p>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                label="Donor country"
                value={donorCountry ?? ''}
                placeholder="All donor countries"
                options={filters.donorCountries}
                onChange={(value) => {
                  activateManualMode()
                  patchQuery({ donorCountry: value })
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
                className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Reset filters
              </button>
            </>
          )}
        </section>

        <section className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
            {selectionType === undefined || selectionId === undefined
              ? 'No active drilldown. Click a glow point to focus a country or an arc to inspect a donor.'
              : `Active drilldown: ${selectionType} ${selectionId}`}
          </div>
          <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-4 text-sm text-cyan-100">
            Compare mode layers two years at once, while single-year mode isolates one campaign cycle for judges.
          </div>
        </section>
      </div>
    </aside>
  )
}
