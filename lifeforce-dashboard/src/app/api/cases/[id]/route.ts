import { NextResponse } from 'next/server'
import { getCase } from '@/lib/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params
    const caseData = await getCase(caseId)

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json(caseData)
  } catch (error) {
    console.error('Error in /api/cases/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    )
  }
}
