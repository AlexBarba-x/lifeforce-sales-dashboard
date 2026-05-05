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
        id, first_name, last_name, dob, gender, health_status,
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
  const insuredId = insured.id ?? null
  const isAnon = insured.is_anonymous === true

  const firstName = isAnon ? (insured.anonymous_alias ?? 'Anonymous') : (insured.first_name ?? 'Unknown')
  const lastName = isAnon ? '' : (insured.last_name ?? '')
  const alertInfo = calculateAlertStatus((data as any).updated_at)

  // Parallel fetches for all phases
  const [
    leReportsRes,
    medicalRecordsRes,
    physiciansRes,
    hospitalsRes,
    hipaaRes,
    policyReqRes,
    valuationsRes,
    leProjectionsRes,
    lifeExpectanciesRes,
    distPackagesRes,
    closingDetailsRes,
    policyOwnersRes,
    beneficiariesRes,
    entityEventsRes,
    formSubmissionsRes,
    bidsRes,
  ] = await Promise.all([
    insuredId
      ? supabaseAdmin.from('le_reports').select('*').eq('insured_id', insuredId).order('ordered_date', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    insuredId
      ? supabaseAdmin.from('medical_records').select('*').eq('insured_id', insuredId).order('ordered_date', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    insuredId
      ? supabaseAdmin.from('physicians').select('*').eq('insured_id', insuredId)
      : Promise.resolve({ data: [], error: null }),
    insuredId
      ? supabaseAdmin.from('hospitals').select('*').eq('insured_id', insuredId)
      : Promise.resolve({ data: [], error: null }),
    insuredId
      ? supabaseAdmin.from('hipaa_authorizations').select('*').eq('insured_id', insuredId).order('signed_date', { ascending: false }).limit(1)
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin.from('policy_requirements').select('*').eq('policy_id', policyId).order('created_at', { ascending: true }),
    supabaseAdmin.from('valuations').select('*').eq('policy_id', policyId).order('valuation_date', { ascending: false }),
    supabaseAdmin.from('le_projections').select('*').eq('policy_id', policyId).order('projection_date', { ascending: false }),
    supabaseAdmin.from('life_expectancies').select('*').eq('policy_id', policyId).order('report_date', { ascending: false }),
    supabaseAdmin.from('distribution_packages').select('*').eq('policy_id', policyId).order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('closing_details').select('*').eq('policy_id', policyId).limit(1),
    supabaseAdmin.from('policy_owners').select('*').eq('policy_id', policyId),
    supabaseAdmin.from('beneficiaries').select('*').eq('policy_id', policyId),
    insuredId
      ? supabaseAdmin.from('entity_events').select('*').or(`entity_id.eq.${policyId},entity_id.eq.${insuredId}`).order('occurred_at', { ascending: false }).limit(50)
      : supabaseAdmin.from('entity_events').select('*').eq('entity_id', policyId).order('occurred_at', { ascending: false }).limit(50),
    supabaseAdmin.from('form_submissions').select('*').eq('policy_id', policyId).order('created_at', { ascending: false }),
    supabaseAdmin.from('bids').select('*, accounts(name)').eq('policy_id', policyId).order('created_at', { ascending: false }).limit(20),
  ])

  // Enrich medical records with provider names
  const physicians = (physiciansRes.data ?? []) as any[]
  const hospitals = (hospitalsRes.data ?? []) as any[]
  const medicalRecords = ((medicalRecordsRes.data ?? []) as any[]).map((rec: any) => {
    const physician = physicians.find((p: any) => p.id === rec.physician_id)
    const hospital = hospitals.find((h: any) => h.id === rec.hospital_id)
    return {
      ...rec,
      provider_display: physician?.name || hospital?.name || rec.provider_name || '—',
    }
  })

  // Enrich distribution package with recipients + market_updates
  const distPackage = distPackagesRes.data?.[0] ?? null
  let enrichedDistPackage = null
  if (distPackage) {
    const [recipientsRes, marketUpdatesRes] = await Promise.all([
      supabaseAdmin.from('distribution_recipients').select('*').eq('package_id', distPackage.id),
      supabaseAdmin.from('market_updates').select('*').eq('distribution_package_id', distPackage.id).order('sent_at', { ascending: false }),
    ])
    const recipients = (recipientsRes.data ?? []) as any[]
    const recipientAccountIds = recipients.map((r: any) => r.account_id).filter(Boolean)
    let accountNames: Record<string, string> = {}
    if (recipientAccountIds.length > 0) {
      const accRes = await supabaseAdmin.from('accounts').select('id, name').in('id', recipientAccountIds)
      for (const acc of (accRes.data ?? []) as any[]) accountNames[acc.id] = acc.name
    }
    enrichedDistPackage = {
      ...distPackage,
      distribution_recipients: recipients.map((r: any) => ({
        ...r,
        account_name: accountNames[r.account_id] ?? '—',
      })),
      market_updates: marketUpdatesRes.data ?? [],
    }
  }

  // Enrich closing detail with comp_payables + deals
  const closingDetail = (closingDetailsRes.data ?? [])[0] ?? null
  let enrichedClosing = null
  if (closingDetail) {
    const [compPayablesRes, dealsRes] = await Promise.all([
      supabaseAdmin.from('comp_payables').select('*').eq('closing_details_id', closingDetail.id),
      supabaseAdmin.from('deals').select('*').eq('policy_id', policyId).limit(1),
    ])
    const payables = (compPayablesRes.data ?? []) as any[]
    const payableAccountIds = payables.map((p: any) => p.payee_account_id).filter(Boolean)
    let payeeNames: Record<string, string> = {}
    if (payableAccountIds.length > 0) {
      const accRes = await supabaseAdmin.from('accounts').select('id, name').in('id', payableAccountIds)
      for (const acc of (accRes.data ?? []) as any[]) payeeNames[acc.id] = acc.name
    }
    enrichedClosing = {
      ...closingDetail,
      comp_payables: payables.map((p: any) => ({ ...p, payee_name: payeeNames[p.payee_account_id] ?? '—' })),
      deal: (dealsRes.data ?? [])[0] ?? null,
    }
  }

  // Map bids with buyer names
  const bids = ((bidsRes.data ?? []) as any[]).map((b: any) => ({
    id: b.id,
    amount: b.amount ?? b.bid_amount ?? 0,
    buyer: (b.accounts as any)?.name ?? b.buyer_name ?? '—',
    created_at: b.created_at,
    is_phantom: b.is_phantom ?? false,
    buyer_account_id: b.buyer_account_id,
  }))

  const latestValuation = (valuationsRes.data ?? [])[0] ?? null
  const latestProjection = (leProjectionsRes.data ?? [])[0] ?? null

  const caseData = {
    id: data.id,
    stage: (data as any).stage ?? 'intake',
    last_contact_date: (data as any).updated_at,
    alertInfo,
    insured: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: insured.dob,
      dob: insured.dob,
      gender: insured.gender,
      age: calculateAge(insured.dob),
      phone: insured.phone,
      email: insured.email,
      health_status: insured.health_status,
      primary_medical_condition: insured.primary_medical_condition,
      conditions: insured.primary_medical_condition,
      residence_state: insured.residence_state,
    },
    policies: [
      {
        id: data.id,
        face_amount: (data as any).death_benefit ?? 0,
        carrier: (data as any).carrier ?? '',
        policy_type: (data as any).policy_type ?? '',
        premium_annual: (data as any).annual_premium,
        annual_premium: (data as any).annual_premium,
        issue_date: (data as any).issue_date,
        policy_number: (data as any).policy_number,
      },
    ],
    // KPI helpers
    mean_le_months: latestProjection?.central_le_months ?? null,
    est_settlement_value: latestValuation?.npv ?? null,
    est_settlement_pct_face: latestValuation?.pct_face ?? null,
    // Phase 1: Active Case Blindspots
    le_reports: leReportsRes.data ?? [],
    medical_records: medicalRecords,
    physicians,
    hospitals,
    hipaa_authorization: (hipaaRes.data ?? [])[0] ?? null,
    policy_requirements: policyReqRes.data ?? [],
    // Phase 2: Underwriting Intelligence
    valuations: valuationsRes.data ?? [],
    le_projections: leProjectionsRes.data ?? [],
    life_expectancies: lifeExpectanciesRes.data ?? [],
    // Phase 3: Market & Distribution
    distribution_package: enrichedDistPackage,
    // Phase 4: Closing & Comp
    closing_detail: enrichedClosing,
    // Phase 5: Complete Case Profile
    policy_owners: policyOwnersRes.data ?? [],
    beneficiaries: beneficiariesRes.data ?? [],
    entity_events: entityEventsRes.data ?? [],
    // Phase 6
    form_submissions: formSubmissionsRes.data ?? [],
    // Existing
    bids,
    notes: (data as any).notes
      ? [{ id: 'note-1', content: (data as any).notes, is_public: true, created_at: (data as any).updated_at, user_id: 'admin' }]
      : [],
    communication_log: [],
    documents: [],
  }

  return NextResponse.json(caseData)
}
