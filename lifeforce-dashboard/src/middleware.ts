import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Demo mode bypass.
 * When ALLOW_DEMO_MODE=true (dev only) and ?demo=1 is present,
 * dashboard requests are allowed through without server-side auth.
 * The client-side auth gate in layout.tsx performs the matching check.
 *
 * In production, ALLOW_DEMO_MODE must NOT be set.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (
    process.env.ALLOW_DEMO_MODE === 'true' &&
    searchParams.get('demo') === '1' &&
    pathname.startsWith('/dashboard')
  ) {
    // Pass through — client auth gate will skip Supabase check
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
