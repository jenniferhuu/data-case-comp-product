import { NextRequest, NextResponse } from 'next/server'
import { getDrilldown } from '../../../server/services/drilldownService'
import { handleApiRequest } from '../overview/route'

export async function GET(request: NextRequest) {
  return handleApiRequest(
    () => getDrilldown(request.nextUrl.searchParams),
    'DRILLDOWN_UNAVAILABLE',
    'Drilldown data is unavailable.',
  )
}
