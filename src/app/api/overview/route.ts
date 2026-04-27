import { getOverview } from '../../../server/services/overviewService'
import { handleApiRequest } from '../../../server/api/handleApiRequest'

export async function GET(request?: Request & { nextUrl?: { searchParams?: URLSearchParams } }) {
  return handleApiRequest(
    () => getOverview(request?.nextUrl?.searchParams),
    'OVERVIEW_UNAVAILABLE',
    'Overview data is unavailable.',
  )
}
