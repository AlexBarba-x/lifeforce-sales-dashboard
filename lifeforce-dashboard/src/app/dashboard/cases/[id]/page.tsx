'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Alert { id: string; title: string; body: string; kind: 'red' | 'green' }
interface Activity { id: string; date: string; description: string }
interface CaseDetail {
  id: string
  insured: {
    first_name: string; last_name: string; dob: string
    phone: string; email: string; age?: number; conditions?: string
    gender?: string; tobacco?: boolean
  }
  policies: {
    id: string; carrier: string; policy_number?: string; face_amount: number
    premium_annual: number; issue_date?: string; policy_type?: string
  }[]
  stage: string
  alertInfo: { status: string; reason?: string; days_since_contact?: number }
  last_contact_date?: string
  mean_le_months?: number
  est_settlement_value?: number
  days_no_contact?: number
  next_required_action?: string
  active_alerts?: Alert[]
  recent_activity?: Activity[]
  notes?: Array<{ id: string; content: string; is_public: boolean; created_at: string }>
  bids?: Array<{ id: string; amount: number; buyer: string; created_at: string; is_phantom: boolean }>
  documents?: Array<{ id: string; file_name: string; document_type: string }>
}

const STAGE_LABELS: Record<string, string> = {
  intake: 'INTAKE', underwriting: 'UNDERWRITING', market: 'MARKET',
  working: 'WORKING', closing: 'CLOSING', closed: 'CLOSED',
}

