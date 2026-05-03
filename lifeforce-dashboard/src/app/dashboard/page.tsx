'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Case {
  id: string
  insured: { first_name: string; last_name: string }
  policies: { face_amount: number }[]
  stage: string
  alertInfo: { status: string; reason?: string }
}

const badgeStyle = (status: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: '2px',
    fontFamily: 'Sohne, sans-serif',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    border: '1px solid',
  }
  if (status === 'red') return { ...base, color: 'var(--status-red)', borderColor: 'var(--status-red)', backgroundColor: 'transparent' }
  if (status === 'yellow') return { ...base, color: 'var(--status-amber)', borderColor: 'var(--status-amber)', backgroundColor: 'transparent' }
  return { ...base, color: 'var(--status-green)', borderColor: 'var(--status-green)', backgroundColor: 'transparent' }
}

const sectionDotStyle = (status: string): React.CSSProperties => ({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: status === 'red' ? 'var(--status-red)' : status === 'yellow' ? 'var(--status-amber)' : 'var(--status-green)',
  display: 'inline-block',
  marginRight: '10px',
  flexShrink: 0,
})

function CaseCard({ c, status }: { c: Case; status: string }) {
  const faceM = c.policies[0]?.face_amount
  const faceLabel = faceM
    ? faceM >= 1000000
      ? `$${(faceM / 1000000).toFixed(1)}M`
      : `$${(faceM / 1000).toFixed(0)}K`
    : '—'

  return (
    <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        backgroundColor: 'var(--lf-surface)',
        border: '1px solid var(--lf-rule)',
        borderRadius: '2px',
        padding: '16px 20px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--lf-ink)',
            marginBottom: '4px',
          }}>
            {c.insured.first_name} {c.insured.last_name}
          </div>
          <div style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '12px',
            color: 'var(--lf-warm-gray)',
            display: 'flex',
            gap: '16px',
          }}>
            <span>{faceLabel} face</span>
            <span>{c.stage}</span>
          </div>
        </div>

        <div style={badgeStyle(status)}>
          {c.alertInfo.reason || 'On schedule'}
        </div>

        <span style={{
          fontFamily: 'Sohne, sans-serif',
          fontSize: '14px',
          color: 'var(--lf-warm-gray)',
        }}>→</span>
      </div>
    </Link>
  )
}

function AlertSection({ title, count, status, cases }: {
  title: string; count: number; status: string; cases: Case[]
}) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '14px',
      }}>
        <span style={sectionDotStyle(status)} />
        <span style={{
          fontFamily: 'Sohne, sans-serif',
          fontWeight: 500,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--lf-warm-gray)',
        }}>
          {title}
        </span>
        <span style={{
          fontFamily: 'Canela, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '15px',
          color: 'var(--lf-warm-gray)',
          marginLeft: '10px',
        }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        {cases.length === 0
          ? (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--lf-surface)',
              border: '1px solid var(--lf-rule)',
              borderRadius: '2px',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--lf-warm-gray)',
            }}>
              None
            </div>
          )
          : cases.map(c => <CaseCard key={c.id} c={c} status={status} />)
        }
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('attention')
  const [cases, setCases] = useState<{ red: Case[]; yellow: Case[]; green: Case[] }>({ red: [], yellow: [], green: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases?groupBy=alertStatus')
      .then(r => r.json())
      .then(d => { setCases(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalCases = cases.red.length + cases.yellow.length + cases.green.length

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '36px',
          color: 'var(--lf-ink)',
          letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          Dashboard
        </h1>
        <p style={{
          fontFamily: 'Sohne, sans-serif',
          fontSize: '13px',
          color: 'var(--lf-warm-gray)',
        }}>
          {totalCases} active case{totalCases !== 1 ? 's' : ''} · {cases.red.length} need{cases.red.length === 1 ? 's' : ''} immediate attention
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--lf-rule)',
        marginBottom: '36px',
      }}>
        {['attention', 'pipeline'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0',
              marginRight: '28px',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--lf-ink)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--lf-ink)' : 'var(--lf-warm-gray)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Attention Tab */}
      {activeTab === 'attention' && (
        loading
          ? (
            <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
              Loading…
            </p>
          )
          : (
            <>
              <AlertSection title="Needs Attention Now" count={cases.red.length} status="red" cases={cases.red} />
              <AlertSection title="Pending Action" count={cases.yellow.length} status="yellow" cases={cases.yellow} />
              <AlertSection title="On Track" count={cases.green.length} status="green" cases={cases.green} />
            </>
          )
      )}

      {activeTab === 'pipeline' && (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
          Pipeline view coming soon.
        </p>
      )}
    </div>
  )
}
