import { getFilters } from '../../../server/services/filterService'
import { handleApiRequest } from '../overview/route'

export async function GET() {
  return handleApiRequest(getFilters, 'FILTERS_UNAVAILABLE', 'Filter data is unavailable.')
}
