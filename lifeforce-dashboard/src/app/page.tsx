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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data?.session) {
        router.push('/dashboard')
      }
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
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px',
        backgroundColor: 'var(--lf-surface)',
        border: '1px solid var(--lf-rule)',
        borderRadius: '3px',
      }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '26px',
            color: 'var(--lf-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Lifeforce
          </div>
          <div style={{
            width: '32px',
            height: '1px',
            backgroundColor: 'var(--lf-ink)',
            margin: '10px auto',
            opacity: 0.2,
          }} />
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 800,
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: 'var(--lf-warm-gray)',
            textTransform: 'uppercase',
          }}>
            Financial
          </div>
        </div>

        {/* Header */}
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '32px',
          color: 'var(--lf-ink)',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          Welcome back
        </h1>
        <p style={{
          fontFamily: 'Sohne, sans-serif',
          fontWeight: 400,
          fontSize: '13px',
          color: 'var(--lf-warm-gray)',
          textAlign: 'center',
          marginBottom: '36px',
        }}>
          Sign in to access your dashboard
        </p>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--lf-parchment)',
            border: '1px solid var(--status-red)',
            borderRadius: '2px',
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            color: 'var(--status-red)',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--lf-parchment)',
                border: '1px solid var(--lf-rule-mid)',
                borderRadius: '2px',
                fontFamily: 'Sohne, sans-serif',
                fontSize: '14px',
                color: 'var(--lf-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: 'var(--lf-parchment)',
                border: '1px solid var(--lf-rule-mid)',
                borderRadius: '2px',
                fontFamily: 'Sohne, sans-serif',
                fontSize: '14px',
                color: 'var(--lf-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Remember + Forgot */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--lf-warm-gray)',
              cursor: 'pointer',
            }}>
              <input type="checkbox" id="remember" style={{ cursor: 'pointer' }} />
              Remember me
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

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--lf-ink)',
              color: 'var(--lf-parchment)',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
              fontSize: '13px',
              letterSpacing: '0.06em',
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
  )
}
