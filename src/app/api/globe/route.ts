import { NextRequest } from 'next/server'
import { getGlobeData } from '../../../server/services/globeService'
import { handleApiRequest } from '../../../server/api/handleApiRequest'

export async function GET(request: NextRequest) {
  return handleApiRequest(
    () => getGlobeData(request.nextUrl.searchParams),
    'GLOBE_UNAVAILABLE',
    'Globe data is unavailable.',
  )
}
