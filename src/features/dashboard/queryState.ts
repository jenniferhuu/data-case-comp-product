import { dashboardQuerySchema, type DashboardQuery } from '../../contracts/filters'

export function parseDashboardQuery(searchParams?: URLSearchParams | string | Record<string, string | undefined>): DashboardQuery {
  if (searchParams === undefined) {
    return dashboardQuerySchema.parse({})
  }

  if (typeof searchParams === 'string') {
    return dashboardQuerySchema.parse(Object.fromEntries(new URLSearchParams(searchParams).entries()))
  }

  if (searchParams instanceof URLSearchParams) {
    return dashboardQuerySchema.parse(Object.fromEntries(searchParams.entries()))
  }

  return dashboardQuerySchema.parse(searchParams)
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
