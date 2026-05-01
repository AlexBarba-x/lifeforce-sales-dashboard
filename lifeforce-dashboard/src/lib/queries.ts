import { supabase } from './supabase'

/**
 * Alert status types
 */
export type AlertStatus = 'red' | 'yellow' | 'green'

export interface AlertInfo {
  status: AlertStatus
  reason?: string
  daysNoContact?: number
  daysRequirementPending?: number
}

/**
 * Calculate alert status for a case
 * Red: No contact ≥14 days OR open requirement ≥21 days
 * Yellow: No contact 7–13 days OR open requirement 14–20 days
 * Green: Normal timeline, no blockers
 */
export function calculateAlertStatus(
  lastContactDate: string | null,
  requirementPendingDate: string | null
): AlertInfo {
  const now = new Date()
  let status: AlertStatus = 'green'
  let daysNoContact: number | undefined
  let daysRequirementPending: number | undefined
  let reason: string | undefined

  // Check days without contact
  if (lastContactDate) {
    const lastContact = new Date(lastContactDate)
    daysNoContact = Math.floor(
      (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysNoContact >= 14) {
      status = 'red'
      reason = `No contact ${daysNoContact} days`
    } else if (daysNoContact >= 7) {
      status = 'yellow'
      reason = `No contact ${daysNoContact} days`
    }
  }

  // Check days requirement pending (can override to red/yellow)
  if (requirementPendingDate) {
    const requirementPending = new Date(requirementPendingDate)
    daysRequirementPending = Math.floor(
      (now.getTime() - requirementPending.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysRequirementPending >= 21) {
      status = 'red'
      reason = `Requirement pending ${daysRequirementPending} days`
    } else if (daysRequirementPending >= 14 && status !== 'red') {
      status = 'yellow'
      reason = `Requirement pending ${daysRequirementPending} days`
    }
  }

  return {
    status,
    reason,
    daysNoContact,
    daysRequirementPending,
  }
}

/**
 * Get all cases with alert status
 */
export async function getCases(userId?: string) {
  let query = supabase
    .from('cases')
    .select(
      `
      *,
      insured:insured_id(id, first_name, last_name, dob),
      policies:policies(id, carrier, face_amount),
      account:account_id(id, name, type)
    `
    )
    .order('created_at', { ascending: false })

  // Filter by user if provided (for Jim's access)
  if (userId) {
    query = query.eq('assigned_sales_person_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching cases:', error)
    return []
  }

  // Add alert status to each case
  return data.map((c: any) => ({
    ...c,
    alertInfo: calculateAlertStatus(
      c.last_contact_date,
      c.requirement_pending_date
    ),
  }))
}

/**
 * Get single case with all details
 */
export async function getCase(caseId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select(
      `
      *,
      insured:insured_id(id, first_name, last_name, dob, phone, email),
      policies:policies(id, carrier, face_amount, premium_annual, issue_date),
      account:account_id(id, name, type),
      notes(id, user_id, content, is_public, created_at),
      communication_log(id, type, contact_method, outcome, created_at),
      bids(id, amount, buyer, created_at, is_phantom),
      documents(id, file_name, document_type, created_at)
    `
    )
    .eq('id', caseId)
    .single()

  if (error) {
    console.error('Error fetching case:', error)
    return null
  }

  return {
    ...data,
    alertInfo: calculateAlertStatus(
      data.last_contact_date,
      data.requirement_pending_date
    ),
  }
}

/**
 * Get cases grouped by alert status
 */
export async function getCasesByAlertStatus(userId?: string) {
  const cases = await getCases(userId)

  const grouped = {
    red: cases.filter((c: any) => c.alertInfo.status === 'red'),
    yellow: cases.filter((c: any) => c.alertInfo.status === 'yellow'),
    green: cases.filter((c: any) => c.alertInfo.status === 'green'),
  }

  return grouped
}

/**
 * Get cases grouped by stage
 */
export async function getCasesByStage(userId?: string) {
  const cases = await getCases(userId)

  const grouped: { [key: string]: any[] } = {}

  cases.forEach((c: any) => {
    if (!grouped[c.stage]) {
      grouped[c.stage] = []
    }
    grouped[c.stage].push(c)
  })

  return grouped
}

/**
 * Update case last contact date
 */
export async function updateLastContact(caseId: string) {
  const { error } = await supabase
    .from('cases')
    .update({ last_contact_date: new Date().toISOString() })
    .eq('id', caseId)

  if (error) {
    console.error('Error updating last contact:', error)
    return false
  }

  return true
}

/**
 * Add note to case
 */
export async function addNote(
  caseId: string,
  content: string,
  isPublic: boolean = false,
  userId?: string
) {
  const { error } = await supabase.from('notes').insert({
    case_id: caseId,
    user_id: userId,
    content,
    is_public: isPublic,
  })

  if (error) {
    console.error('Error adding note:', error)
    return false
  }

  return true
}

/**
 * Get notes for a case (only public if user is not author)
 */
export async function getCaseNotes(caseId: string, userId?: string) {
  let query = supabase
    .from('notes')
    .select('*')
    .eq('case_id', caseId)

  // If userId provided, only show public notes or notes by this user
  if (userId) {
    query = query.or(`is_public.eq.true,user_id.eq.${userId}`)
  } else {
    // Show all notes for non-authenticated access
    query = query.eq('is_public', true)
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }

  return data
}
