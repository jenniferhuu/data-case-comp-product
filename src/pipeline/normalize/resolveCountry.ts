export interface CanonicalRecipient {
  iso3: string
  name: string
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function resolveCountry(row: Record<string, string>): CanonicalRecipient {
  const name = normalizeText(row.recipient_name) ?? normalizeText(row.country) ?? 'Unknown recipient'
  const iso3 = (normalizeText(row.recipient_iso3) ?? 'UNK').toUpperCase()

  return {
    iso3,
    name,
  }
}
