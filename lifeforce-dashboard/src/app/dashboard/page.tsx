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

const alertBadgeStyle = (status: string): React.CSSProperties => {
  if (status === 'red') return { background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }
  if (status === 'yellow') return { background: '#FEF3C7', color: '#B45309', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }
  return { background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }
}

const dotStyle = (color: string): React.CSSProperties => ({
  width: 10, height: 10, borderRadius: '50%', background: color,
  display: 'inline-block', marginRight: 8, flexShrink: 0,
})

function CaseCard({ c, status }: { c: Case; status: string }) {
  const faceM = c.policies[0]?.face_amount
  const faceLabel = faceM >= 1000000
    ? `$${(faceM / 1000000).toFixed(1)}M`
    : `$${(faceM / 1000).toFixed(0)}K`

  return (
    <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'white', border: '1px solid #e0e0e0', borderRadius: 8,
        padding: 16, cursor: 'pointer', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', gap: 16,
        transition: 'box-shadow 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            {c.insured.first_name} {c.insured.last_name}
          </div>
          <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 16 }}>
            <span>{faceLabel} face</span>
            <span>{c.stage}</span>
          </div>
        </div>
        {c.alertInfo.reason && (
          <div style={alertBadgeStyle(status)}>
            {status === 'red' ? '⚠ ' : status === 'yellow' ? '⚡ ' : '✓ '}{c.alertInfo.reason}
          </div>
        )}
        {!c.alertInfo.reason && (
          <div style={alertBadgeStyle('green')}>✓ On schedule</div>
        )}
        <span style={{ color: '#999', fontSize: 18 }}>→</span>
      </div>
    </Link>
  )
}

function AlertSection({ title, count, dotColor, cases, status }: {
  title: string; count: number; dotColor: string; cases: Case[]; status: string
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: '#666', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <span style={dotStyle(dotColor)} />
        {title} — {count} Case{count !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {cases.length === 0
          ? <div style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid #e0e0e0', color: '#999', fontSize: 14 }}>None</div>
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

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 32, fontWeight: 400, marginBottom: 8 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#666' }}>Your cases at a glance. Focus on what needs attention.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e0e0e0', marginBottom: 32 }}>
        {['attention', 'pipeline'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500, textTransform: 'capitalize',
            borderBottom: `2px solid ${activeTab === tab ? '#1a1a1a' : 'transparent'}`,
            color: activeTab === tab ? '#1a1a1a' : '#999',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Attention Tab */}
      {activeTab === 'attention' && (
        loading
          ? <p style={{ color: '#666', fontSize: 14 }}>Loading cases…</p>
          : <>
            <AlertSection title="Needs Attention Now" count={cases.red.length} dotColor="#DC2626" cases={cases.red} status="red" />
            <AlertSection title="Pending Action" count={cases.yellow.length} dotColor="#F59E0B" cases={cases.yellow} status="yellow" />
            <AlertSection title="On Track" count={cases.green.length} dotColor="#10B981" cases={cases.green} status="green" />
          </>
      )}

      {activeTab === 'pipeline' && (
        <div>
          <p style={{ color: '#666', fontSize: 14 }}>Pipeline view coming soon.</p>
        </div>
      )}
    </div>
  )
}
