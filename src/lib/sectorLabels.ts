const SECTOR_LABELS: Record<string, string> = {
  '110': 'Education',
  '111': 'Education',
  '112': 'Education',
  '113': 'Education',
  '114': 'Education',
  '120': 'Health',
  '121': 'Health',
  '122': 'Health',
  '123': 'Health',
  '130': 'Health',
  '140': 'Water & Sanitation',
  '150': 'Gov & Civil Society',
  '151': 'Gov & Civil Society',
  '152': 'Gov & Civil Society',
  '153': 'Gov & Civil Society',
  '160': 'Other Social Services',
  '210': 'Economic Dev',
  '220': 'Economic Dev',
  '230': 'Climate',
  '231': 'Climate',
  '232': 'Climate',
  '236': 'Climate',
  '240': 'Economic Dev',
  '250': 'Economic Dev',
  '310': 'Economic Dev',
  '311': 'Economic Dev',
  '312': 'Economic Dev',
  '313': 'Economic Dev',
  '320': 'Economic Dev',
  '321': 'Economic Dev',
  '322': 'Economic Dev',
  '323': 'Economic Dev',
  '330': 'Economic Dev',
  '331': 'Economic Dev',
  '332': 'Economic Dev',
  '410': 'Environment',
  '430': 'Environment',
  '510': 'Economic Dev',
  '520': 'Food Assistance',
  '530': 'Debt Relief',
  '600': 'Administrative Costs',
  '720': 'Emergency',
  '730': 'Reconstruction',
  '740': 'Disaster Prevention',
  '910': 'Multi-sector',
  '930': 'Refugees',
  '998': 'Other',
}

function normalizeSingleSectorLabel(value: string): string {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return 'Other'
  }

  if (trimmed.includes(';')) {
    return 'Multi-sector'
  }

  return SECTOR_LABELS[trimmed] ?? trimmed
}

export function normalizeSectorLabel(value: string): string {
  return normalizeSingleSectorLabel(value)
}

export function normalizeSectorLabels(values: string[]): string[] {
  return [...new Set(values.map(normalizeSingleSectorLabel))].sort((left, right) => left.localeCompare(right))
}
