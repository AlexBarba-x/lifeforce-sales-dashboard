import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('pending_approvals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    // Table may not exist yet — return empty array rather than 500
    console.warn('pending_approvals fetch error:', error.message)
    return NextResponse.json([])
  }

  return NextResponse.json(data ?? [])
}
