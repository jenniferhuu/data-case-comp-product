export interface CanonicalDonor {
  id: string
  name: string
  country: string
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function resolveDonor(row: Record<string, string>): CanonicalDonor {
  const name = normalizeText(row.donor_name) ?? normalizeText(row.organization_name) ?? 'Unknown donor'
  const country = normalizeText(row.donor_country) ?? normalizeText(row.Donor_country) ?? 'Unknown'
  const id = slug(name) || 'unknown-donor'

  return {
    id,
    name,
    country,
  }
}
