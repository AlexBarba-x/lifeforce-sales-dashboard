'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Case {
  id: string
  insured: { first_name: string; last_name: string; age?: number; conditions?: string }
  policies: { face_amount: number }[]
  stage: string
  alertInfo: { status: string; reason?: string; days_since_contact?: number }
}

interface GroupedCases {
  red: Case[]
  yellow: Case[]
  green: Case[]
  stats: { total_face: number; active_count: number; bids_pending?: number }
}

const STATUS_COLORS: Record<string, string> = {
  red: '#C45C3E',
  yellow: '#D4A84B',
  green: '#6B8F71',
}

const STAGE_LABELS: Record<string, string> = {
  intake: 'INTAKE',
  underwriting: 'UNDERWRITING',
  market: 'MARKET',
  working: 'WORKING',
  closing: 'CLOSING',
  closed: 'CLOSED',
}

function CaseCard({ c, status }: { c: Case; status: string }) {
  const dotColor = STATUS_COLORS[status] || '#7A7A7A'
  const face = c.policies[0]?.face_amount ?? 0
  const days = c.alertInfo.days_since_contact ?? 0
  const stageLabel = STAGE_LABELS[c.stage?.toLowerCase()] || c.stage?.toUpperCase() || ''

  const meta = [
    c.insured.age ? `Age ${c.insured.age}` : null,
    c.insured.conditions || null,
    c.alertInfo.reason || null,
  ].filter(Boolean).join(' · ')

  return (
    <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        backgroundColor: 'var(--lf-white)',
        border: '1px solid var(--lf-rule)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        marginBottom: '0',
      }}>
        {/* Status dot */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
        }} />

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: '16px',
            color: 'var(--lf-ink)',
            marginBottom: '4px',
          }}>
            {c.insured.first_name} {c.insured.last_name}
          </div>
          {meta && (
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: 'var(--lf-warm-gray)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {meta}
            </div>
          )}
        </div>

        {/* Right: face value + days + stage badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 }}>
          {face > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'Canela, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '20px',
                color: 'var(--lf-ink)',
                lineHeight: 1,
              }}>
                ${face >= 1000000 ? `${(face / 1000000).toFixed(1)}m` : `${(face / 1000).toFixed(0)}k`}
              </div>
              <div style={{
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 500,
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#9A9A9A',
                marginTop: '2px',
              }}>
                Face Value
              </div>
            </div>
          )}
          {days > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Canela, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '28px',
                color: dotColor,
                lineHeight: 1,
              }}>
                {days}
              </div>
              <div style={{
                fontFamily: 'Sohne, sans-serif',
                fontWeight: 500,
                fontSize: '9px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#9A9A9A',
                marginTop: '2px',
              }}>
                Days
              </div>
            </div>
          )}
          {stageLabel && (
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#5A5A5A',
              border: '1px solid #C8C4BC',
              borderRadius: '3px',
              padding: '8px 14px',
              whiteSpace: 'nowrap',
            }}>
              {stageLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function Section({ title, status, cases }: { title: string; status: string; cases: Case[] }) {
  const labelColor = STATUS_COLORS[status] || '#7A7A7A'
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
        <span style={{
          fontFamily: 'Sohne, sans-serif',
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: labelColor,
        }}>
          {title}
        </span>
        <span style={{
          fontFamily: 'Sohne, sans-serif',
          fontSize: '13px',
          color: 'var(--lf-warm-gray)',
        }}>
          {cases.length} case{cases.length !== 1 ? 's' : ''}
        </span>
      </div>
      {cases.length === 0
        ? (
          <div style={{
            padding: '16px 24px',
            backgroundColor: 'var(--lf-white)',
            border: '1px solid var(--lf-rule)',
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            color: 'var(--lf-warm-gray)',
          }}>
            None
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--lf-rule)' }}>
            {cases.map(c => <CaseCard key={c.id} c={c} status={status} />)}
          </div>
        )
      }
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('attention')
  const [data, setData] = useState<GroupedCases>({ red: [], yellow: [], green: [], stats: { total_face: 0, active_count: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases?groupBy=alertStatus')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allCases = data.red.concat(data.yellow, data.green)
  const totalFace = data.stats?.total_face ?? allCases.reduce((s, c) => s + (c.policies[0]?.face_amount ?? 0), 0)
  const totalCases = data.stats?.active_count ?? allCases.length
  const bidsPending = data.stats?.bids_pending ?? 0
  const faceLabel = totalFace >= 1000000
    ? `$${(totalFace / 1000000).toFixed(1)}m`
    : totalFace > 0 ? `$${(totalFace / 1000).toFixed(0)}k` : '—'

  const stats = [
    { value: String(totalCases || '—'), label: 'Active Cases' },
    { value: String(data.red.length || '—'), label: 'Require Action' },
    { value: faceLabel, label: 'Face in Market' },
    { value: String(bidsPending || '—'), label: 'Bids Pending' },
  ]

  return (
    <div>
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        backgroundColor: 'var(--lf-rule)',
        marginBottom: '40px',
      }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--lf-surface)',
            padding: '24px',
          }}>
            <div style={{
              fontFamily: 'Canela, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '56px',
              color: 'var(--lf-ink)',
              lineHeight: 1,
              marginBottom: '8px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 500,
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7A7A',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--lf-sage)',
        marginBottom: '32px',
        paddingLeft: '0',
      }}>
        {['attention', 'pipeline'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 0',
              marginRight: '32px',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab ? 'var(--lf-sage)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--lf-ink)' : '#9A9A9A',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'attention' && (
        loading
          ? <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>Loading…</p>
          : <>
            <Section title="Requires Immediate Action" status="red" cases={data.red} />
            <Section title="Follow-up Due" status="yellow" cases={data.yellow} />
            <Section title="On Track" status="green" cases={data.green} />
          </>
      )}

      {activeTab === 'pipeline' && (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>Pipeline view coming soon.</p>
      )}
    </div>
  )
}
