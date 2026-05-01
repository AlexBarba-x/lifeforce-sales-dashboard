import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params
    const { content, is_public } = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert note
    const { data, error } = await supabase.from('notes').insert({
      case_id: caseId,
      user_id: user.id,
      content,
      is_public,
    })

    if (error) {
      console.error('Error inserting note:', error)
      return NextResponse.json(
        { error: 'Failed to save note' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/cases/[id]/notes:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}
