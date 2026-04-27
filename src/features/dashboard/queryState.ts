import { dashboardQuerySchema, type DashboardQuery } from '../../contracts/filters'

type DashboardQueryInput =
  | DashboardQuery
  | Partial<DashboardQuery>
  | Record<string, string | number | undefined>

const emptyDashboardQuery = {
  yearMode: 'all' as const,
  year: undefined,
  compareFrom: undefined,
  compareTo: undefined,
  donorCountry: undefined,
  sector: undefined,
  marker: undefined,
  selectionType: undefined,
  selectionId: undefined,
}

function normalizeDashboardQueryRecord(searchParams: DashboardQueryInput): Record<string, string | undefined> {
  const normalizedEntries = Object.entries(searchParams).flatMap(([key, value]) => {
    if (value === undefined) {
      return []
    }

    return [[key, String(value)]]
  })

  return Object.fromEntries(normalizedEntries)
}

function materializeDashboardQuery(query: DashboardQuery): DashboardQuery {
  return {
    ...emptyDashboardQuery,
    ...query,
  }
}

export function parseDashboardQuery(searchParams?: URLSearchParams | string | DashboardQueryInput): DashboardQuery {
  if (searchParams === undefined) {
    return materializeDashboardQuery(dashboardQuerySchema.parse({}))
  }

  if (typeof searchParams === 'string') {
    return materializeDashboardQuery(dashboardQuerySchema.parse(Object.fromEntries(new URLSearchParams(searchParams).entries())))
  }

  if (searchParams instanceof URLSearchParams) {
    return materializeDashboardQuery(dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries())))
  }

  return materializeDashboardQuery(dashboardQuerySchema.parse(normalizeDashboardQueryRecord(searchParams)))
}

export function mergeDashboardQuery(currentQuery: DashboardQuery, patch: Partial<DashboardQuery>): DashboardQuery {
  const mergedQuery: Record<string, string | undefined> = {
    yearMode: currentQuery.yearMode,
    year: currentQuery.year?.toString(),
    compareFrom: currentQuery.compareFrom?.toString(),
    compareTo: currentQuery.compareTo?.toString(),
    donorCountry: currentQuery.donorCountry,
    sector: currentQuery.sector,
    marker: currentQuery.marker,
    selectionType: currentQuery.selectionType,
    selectionId: currentQuery.selectionId,
  }

  for (const [key, value] of Object.entries(patch)) {
    mergedQuery[key] = value === undefined ? undefined : String(value)
  }

  return parseDashboardQuery(mergedQuery)
}

export function createDashboardSearchParams(query: DashboardQuery): URLSearchParams {
  const parsed = dashboardQuerySchema.parse(query)
  const entries = Object.entries(parsed).flatMap(([key, value]) => {
    if (value === undefined) {
      return []
    }

    return [[key, String(value)]]
  })

  return new URLSearchParams(entries)
}
