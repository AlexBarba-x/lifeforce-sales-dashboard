'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data?.session) router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--lf-parchment)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '0 24px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '36px',
            color: 'var(--lf-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Lifeforce
          </div>
          <div style={{ width: '48px', height: '1px', backgroundColor: 'rgba(26,26,26,0.25)', margin: '10px auto' }} />
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 800,
            fontSize: '9px',
            letterSpacing: '0.18em',
            color: 'var(--lf-warm-gray)',
            textTransform: 'uppercase',
          }}>
            Financial
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--lf-surface)',
          border: '1px solid var(--lf-rule)',
          padding: '40px',
        }}>
          {/* Section label */}
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 600,
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--lf-sage)',
            marginBottom: '20px',
          }}>
            Portfolio Access
          </div>

          <p style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            color: 'var(--lf-warm-gray)',
            marginBottom: '28px',
            lineHeight: 1.5,
          }}>
            Enter your credentials to continue
          </p>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '10px 14px',
              border: '1px solid var(--status-red)',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--status-red)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 600,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--lf-warm-gray)',
                marginBottom: '8px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--lf-parchment)',
                  border: '1px solid var(--lf-rule-mid)',
                  fontFamily: 'Sohne, sans-serif',
                  fontSize: '14px',
                  color: 'var(--lf-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 600,
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--lf-warm-gray)',
                marginBottom: '8px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--lf-parchment)',
                  border: '1px solid var(--lf-rule-mid)',
                  fontFamily: 'Sohne, sans-serif',
                  fontSize: '14px',
                  color: 'var(--lf-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)', cursor: 'pointer' }}>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#forgot" style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: 'var(--lf-sage)', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'var(--lf-ink)',
                color: 'var(--lf-parchment)',
                border: 'none',
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
