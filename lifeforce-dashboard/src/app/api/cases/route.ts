import { NextRequest, NextResponse } from 'next/server'
import { getCases, getCasesByAlertStatus } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupBy = searchParams.get('groupBy')
    const userId = searchParams.get('userId')

    if (groupBy === 'alertStatus') {
      const cases = await getCasesByAlertStatus(userId || undefined)
      return NextResponse.json(cases)
    }

    const cases = await getCases(userId || undefined)
    return NextResponse.json(cases)
  } catch (error) {
    console.error('Error in /api/cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}
