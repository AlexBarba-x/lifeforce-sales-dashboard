'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { COLORS, TYPE } from '@/lib/design'
import { Kbd } from '@/components/ui/Kbd'

const NAV = [
  { label: 'Today',      href: '/dashboard',             shortcut: 'T' },
  { label: 'Pipeline',   href: '/dashboard/pipeline',    shortcut: 'P' },
  { label: 'Cases',      href: '/dashboard/cases',       shortcut: 'A' },
  { label: 'Portfolios', href: '/dashboard/portfolios',  shortcut: 'O' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const isDemoMode =
      process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE === 'true' &&
      new URLSearchParams(window.location.search).get('demo') === '1'

    if (isDemoMode) {
      setUserEmail('demo@lifeforcefinancial.com')
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/')
      } else {
        setUserEmail(data.session.user.email || '')
      }
    })
  }, [router])

  // Keyboard shortcuts: / (focus search) · G T / G P / G A (navigate) · Escape (blur)
  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout> | null = null

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const tag = (active?.tagName || '').toLowerCase()
      const isEditing = tag === 'input' || tag === 'textarea' || active?.isContentEditable

      // Escape — always blur active input
      if (e.key === 'Escape') {
        if (isEditing) active?.blur()
        return
      }

      // / — focus first [data-search-input], only when not already editing
      if (e.key === '/' && !isEditing) {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')
        if (searchInput) {
          e.preventDefault()
          searchInput.focus()
        }
        return
      }

      // G-chord navigation — ignore when editing
      if (isEditing) return

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        gPressed = true
        if (gTimeout) clearTimeout(gTimeout)
        gTimeout = setTimeout(() => { gPressed = false }, 1500)
        return
      }
      if (gPressed) {
        const k = e.key.toLowerCase()
        const target = NAV.find(n => n.shortcut.toLowerCase() === k)
        if (target) {
          e.preventDefault()
          router.push(target.href)
          gPressed = false
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.parchment, display: 'flex', flexDirection: 'column' }}>

      {/* Header — parchment, sticky */}
      <header style={{
        backgroundColor: COLORS.parchment,
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        borderBottom: `1px solid ${COLORS.rule}`,
      }}>
        {/* Wordmark */}
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '24px',
            color: COLORS.brandGreen,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Lifeforce
          </span>
          <span style={{
            ...TYPE.label,
            fontSize: '8px',
            color: COLORS.brandGreen,
            opacity: 0.7,
          }}>
            Financial
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '40px' }}>
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...TYPE.subtitle,
                  textDecoration: 'none',
                  color: active ? COLORS.ink : COLORS.warmGray,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: active ? COLORS.surface : 'transparent',
                  border: `1px solid ${active ? COLORS.rule : 'transparent'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ ...TYPE.micro, color: COLORS.warmGray, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span>Jump:</span>
            <Kbd>G</Kbd>
            <span style={{ color: COLORS.mutedGray }}>then</span>
            <Kbd>T</Kbd>/<Kbd>P</Kbd>/<Kbd>A</Kbd>/<Kbd>O</Kbd>
          </span>
          <span style={{ ...TYPE.body, color: COLORS.ink2, fontSize: '12px' }}>
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              ...TYPE.label,
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: `1px solid ${COLORS.rule}`,
              color: COLORS.warmGray,
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        backgroundColor: COLORS.parchment,
        padding: '24px 32px 60px',
      }}>
        {children}
      </main>
    </div>
  )
}
