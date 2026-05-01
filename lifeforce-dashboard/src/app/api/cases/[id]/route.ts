import { NextResponse } from 'next/server'

const DEMO_CASES: Record<string, any> = {
  'demo-1': {
    id: 'demo-1',
    stage: 'Underwriting',
    last_contact_date: new Date(Date.now() - 18 * 86400000).toISOString(),
    alertInfo: { status: 'red', reason: 'No contact in 18 days' },
    insured: { first_name: 'Brad', last_name: 'Chowdhury', date_of_birth: '1948-03-14', gender: 'Male' },
    policies: [{ face_amount: 2000000, carrier: 'John Hancock', policy_type: 'Universal Life', annual_premium: 42000 }],
    notes: [
      { id: 'n1', content: 'Client expressed interest in settling. Follow up needed.', is_public: true, created_at: new Date(Date.now() - 20 * 86400000).toISOString(), user_id: 'admin' },
    ],
    bids: [],
    communication_log: [
      { id: 'c1', contact_type: 'Phone', outcome: 'Left voicemail', created_at: new Date(Date.now() - 18 * 86400000).toISOString() },
    ],
    documents: [
      { id: 'd1', document_type: 'Policy Illustration', file_name: 'JH_illustration_2024.pdf', created_at: new Date().toISOString() },
    ],
  },
  'demo-2': {
    id: 'demo-2',
    stage: 'Medical Review',
    last_contact_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    alertInfo: { status: 'red', reason: 'Open APS requirement — 24 days' },
    insured: { first_name: 'Jon', last_name: 'Jessen', date_of_birth: '1942-07-22', gender: 'Male' },
    policies: [{ face_amount: 1500000, carrier: 'Lincoln Financial', policy_type: 'Whole Life', annual_premium: 28000 }],
    notes: [],
    bids: [],
    communication_log: [],
    documents: [],
  },
  'demo-3': {
    id: 'demo-3',
    stage: 'Bidding',
    last_contact_date: new Date(Date.now() - 16 * 86400000).toISOString(),
    alertInfo: { status: 'red', reason: 'No contact in 16 days' },
    insured: { first_name: 'Barbara', last_name: 'Shackleton', date_of_birth: '1939-11-05', gender: 'Female' },
    policies: [{ face_amount: 5000000, carrier: 'Pacific Life', policy_type: 'Universal Life', annual_premium: 118000 }],
    notes: [],
    bids: [
      { id: 'b1', buyer_name: 'American Life Fund', amount: 1250000, status: 'Pending', is_phantom: false, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
    communication_log: [],
    documents: [],
  },
  'demo-4': {
    id: 'demo-4',
    stage: 'Intake',
    last_contact_date: new Date(Date.now() - 9 * 86400000).toISOString(),
    alertInfo: { status: 'yellow', reason: 'No contact in 9 days' },
    insured: { first_name: 'Margaret', last_name: 'Okafor', date_of_birth: '1951-04-30', gender: 'Female' },
    policies: [{ face_amount: 3000000, carrier: 'MassMutual', policy_type: 'Whole Life', annual_premium: 65000 }],
    notes: [],
    bids: [],
    communication_log: [],
    documents: [],
  },
  'demo-5': {
    id: 'demo-5',
    stage: 'Closing',
    last_contact_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    alertInfo: { status: 'yellow', reason: 'Open requirement — 15 days' },
    insured: { first_name: 'Robert', last_name: 'Stern', date_of_birth: '1945-09-18', gender: 'Male' },
    policies: [{ face_amount: 750000, carrier: 'Protective Life', policy_type: 'Term Conversion', annual_premium: 14000 }],
    notes: [],
    bids: [],
    communication_log: [],
    documents: [],
  },
  'demo-6': {
    id: 'demo-6',
    stage: 'Intake',
    last_contact_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    alertInfo: { status: 'green' },
    insured: { first_name: 'Linda', last_name: 'Nakamura', date_of_birth: '1953-12-01', gender: 'Female' },
    policies: [{ face_amount: 1000000, carrier: 'Transamerica', policy_type: 'Universal Life', annual_premium: 19000 }],
    notes: [],
    bids: [],
    communication_log: [],
    documents: [],
  },
  'demo-7': {
    id: 'demo-7',
    stage: 'Underwriting',
    last_contact_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    alertInfo: { status: 'green' },
    insured: { first_name: 'Charles', last_name: 'Brennan', date_of_birth: '1940-06-15', gender: 'Male' },
    policies: [{ face_amount: 2500000, carrier: 'North American', policy_type: 'Universal Life', annual_premium: 55000 }],
    notes: [],
    bids: [],
    communication_log: [],
    documents: [],
  },
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
  const caseData = DEMO_CASES[caseId]

  if (!caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  return NextResponse.json(caseData)
}
