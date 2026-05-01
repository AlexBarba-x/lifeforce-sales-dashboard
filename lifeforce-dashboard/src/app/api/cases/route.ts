import { NextRequest, NextResponse } from 'next/server'

// Demo data — used until Supabase schema is deployed
const DEMO_CASES = {
  red: [
    {
      id: 'demo-1',
      insured: { first_name: 'Brad', last_name: 'Chowdhury' },
      policies: [{ face_amount: 2000000 }],
      stage: 'Underwriting',
      alertInfo: { status: 'red', reason: 'No contact in 18 days' },
    },
    {
      id: 'demo-2',
      insured: { first_name: 'Jon', last_name: 'Jessen' },
      policies: [{ face_amount: 1500000 }],
      stage: 'Medical Review',
      alertInfo: { status: 'red', reason: 'Open APS requirement — 24 days' },
    },
    {
      id: 'demo-3',
      insured: { first_name: 'Barbara', last_name: 'Shackleton' },
      policies: [{ face_amount: 5000000 }],
      stage: 'Bidding',
      alertInfo: { status: 'red', reason: 'No contact in 16 days' },
    },
  ],
  yellow: [
    {
      id: 'demo-4',
      insured: { first_name: 'Margaret', last_name: 'Okafor' },
      policies: [{ face_amount: 3000000 }],
      stage: 'Intake',
      alertInfo: { status: 'yellow', reason: 'No contact in 9 days' },
    },
    {
      id: 'demo-5',
      insured: { first_name: 'Robert', last_name: 'Stern' },
      policies: [{ face_amount: 750000 }],
      stage: 'Closing',
      alertInfo: { status: 'yellow', reason: 'Open requirement — 15 days' },
    },
  ],
  green: [
    {
      id: 'demo-6',
      insured: { first_name: 'Linda', last_name: 'Nakamura' },
      policies: [{ face_amount: 1000000 }],
      stage: 'Intake',
      alertInfo: { status: 'green' },
    },
    {
      id: 'demo-7',
      insured: { first_name: 'Charles', last_name: 'Brennan' },
      policies: [{ face_amount: 2500000 }],
      stage: 'Underwriting',
      alertInfo: { status: 'green' },
    },
  ],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const groupBy = searchParams.get('groupBy')

  // Return demo data while DB schema is pending
  if (groupBy === 'alertStatus') {
    return NextResponse.json(DEMO_CASES)
  }

  const all = [...DEMO_CASES.red, ...DEMO_CASES.yellow, ...DEMO_CASES.green]
  return NextResponse.json(all)
}
