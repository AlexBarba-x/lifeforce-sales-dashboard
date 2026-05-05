import { supabase } from './supabase'

/**
 * Alert status types
 */
export type AlertStatus = 'red' | 'yellow' | 'green'

export interface AlertInfo {
  status: AlertStatus
  reason?: string
  daysNoContact?: number
  days_since_contact?: number
}

/**
 * Calculate age from date of birth string
 */
export function calculateAge(dob: string | null | undefined): number | undefined {
  if (!dob) return undefined
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

/**
 * Calculate alert status based on updated_at (proxy for last activity).
 * Red:    updated_at >= 14 days ago
 * Yellow: updated_at 7–13 days ago
 * Green:  updated_at < 7 days ago
 */
export function calculateAlertStatus(updatedAt: string | null | undefined): AlertInfo {
  if (!updatedAt) {
    return { status: 'green', days_since_contact: 0 }
  }

  const now = new Date()
  const updated = new Date(updatedAt)
  const days = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))

  if (days >= 14) {
    return {
      status: 'red',
      reason: `No activity ${days} days`,
      daysNoContact: days,
      days_since_contact: days,
    }
  } else if (days >= 7) {
    return {
      status: 'yellow',
      reason: `No activity ${days} days`,
      daysNoContact: days,
      days_since_contact: days,
    }
  }

  return {
    status: 'green',
    days_since_contact: days,
  }
}

/**
 * Fetch secondary (originated) policies with insured join
 */
export async function getOriginatedPolicies() {
  const { data, error } = await supabase
    .from('policies')
    .select(`
      id, policy_number, carrier, death_benefit, stage, annual_premium,
      policy_type, issue_date, notes, created_at, updated_at,
      insured_id,
      insureds (first_name, last_name, dob, gender, health_status,
                primary_medical_condition, residence_state, is_anonymous, anonymous_alias)
    `)
    .eq('source_type', 'originated')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching originated policies:', error)
    return []
  }

  return data ?? []
}

/**
 * Fetch a single policy by ID with insured join
 */
export async function getPolicyById(policyId: string) {
  const { data, error } = await supabase
    .from('policies')
    .select(`
      id, policy_number, carrier, death_benefit, stage, annual_premium,
      policy_type, issue_date, notes, created_at, updated_at,
      insured_id,
      insureds (first_name, last_name, dob, gender, health_status,
                primary_medical_condition, residence_state, phone, email,
                is_anonymous, anonymous_alias)
    `)
    .eq('id', policyId)
    .single()

  if (error) {
    console.error('Error fetching policy:', error)
    return null
  }

  return data
}

/**
 * Map a raw policy row to the CaseV2-compatible shape the UI expects
 */
export function mapPolicyToCase(policy: any) {
  const insured = policy.insureds ?? {}
  const isAnon = insured.is_anonymous === true

  let firstName = isAnon
    ? (insured.anonymous_alias ?? 'Anonymous')
    : (insured.first_name ?? 'Unknown')
  let lastName = isAnon ? '' : (insured.last_name ?? '')

  return {
    id: policy.id,
    insured: {
      first_name: firstName,
      last_name: lastName,
      age: calculateAge(insured.dob),
      conditions: insured.primary_medical_condition ?? '',
      gender: insured.gender,
      health_status: insured.health_status,
      residence_state: insured.residence_state,
      is_anonymous: isAnon,
      dob: insured.dob,
    },
    policies: [
      {
        face_amount: policy.death_benefit ?? 0,
        carrier: policy.carrier ?? '',
        product_type: policy.policy_type ?? '',
        annual_premium: policy.annual_premium,
        issue_date: policy.issue_date,
      },
    ],
    stage: (policy.stage ?? 'intake') as string,
    alertInfo: calculateAlertStatus(policy.updated_at),
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
    policy_number: policy.policy_number,
    created_at: policy.created_at,
    updated_at: policy.updated_at,
    notes: policy.notes,
  }
}
