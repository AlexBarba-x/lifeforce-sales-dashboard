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
        backgroundColor: 'var(--lf-surface)',
        borderBottom: '1px solid var(--lf-rule)',
        padding: '0 40px',
        height: '56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '18px',
            color: 'var(--lf-ink)',
            letterSpacing: '-0.01em',
          }}>
            Lifeforce
          </span>
          <span style={{
            width: '1px',
            height: '16px',
            backgroundColor: 'var(--lf-rule-mid)',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 800,
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: 'var(--lf-warm-gray)',
            textTransform: 'uppercase',
          }}>
            Financial
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '12px',
            color: 'var(--lf-warm-gray)',
          }}>
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '7px 14px',
              backgroundColor: 'transparent',
              border: '1px solid var(--lf-rule-mid)',
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--lf-warm-gray)',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: '220px',
          backgroundColor: 'var(--lf-surface)',
          borderRight: '1px solid var(--lf-rule)',
          padding: '32px 0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '0 20px', marginBottom: '8px' }}>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--lf-warm-gray)',
              marginBottom: '12px',
              paddingLeft: '12px',
            }}>
              Views
            </div>

            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '9px 12px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: 'Sohne, sans-serif',
                fontSize: '13px',
                marginBottom: '2px',
                backgroundColor: isDashboardHome ? 'var(--lf-ink)' : 'transparent',
                color: isDashboardHome ? 'var(--lf-parchment)' : 'var(--lf-ink)',
                fontWeight: isDashboardHome ? 500 : 400,
              }}>
                Attention
              </div>
            </Link>

            <div style={{
              padding: '9px 12px',
              borderRadius: '2px',
              cursor: 'not-allowed',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--lf-warm-gray)',
            }}>
              Pipeline
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{
          flex: 1,
          padding: '48px 56px',
          overflowY: 'auto',
          backgroundColor: 'var(--lf-parchment)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
