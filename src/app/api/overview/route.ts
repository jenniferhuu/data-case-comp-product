import { getOverview } from '../../../server/services/overviewService'
import { handleApiRequest } from '../../../server/api/handleApiRequest'

export async function GET() {
  return handleApiRequest(getOverview, 'OVERVIEW_UNAVAILABLE', 'Overview data is unavailable.')
}
