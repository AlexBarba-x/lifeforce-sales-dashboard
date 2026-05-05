import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateAlertStatus, calculateAge } from '@/lib/queries'

// Server-side admin client (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: policyId } = await params

  const { data, error } = await supabaseAdmin
    .from('policies')
    .select(`
      id, policy_number, carrier, death_benefit, stage, annual_premium,
      policy_type, issue_date, notes, created_at, updated_at,
      insureds (
        first_name, last_name, dob, gender, health_status,
        primary_medical_condition, residence_state, phone, email,
        is_anonymous, anonymous_alias
      )
    `)
    .eq('id', policyId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const insured = (data as any).insureds ?? {}
  const isAnon = insured.is_anonymous === true

  const firstName = isAnon
    ? (insured.anonymous_alias ?? 'Anonymous')
    : (insured.first_name ?? 'Unknown')
  const lastName = isAnon ? '' : (insured.last_name ?? '')

  const alertInfo = calculateAlertStatus((data as any).updated_at)

  const caseData = {
    id: data.id,
    stage: (data as any).stage ?? 'intake',
    last_contact_date: (data as any).updated_at,
    alertInfo,
    insured: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: insured.dob,
      gender: insured.gender,
      age: calculateAge(insured.dob),
      phone: insured.phone,
      email: insured.email,
      health_status: insured.health_status,
      primary_medical_condition: insured.primary_medical_condition,
      residence_state: insured.residence_state,
    },
    policies: [
      {
        face_amount: (data as any).death_benefit ?? 0,
        carrier: (data as any).carrier ?? '',
        policy_type: (data as any).policy_type ?? '',
        annual_premium: (data as any).annual_premium,
        issue_date: (data as any).issue_date,
        policy_number: (data as any).policy_number,
      },
    ],
    notes: (data as any).notes
      ? [
          {
            id: 'note-1',
            content: (data as any).notes,
            is_public: true,
            created_at: (data as any).updated_at,
            user_id: 'admin',
          },
        ]
      : [],
    bids: [],
    communication_log: [],
    documents: [],
  }

  return NextResponse.json(caseData)
}
