import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateAlertStatus, calculateAge } from '@/lib/queries'

// Server-side admin client (service role key — never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STAGE_ORDER = ['intake', 'underwriting', 'market', 'working', 'closing', 'closed']

function mapPolicyToCase(policy: any) {
  const insured = policy.insureds ?? {}
  const isAnon = insured.is_anonymous === true

  const firstName = isAnon
    ? (insured.anonymous_alias ?? 'Anonymous')
    : (insured.first_name ?? 'Unknown')
  const lastName = isAnon ? '' : (insured.last_name ?? '')

  const alertInfo = calculateAlertStatus(policy.updated_at)

  return {
    id: policy.id,
    insured: {
      first_name: firstName,
      last_name: lastName,
      age: calculateAge(insured.dob),
      conditions: insured.primary_medical_condition ?? '',
      is_anonymous: isAnon,
    },
    policies: [
      {
        face_amount: policy.death_benefit ?? 0,
        carrier: policy.carrier ?? '',
        product_type: policy.policy_type ?? '',
      },
    ],
    stage: policy.stage ?? 'intake',
    alertInfo,
    last_activity: {
      type: 'note' as const,
      at: policy.updated_at,
      summary: policy.notes ?? '',
    },
    next_action: undefined,
    owner: { id: 'user-alex', name: 'Alex Barba', initials: 'AB' },
    source: 'originated',
    probability: undefined,
    expected_close: undefined,
  }
}

function groupByAlertStatus(cases: ReturnType<typeof mapPolicyToCase>[]) {
  const red = cases.filter(c => c.alertInfo.status === 'red')
  const yellow = cases.filter(c => c.alertInfo.status === 'yellow')
  const green = cases.filter(c => c.alertInfo.status === 'green' && c.stage !== 'closed')

  const active = cases.filter(c => c.stage !== 'closed')
  const totalFace = active.reduce((s, c) => s + (c.policies[0]?.face_amount ?? 0), 0)
  const bidsPending = cases.filter(c => c.stage === 'market' || c.stage === 'working').length

  return {
    red,
    yellow,
    green,
    stats: {
      total_face: totalFace,
      active_count: active.length,
      bids_pending: bidsPending,
    },
  }
}

function groupByStage(cases: ReturnType<typeof mapPolicyToCase>[]) {
  const grouped: Record<string, ReturnType<typeof mapPolicyToCase>[]> = {}
  for (const stage of STAGE_ORDER) grouped[stage] = []

  cases.forEach(c => {
    const s = (c.stage ?? 'intake').toLowerCase()
    if (grouped[s]) grouped[s].push(c)
    else grouped[s] = [c]
  })

  const stageStats: Record<string, { count: number; total_face: number }> = {}
  for (const [stage, list] of Object.entries(grouped)) {
    stageStats[stage] = {
      count: list.length,
      total_face: list.reduce((s, c) => s + (c.policies[0]?.face_amount ?? 0), 0),
    }
  }

  const active = cases.filter(c => c.stage !== 'closed')
  const totalFace = active.reduce((s, c) => s + (c.policies[0]?.face_amount ?? 0), 0)
  const requireAction = cases.filter(c => c.alertInfo.status === 'red').length
  const bidsPending = cases.filter(c => c.stage === 'market' || c.stage === 'working').length

  return {
    stages: STAGE_ORDER,
    grouped,
    stageStats,
    stats: {
      total_face: totalFace,
      active_count: active.length,
      require_action: requireAction,
      bids_pending: bidsPending,
    },
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const groupBy = searchParams.get('groupBy')

  const { data, error } = await supabaseAdmin
    .from('policies')
    .select(`
      id, policy_number, carrier, death_benefit, stage, annual_premium,
      policy_type, issue_date, notes, created_at, updated_at,
      insureds (first_name, last_name, dob, gender, health_status,
                primary_medical_condition, residence_state, is_anonymous, anonymous_alias)
    `)
    .eq('source_type', 'originated')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Supabase error fetching policies:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cases = (data ?? []).map(mapPolicyToCase)

  if (groupBy === 'alertStatus') {
    return NextResponse.json(groupByAlertStatus(cases))
  }

  if (groupBy === 'stage') {
    return NextResponse.json(groupByStage(cases))
  }

  return NextResponse.json(cases)
}
