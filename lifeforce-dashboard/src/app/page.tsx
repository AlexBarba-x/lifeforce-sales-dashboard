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
      <div style={{ width: '100%', maxWidth: '360px', padding: '0 24px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '42px',
            color: 'var(--lf-brand-green)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Lifeforce
          </div>
          <div style={{ width: '48px', height: '1px', backgroundColor: 'var(--lf-brand-green)', margin: '8px auto', opacity: 0.5 }} />
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 500,
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: 'var(--lf-brand-green)',
            textTransform: 'uppercase',
          }}>
            Financial
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--lf-surface)',
          padding: '36px 32px',
          borderRadius: '4px',
        }}>
          {/* Section label */}
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 500,
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--lf-sage)',
            marginBottom: '8px',
          }}>
            Portfolio Access
          </div>

          <h1 style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '24px',
            color: 'var(--lf-ink)',
            marginBottom: '28px',
            lineHeight: 1.2,
          }}>
            Sign in to your account
          </h1>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '10px 14px',
              border: '1px solid var(--status-red)',
              borderRadius: '3px',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--status-red)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn}>
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 500,
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#6A6A6A',
                marginBottom: '8px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@lifeforcefinancial.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--lf-white)',
                  border: '1px solid var(--lf-rule-mid)',
                  borderRadius: '3px',
                  fontFamily: 'Sohne, sans-serif',
                  fontSize: '14px',
                  color: 'var(--lf-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password row: label + forgot */}
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 500,
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#6A6A6A',
              }}>
                Password
              </label>
              <a href="#forgot" style={{
                fontFamily: 'Sohne, sans-serif',
                fontSize: '12px',
                color: 'var(--lf-sage)',
                textDecoration: 'none',
              }}>
                Forgot password?
              </a>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--lf-white)',
                  border: '1px solid var(--lf-rule-mid)',
                  borderRadius: '3px',
                  fontFamily: 'Sohne, sans-serif',
                  fontSize: '14px',
                  color: 'var(--lf-ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'var(--lf-ink)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '3px',
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontFamily: 'Sohne, sans-serif',
          fontSize: '12px',
          color: '#7A7A7A',
          lineHeight: 1.6,
        }}>
          Access is restricted to authorized personnel.<br />
          Contact{' '}
          <a href="mailto:admin@lifeforcefinancial.com" style={{ color: 'var(--lf-sage)', textDecoration: 'none' }}>
            admin@lifeforcefinancial.com
          </a>
          {' '}for access.
        </div>

      </div>
    </div>
  )
}
