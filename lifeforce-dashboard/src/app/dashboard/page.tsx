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
  stats: { total_face: number; active_count: number }
}

const statusColors = {
  red: 'var(--status-red)',
  yellow: 'var(--status-amber)',
  green: 'var(--status-green)',
}

function DaysCounter({ days, status }: { days: number; status: string }) {
  const color = statusColors[status as keyof typeof statusColors] || 'var(--lf-warm-gray)'
  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{
        fontFamily: 'Canela, serif',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '28px',
        color,
        lineHeight: 1,
      }}>
        {days}
      </div>
      <div style={{
        fontFamily: 'Sohne, sans-serif',
        fontWeight: 600,
        fontSize: '9px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--lf-warm-gray)',
        marginTop: '2px',
      }}>
        Days
      </div>
    </div>
  )
}

function FaceValue({ amount }: { amount: number }) {
  const label = amount >= 1000000
    ? `$${(amount / 1000000).toFixed(1)}m`
    : `$${(amount / 1000).toFixed(0)}k`
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        fontFamily: 'Canela, serif',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '20px',
        color: 'var(--lf-ink)',
        lineHeight: 1,
      }}>
        {label.replace('m', 'M').replace('k', 'K')}
      </div>
      <div style={{
        fontFamily: 'Sohne, sans-serif',
        fontWeight: 600,
        fontSize: '9px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--lf-warm-gray)',
        marginTop: '2px',
      }}>
        Face Value
      </div>
    </div>
  )
}

function CaseCard({ c, status }: { c: Case; status: string }) {
  const borderColor = statusColors[status as keyof typeof statusColors] || 'var(--lf-rule)'
  const face = c.policies[0]?.face_amount ?? 0
  const days = c.alertInfo.days_since_contact ?? 0
  const meta = [
    c.insured.age ? `Age ${c.insured.age}` : null,
    c.insured.conditions || null,
    c.alertInfo.reason || null,
  ].filter(Boolean).join(' · ')

  return (
    <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        backgroundColor: 'var(--lf-surface)',
        borderTop: '1px solid var(--lf-rule)',
        borderRight: '1px solid var(--lf-rule)',
        borderBottom: '1px solid var(--lf-rule)',
        borderLeft: `3px solid ${borderColor}`,
        padding: '18px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        cursor: 'pointer',
      }}>
        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Canela, serif',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: '17px',
            color: 'var(--lf-ink)',
            marginBottom: '4px',
          }}>
            {c.insured.first_name} {c.insured.last_name}
          </div>
          {meta && (
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '12px',
              color: 'var(--lf-warm-gray)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {meta}
            </div>
          )}
        </div>

        {/* Right: face value + days */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {face > 0 && <FaceValue amount={face} />}
          {days > 0 && <DaysCounter days={days} status={status} />}
        </div>
      </div>
    </Link>
  )
}

function AlertSection({ title, status, cases }: { title: string; status: string; cases: Case[] }) {
  const dotColor = statusColors[status as keyof typeof statusColors] || 'var(--lf-warm-gray)'
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'Sohne, sans-serif',
          fontWeight: 600,
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--lf-sage)',
        }}>
          {title}
        </span>
        <span style={{
          fontFamily: 'Canela, serif',
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'var(--lf-warm-gray)',
        }}>
          {cases.length} case{cases.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {cases.length === 0
          ? (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--lf-surface)',
              border: '1px solid var(--lf-rule)',
              borderLeft: `3px solid ${dotColor}`,
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
  const [data, setData] = useState<GroupedCases>({ red: [], yellow: [], green: [], stats: { total_face: 0, active_count: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases?groupBy=alertStatus')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalFace = data.stats?.total_face ?? data.red.concat(data.yellow, data.green).reduce((s, c) => s + (c.policies[0]?.face_amount ?? 0), 0)
  const totalCases = data.stats?.active_count ?? (data.red.length + data.yellow.length + data.green.length)
  const faceLabel = totalFace >= 1000000 ? `$${(totalFace / 1000000).toFixed(1)}m` : `$${(totalFace / 1000).toFixed(0)}k`

  const tabs = ['attention', 'pipeline']

  return (
    <div>
      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        backgroundColor: 'var(--lf-rule)',
        border: '1px solid var(--lf-rule)',
        marginBottom: '48px',
      }}>
        {[
          { label: 'Face Value', value: faceLabel },
          { label: 'Active Cases', value: String(totalCases) },
          { label: 'Requires Attention', value: String(data.red.length) },
          { label: 'Follow-up Due', value: String(data.yellow.length) },
        ].map(stat => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--lf-surface)',
            padding: '24px 28px',
          }}>
            <div style={{
              fontFamily: 'Canela, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '44px',
              color: 'var(--lf-ink)',
              lineHeight: 1,
              marginBottom: '8px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 600,
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--lf-warm-gray)',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lf-rule)', marginBottom: '36px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 0',
              marginRight: '28px',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--lf-ink)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--lf-ink)' : 'var(--lf-warm-gray)',
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
            <AlertSection title="Requires Immediate Action" status="red" cases={data.red} />
            <AlertSection title="Follow-up Due" status="yellow" cases={data.yellow} />
            <AlertSection title="On Track" status="green" cases={data.green} />
          </>
      )}

      {activeTab === 'pipeline' && (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>Pipeline view coming soon.</p>
      )}
    </div>
  )
}
