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
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20 }}>
          <div style={{
            width: 36, height: 36, background: '#1a1a1a', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-inter), sans-serif',
          }}>L</div>
          <span>Lifeforce</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{userEmail}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '8px 16px', background: '#f0f0f0', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: 240, background: 'white', borderRight: '1px solid #e0e0e0',
          padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ padding: '0 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 12, padding: '0 8px' }}>
              Dashboard
            </div>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                fontSize: 14, marginBottom: 6,
                background: isDashboardHome ? '#1a1a1a' : 'transparent',
                color: isDashboardHome ? 'white' : '#1a1a1a',
                fontWeight: isDashboardHome ? 500 : 400,
              }}>
                Attention
              </div>
            </Link>
            <div style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              fontSize: 14, color: '#999',
            }}>
              Pipeline
            </div>
          </div>

          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 12 }}>
              Cases
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
              <div>3 Red</div>
              <div>2 Yellow</div>
              <div>2 Green</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
