import { NextResponse } from 'next/server'

export async function handleApiRequest<T>(
  load: () => Promise<T>,
  error: string,
  message: string,
) {
  try {
    const data = await load()
    return NextResponse.json(data)
  } catch (cause) {
    console.error(`[api] ${error}`, cause)
    return NextResponse.json(
      {
        error,
        message,
      },
      { status: 500 },
    )
  }
}
