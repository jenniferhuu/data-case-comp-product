import type { NextRequest } from 'next/server'
import { getOverview } from '../../../server/services/overviewService'
import { handleApiRequest } from '../../../server/api/handleApiRequest'

export async function GET(request: NextRequest) {
  return handleApiRequest(
    () => getOverview(request.nextUrl.searchParams),
    'OVERVIEW_UNAVAILABLE',
    'Overview data is unavailable.',
  )
}
