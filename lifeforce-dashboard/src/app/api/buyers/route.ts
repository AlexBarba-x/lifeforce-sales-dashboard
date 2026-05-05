import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const [accountsRes, contactsRes] = await Promise.all([
    supabaseAdmin
      .from('accounts')
      .select('*')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('contacts')
      .select('*')
      .order('last_name', { ascending: true }),
  ])

  if (accountsRes.error) {
    console.error('Error fetching accounts:', accountsRes.error)
    return NextResponse.json({ error: accountsRes.error.message }, { status: 500 })
  }

  const accounts = (accountsRes.data ?? []) as any[]
  const contacts = (contactsRes.data ?? []) as any[]

  // Attach contacts to their accounts
  const enriched = accounts.map((account: any) => ({
    ...account,
    contacts: contacts.filter((c: any) => c.account_id === account.id),
  }))

  return NextResponse.json(enriched)
}