const fieldLabel: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A', marginBottom: '3px',
}
const fieldValue: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif', fontSize: '14px', color: '#2A2A2A',
}

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newNotePublic, setNewNotePublic] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then(r => r.json())
        .then(d => { setCaseData(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [caseId])

  const handleSaveNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, is_public: newNotePublic }),
      })
      if (res.ok) {
        setNewNote('')
        setNewNotePublic(false)
        const d = await (await fetch(`/api/cases/${caseId}`)).json()
        setCaseData(d)
      }
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) return (
    <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#7A7A7A', padding: '40px' }}>Loading…</p>
  )
  if (!caseData) return (
    <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#7A7A7A', padding: '40px' }}>Case not found</p>
  )

  const policy = caseData.policies[0]
  const stageLabel = STAGE_LABELS[caseData.stage?.toLowerCase()] || caseData.stage?.toUpperCase() || ''
  const daysNoContact = caseData.days_no_contact ?? caseData.alertInfo.days_since_contact ?? 0

  const tabs = ['overview', 'medical', 'communication', 'bids', 'documents', 'notes', 'timeline']

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
        color: '#9A9A9A',
      }}>
        <Link href="/dashboard" style={{ color: 'var(--lf-sage)', textDecoration: 'none' }}>← Dashboard</Link>
        <span>/</span>
        <span>Case Detail</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        {/* Profile label */}
        <div style={{
          fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--lf-sage)', marginBottom: '8px',
        }}>
          Insured Profile · {stageLabel} Stage
        </div>

        {/* Name + stage badge row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <h1 style={{
            fontFamily: 'Canela, serif', fontWeight: 300, fontStyle: 'italic',
            fontSize: '52px', color: '#2A2A2A', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {caseData.insured.first_name} {caseData.insured.last_name}
          </h1>
          {stageLabel && (
            <div style={{
              fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '11px',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '1px solid #C8C4BC', borderRadius: '3px',
              padding: '10px 18px', color: '#5A5A5A', flexShrink: 0,
            }}>
              {stageLabel}
            </div>
          )}
        </div>

        {/* Metadata bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0',
          borderTop: '1px solid var(--lf-rule)', borderBottom: '1px solid var(--lf-rule)',
        }}>
          {[
            { label: 'Age', value: caseData.insured.age ? String(caseData.insured.age) : '—' },
            { label: 'Face Value', value: policy ? `$${(policy.face_amount / 1000000).toFixed(1)}M` : '—' },
            { label: 'Policy Type', value: policy?.policy_type || '—' },
            { label: 'Carrier', value: policy?.carrier || '—' },
            { label: 'Gender / Tobacco', value: [caseData.insured.gender, caseData.insured.tobacco != null ? (caseData.insured.tobacco ? 'Tobacco' : 'Non-tobacco') : null].filter(Boolean).join(' · ') || '—' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              padding: '12px 20px',
              borderRight: i < arr.length - 1 ? '1px solid var(--lf-rule)' : 'none',
              flex: i === 3 ? 1 : 'none', // carrier gets more space
            }}>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', color: '#9A9A9A', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '14px', color: '#2A2A2A', fontWeight: 400 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lf-rule)', marginBottom: '28px' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 0', marginRight: '24px',
            border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#2A2A2A' : 'transparent'}`,
            background: 'none', cursor: 'pointer',
            fontFamily: 'Sohne, sans-serif', fontWeight: activeTab === tab ? 700 : 400,
            fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: activeTab === tab ? '#2A2A2A' : '#9A9A9A', whiteSpace: 'nowrap',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px' }}>

        {/* Left: main content */}
        <div>
          {activeTab === 'overview' && (
            <>
              {/* KPI row */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1px', backgroundColor: 'var(--lf-rule)',
                marginBottom: '28px',
              }}>
                {[
                  { label: 'Face Value', value: policy ? `$${(policy.face_amount / 1000000).toFixed(1)}m` : '—', inverted: false },
                  { label: 'Days No Contact', value: daysNoContact ? String(daysNoContact) : '—', inverted: true },
                  { label: 'Mean LE', value: caseData.mean_le_months ? `${caseData.mean_le_months} mo` : '—', inverted: false },
                  { label: 'Est. Settlement Value', value: caseData.est_settlement_value ? `$${(caseData.est_settlement_value / 1000).toFixed(0)}K` : '—', inverted: false },
                ].map(kpi => (
                  <div key={kpi.label} style={{
                    backgroundColor: kpi.inverted ? '#2A2A2A' : 'var(--lf-surface)',
                    padding: '20px',
                  }}>
                    <div style={{
                      fontFamily: 'Canela, serif', fontStyle: 'italic', fontWeight: 300,
                      fontSize: '32px', color: kpi.inverted ? '#FFFFFF' : '#2A2A2A',
                      lineHeight: 1, marginBottom: '6px',
                    }}>
                      {kpi.value}
                    </div>
                    <div style={{
                      fontFamily: 'Sohne, sans-serif', fontSize: '9px', fontWeight: 500,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: kpi.inverted ? 'rgba(255,255,255,0.55)' : '#9A9A9A',
                    }}>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy info */}
              {caseData.policies.map(pol => (
                <div key={pol.id} style={{
                  backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)',
                  padding: '24px', marginBottom: '12px',
                }}>
                  <div style={{
                    fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#9A9A9A', marginBottom: '10px',
                  }}>
                    Policy Information
                  </div>
                  <div style={{
                    fontFamily: 'Canela, serif', fontStyle: 'italic', fontWeight: 300,
                    fontSize: '22px', color: '#2A2A2A', marginBottom: '20px',
                  }}>
                    {pol.carrier}{pol.policy_type ? ` ${pol.policy_type}` : ''}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                    {[
                      { label: 'Policy Number', value: pol.policy_number || '—' },
                      { label: 'Issue Date', value: pol.issue_date ? new Date(pol.issue_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                      { label: 'Face Value', value: pol.face_amount ? `$${pol.face_amount.toLocaleString()}` : '—' },
                      { label: 'Premium Structure', value: pol.premium_annual ? `$${pol.premium_annual.toLocaleString()} / year (guaranteed)` : '—' },
                    ].map(row => (
                      <div key={row.label}>
                        <div style={fieldLabel}>{row.label}</div>
                        <div style={fieldValue}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Insured info */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '24px' }}>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '16px' }}>
                  Insured
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                  {[
                    { label: 'Date of Birth', value: caseData.insured.dob ? new Date(caseData.insured.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                    { label: 'Phone', value: caseData.insured.phone || '—' },
                    { label: 'Email', value: caseData.insured.email || '—' },
                    { label: 'Conditions', value: caseData.insured.conditions || '—' },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={fieldLabel}>{row.label}</div>
                      <div style={fieldValue}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'communication' && (
            <div>
              {caseData.notes && caseData.notes.length > 0
                ? caseData.notes.map(entry => (
                  <div key={entry.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '6px' }}>
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', lineHeight: 1.5 }}>{entry.content}</div>
                  </div>
                ))
                : <p style={fieldValue}>No communication logged yet.</p>
              }
            </div>
          )}

          {activeTab === 'bids' && (
            <div>
              {caseData.bids && caseData.bids.filter(b => !b.is_phantom).length > 0
                ? caseData.bids.filter(b => !b.is_phantom).map(bid => (
                  <div key={bid.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2A2A2A', marginBottom: '4px' }}>{bid.buyer}</div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A' }}>{new Date(bid.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '28px', color: '#2A2A2A' }}>
                      ${(bid.amount / 1000).toFixed(0)}K
                    </div>
                  </div>
                ))
                : <p style={fieldValue}>No offers yet.</p>
              }
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              {caseData.documents && caseData.documents.length > 0
                ? caseData.documents.map(doc => (
                  <div key={doc.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 24px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: '#2A2A2A', marginBottom: '3px' }}>{doc.file_name}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#7A7A7A' }}>{doc.document_type}</div>
                  </div>
                ))
                : <p style={fieldValue}>No documents uploaded.</p>
              }
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '24px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '12px' }}>
                  Add Note
                </div>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Write a note…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    backgroundColor: 'var(--lf-parchment)', border: '1px solid var(--lf-rule-mid)',
                    fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newNotePublic} onChange={e => setNewNotePublic(e.target.checked)} />
                    Visible to Jim
                  </label>
                  <button onClick={handleSaveNote} disabled={savingNote || !newNote.trim()} style={{
                    padding: '8px 16px', backgroundColor: '#2A2A2A', color: '#F5F3EF',
                    border: 'none', borderRadius: '3px',
                    fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: !newNote.trim() ? 'not-allowed' : 'pointer', opacity: !newNote.trim() ? 0.5 : 1,
                  }}>
                    {savingNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
              {caseData.notes && caseData.notes.map(note => (
                <div key={note.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', lineHeight: 1.6, marginBottom: '8px' }}>{note.content}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#7A7A7A' }}>{new Date(note.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: note.is_public ? 'var(--lf-sage)' : '#9A9A9A', flexShrink: 0 }}>
                    {note.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'medical' || activeTab === 'timeline') && (
            <p style={fieldValue}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} information coming soon.</p>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Dark action panel */}
          {(caseData.next_required_action || caseData.alertInfo.reason) && (
            <div style={{ backgroundColor: '#000000', padding: '24px', marginBottom: '12px' }}>
              <div style={{
                fontFamily: 'Sohne, sans-serif', fontSize: '9px', fontWeight: 500,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'var(--lf-sage)', marginBottom: '10px',
              }}>
                Next Required Action
              </div>
              <div style={{
                fontFamily: 'Sohne, sans-serif', fontSize: '15px', color: '#FFFFFF', lineHeight: 1.6,
              }}>
                {caseData.next_required_action || caseData.alertInfo.reason}
              </div>
            </div>
          )}

          {/* Active alerts */}
          {caseData.active_alerts && caseData.active_alerts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '8px' }}>
                Active Alerts
              </div>
              {caseData.active_alerts.map(alert => (
                <div key={alert.id} style={{
                  backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)',
                  borderLeft: `3px solid ${alert.kind === 'red' ? '#C45C3E' : '#6B8F71'}`,
                  padding: '16px', marginBottom: '4px',
                }}>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '12px', color: alert.kind === 'red' ? '#D4735C' : '#8B956D', marginBottom: '5px' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#3A3A3A', lineHeight: 1.5 }}>
                    {alert.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent activity */}
          {caseData.recent_activity && caseData.recent_activity.length > 0 && (
            <div>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: '12px' }}>
                Recent Activity
              </div>
              {caseData.recent_activity.map((item, i) => (
                <div key={item.id ?? i} style={{ marginBottom: '14px' }}>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '3px' }}>
                    {item.date}
                  </div>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#3A3A3A', lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: stage + status if no sidebar data */}
          {(!caseData.active_alerts || caseData.active_alerts.length === 0) && (!caseData.recent_activity || caseData.recent_activity.length === 0) && (
            <>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px', marginBottom: '4px' }}>
                <div style={fieldLabel}>Current Stage</div>
                <div style={fieldValue}>{caseData.stage}</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px' }}>
                <div style={fieldLabel}>Last Contact</div>
                <div style={fieldValue}>
                  {caseData.last_contact_date
                    ? new Date(caseData.last_contact_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'None recorded'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
