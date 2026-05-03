'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/')
      } else {
        setUserEmail(data.session.user.email || '')
      }
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isDashboardHome = pathname === '/dashboard'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--lf-parchment)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        backgroundColor: 'var(--lf-parchment)',
        padding: '0 40px',
        height: '70px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* Wordmark */}
        <div>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '28px',
            color: 'var(--lf-brand-green)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Lifeforce
          </div>
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 500,
            fontSize: '8px',
            letterSpacing: '0.22em',
            color: 'var(--lf-brand-green)',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}>
            Financial
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            color: '#3A3A3A',
          }}>
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 18px',
              backgroundColor: 'transparent',
              border: '1px solid #C8C4BC',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#3A3A3A',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab navigation below header */}
      <nav style={{
        padding: '0 40px',
        borderBottom: '1px solid var(--lf-sage)',
        display: 'flex',
        backgroundColor: 'var(--lf-parchment)',
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '12px 0',
            marginRight: '32px',
            borderBottom: `3px solid ${isDashboardHome ? 'var(--lf-sage)' : 'transparent'}`,
            fontFamily: 'Sohne, sans-serif',
            fontWeight: isDashboardHome ? 700 : 500,
            fontSize: '12px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isDashboardHome ? '#2A2A2A' : '#9A9A9A',
            cursor: 'pointer',
          }}>
            Attention
          </div>
        </Link>
        <div style={{
          padding: '12px 0',
          fontFamily: 'Sohne, sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#9A9A9A',
          cursor: 'default',
        }}>
          Pipeline
        </div>
      </nav>

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        backgroundColor: 'var(--lf-parchment)',
      }}>
        {children}
      </main>
    </div>
  )
}
