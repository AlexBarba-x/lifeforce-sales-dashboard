import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side admin client (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Parse the display name from tape notes.
 * Handles:
 *   "Company Name tape — ..."
 *   "Company Name — ..."
 *   Fallback: tape name itself
 */
function parseDisplayName(notes: string | null, fallback: string): string {
  if (!notes) return fallback
  // Match "Company Name tape —" (with em dash, en dash, or hyphen)
  const tapeMatch = notes.match(/^(.+?)\s+tape\s+[—\-–]/i)
  if (tapeMatch) return tapeMatch[1].trim()
  // Match "Company Name — rest..."
  const dashMatch = notes.match(/^(.+?)\s+[—–]\s+/)
  if (dashMatch) {
    // Further clean: strip trailing parenthetical like " (Danny Swick, CEO)"
    const name = dashMatch[1].replace(/\s*\([^)]*\)\s*$/, '').trim()
    if (name.length > 0) return name
  }
  // Fallback to tape name
  return fallback
}

export async function GET() {
  // 1. Fetch all data tapes
  const { data: tapes, error: tapeError } = await supabaseAdmin
    .from('data_tapes')
    .select('id, name, source_type, account_id, policy_count, tape_date, notes, created_at')
    .order('tape_date', { ascending: false })

  if (tapeError) {
    console.error('Error fetching data tapes:', tapeError)
    return NextResponse.json({ error: tapeError.message }, { status: 500 })
  }

  if (!tapes || tapes.length === 0) {
    return NextResponse.json([])
  }

  // 2. For each tape, fetch its policies with insured join
  const portfolios = await Promise.all(
    (tapes ?? []).map(async (tape) => {
      const { data: policies, error: policyError } = await supabaseAdmin
        .from('policies')
        .select(`
          id, policy_number, carrier, death_benefit, policy_type,
          issue_date, annual_premium, stage, updated_at,
          insureds (
            first_name, last_name, dob, gender, health_status,
            primary_medical_condition, is_anonymous, anonymous_alias
          )
        `)
        .eq('data_tape_id', tape.id)
        .order('death_benefit', { ascending: false })

      if (policyError) {
        console.error(`Error fetching policies for tape ${tape.id}:`, policyError)
      }

      const policyList = policies ?? []
      const totalFace = policyList.reduce((sum: number, p: any) => sum + (p.death_benefit ?? 0), 0)

      const mappedPolicies = policyList.map((p: any) => {
        const insured = p.insureds ?? {}
        const isAnon = insured.is_anonymous === true
        return {
          id: p.id,
          policy_number: p.policy_number,
          carrier: p.carrier,
          death_benefit: p.death_benefit,
          policy_type: p.policy_type,
          issue_date: p.issue_date,
          annual_premium: p.annual_premium,
          stage: p.stage,
          insured: {
            first_name: isAnon ? null : (insured.first_name ?? null),
            last_name: isAnon ? null : (insured.last_name ?? null),
            dob: insured.dob,
            gender: insured.gender,
            health_status: insured.health_status,
            primary_medical_condition: insured.primary_medical_condition,
            is_anonymous: isAnon,
            anonymous_alias: insured.anonymous_alias,
          },
        }
      })

      return {
        id: tape.id,
        name: tape.name,
        display_name: parseDisplayName(tape.notes, tape.name),
        tape_date: tape.tape_date,
        policy_count: tape.policy_count ?? policyList.length,
        total_face: totalFace,
        notes: tape.notes,
        policies: mappedPolicies,
      }
    })
  )

  return NextResponse.json(portfolios)
}
