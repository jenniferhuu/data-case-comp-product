import { NextResponse } from 'next/server'
import { getOverview } from '../../../server/services/overviewService'

export async function handleApiRequest<T>(
  load: () => Promise<T>,
  error: string,
  message: string,
) {
  try {
    const data = await load()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      {
        error,
        message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return handleApiRequest(getOverview, 'OVERVIEW_UNAVAILABLE', 'Overview data is unavailable.')
}
