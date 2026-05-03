'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface CaseDetail {
  id: string
  insured: { first_name: string; last_name: string; dob: string; phone: string; email: string; age?: number; conditions?: string }
  policies: { id: string; carrier: string; policy_number?: string; face_amount: number; premium_annual: number; issue_date?: string }[]
  stage: string
  alertInfo: { status: string; reason?: string; days_since_contact?: number }
  last_contact_date?: string
  notes?: Array<{ id: string; content: string; is_public: boolean; created_at: string }>
  communication_log?: Array<{ id: string; type: string; outcome: string; created_at: string }>
  bids?: Array<{ id: string; amount: number; buyer: string; created_at: string; is_phantom: boolean }>
  documents?: Array<{ id: string; file_name: string; document_type: string }>
  next_required_action?: string
}

const statusColor = (s: string) => {
  if (s === 'red') return 'var(--status-red)'
  if (s === 'yellow') return 'var(--status-amber)'
  return 'var(--status-green)'
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--lf-surface)',
  border: '1px solid var(--lf-rule)',
  padding: '20px 24px',
  marginBottom: '12px',
}

const fieldLabel: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontSize: '11px',
  color: 'var(--lf-warm-gray)',
  marginBottom: '3px',
}

const fieldValue: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontSize: '14px',
  color: 'var(--lf-ink)',
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
      const res = await fetch('/api/cases/' + caseId + '/notes', {
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

  if (loading) return <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>Loading…</p>
  if (!caseData) return <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>Case not found</p>

  const tabs = ['overview', 'medical', 'communication', 'bids', 'documents', 'notes', 'timeline']

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        fontFamily: 'Sohne, sans-serif',
        fontWeight: 600,
        fontSize: '10px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Link href="/dashboard" style={{ color: 'var(--lf-sage)', textDecoration: 'none' }}>← Dashboard</Link>
        <span style={{ color: 'var(--lf-warm-gray)' }}>/</span>
        <span style={{ color: 'var(--lf-warm-gray)' }}>Case Detail</span>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '42px',
          color: 'var(--lf-ink)',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
        }}>
          {caseData.insured.first_name} {caseData.insured.last_name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: statusColor(caseData.alertInfo.status),
            border: `1px solid ${statusColor(caseData.alertInfo.status)}`,
            padding: '3px 10px',
          }}>
            {caseData.alertInfo.status}
          </span>
          {caseData.alertInfo.reason && (
            <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
              {caseData.alertInfo.reason}
            </span>
          )}
          <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
            {caseData.stage}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lf-rule)', marginBottom: '36px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 0',
              marginRight: '24px',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--lf-ink)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--lf-ink)' : 'var(--lf-warm-gray)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '48px' }}>
        {/* Main */}
        <div>
          {activeTab === 'overview' && (
            <div>
              {caseData.policies.map(policy => (
                <div key={policy.id} style={card}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--lf-ink)', marginBottom: '2px' }}>
                      {policy.carrier}
                    </div>
                    {policy.policy_number && (
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: 'var(--lf-warm-gray)' }}>
                        {policy.policy_number}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div>
                      <div style={fieldLabel}>Face Amount</div>
                      <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '24px', color: 'var(--lf-ink)' }}>
                        ${policy.face_amount >= 1000000 ? `${(policy.face_amount / 1000000).toFixed(1)}M` : `${(policy.face_amount / 1000).toFixed(0)}K`}
                      </div>
                    </div>
                    <div>
                      <div style={fieldLabel}>Annual Premium</div>
                      <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '24px', color: 'var(--lf-ink)' }}>
                        ${policy.premium_annual?.toLocaleString() ?? '—'}
                      </div>
                    </div>
                    {policy.issue_date && (
                      <div>
                        <div style={fieldLabel}>Issue Date</div>
                        <div style={fieldValue}>{new Date(policy.issue_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Insured details */}
              <div style={card}>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '16px' }}>
                  Insured
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={fieldLabel}>Date of Birth</div>
                    <div style={fieldValue}>{caseData.insured.dob ? new Date(caseData.insured.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</div>
                  </div>
                  {caseData.insured.phone && (
                    <div>
                      <div style={fieldLabel}>Phone</div>
                      <div style={fieldValue}>{caseData.insured.phone}</div>
                    </div>
                  )}
                  {caseData.insured.email && (
                    <div>
                      <div style={fieldLabel}>Email</div>
                      <div style={{ ...fieldValue, fontSize: '13px' }}>{caseData.insured.email}</div>
                    </div>
                  )}
                  {caseData.insured.conditions && (
                    <div>
                      <div style={fieldLabel}>Conditions</div>
                      <div style={fieldValue}>{caseData.insured.conditions}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <p style={fieldValue}>Medical information coming soon.</p>
          )}

          {activeTab === 'communication' && (
            <div>
              {caseData.communication_log && caseData.communication_log.length > 0
                ? caseData.communication_log.map(entry => (
                  <div key={entry.id} style={card}>
                    {/* Activity date in green */}
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '6px' }}>
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '3px' }}>{entry.type}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>{entry.outcome}</div>
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
                  <div key={bid.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '14px', color: 'var(--lf-ink)', marginBottom: '4px' }}>{bid.buyer}</div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>
                        {new Date(bid.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '28px', color: 'var(--lf-ink)' }}>
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
                  <div key={doc.id} style={card}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '3px' }}>{doc.file_name}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>{doc.document_type}</div>
                  </div>
                ))
                : <p style={fieldValue}>No documents uploaded.</p>
              }
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div style={{ ...card, marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '12px' }}>
                  Add Note
                </div>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Write a note…"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--lf-parchment)',
                    border: '1px solid var(--lf-rule-mid)',
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: 'var(--lf-ink)',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: 'var(--lf-warm-gray)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newNotePublic} onChange={e => setNewNotePublic(e.target.checked)} />
                    Visible to Jim
                  </label>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !newNote.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--lf-ink)',
                      color: 'var(--lf-parchment)',
                      border: 'none',
                      fontFamily: 'Sohne, sans-serif',
                      fontWeight: 600,
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: !newNote.trim() ? 'not-allowed' : 'pointer',
                      opacity: !newNote.trim() ? 0.5 : 1,
                    }}
                  >
                    {savingNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
              {caseData.notes && caseData.notes.length > 0
                ? caseData.notes.map(note => (
                  <div key={note.id} style={{ ...card, display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-ink)', lineHeight: 1.6, marginBottom: '8px' }}>{note.content}</div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>{new Date(note.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: note.is_public ? 'var(--status-green)' : 'var(--lf-warm-gray)', flexShrink: 0 }}>
                      {note.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                ))
                : <p style={fieldValue}>No notes yet.</p>
              }
            </div>
          )}

          {activeTab === 'timeline' && (
            <p style={fieldValue}>Timeline coming soon.</p>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Dark action panel */}
          <div style={{
            backgroundColor: 'var(--lf-ink)',
            padding: '24px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontWeight: 600,
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(245,242,236,0.5)',
              marginBottom: '10px',
            }}>
              Next Required Action
            </div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '14px',
              color: 'var(--lf-parchment)',
              lineHeight: 1.5,
            }}>
              {caseData.next_required_action || caseData.alertInfo.reason || 'Review case status'}
            </div>
          </div>

          {/* Stage */}
          <div style={card}>
            <div style={fieldLabel}>Current Stage</div>
            <div style={fieldValue}>{caseData.stage}</div>
          </div>

          {/* Status */}
          <div style={card}>
            <div style={fieldLabel}>Alert Status</div>
            <span style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: statusColor(caseData.alertInfo.status),
              border: `1px solid ${statusColor(caseData.alertInfo.status)}`,
              padding: '3px 10px',
              display: 'inline-block',
              marginTop: '6px',
            }}>
              {caseData.alertInfo.status}
            </span>
          </div>

          {/* Last contact */}
          <div style={card}>
            <div style={fieldLabel}>Last Contact</div>
            <div style={fieldValue}>
              {caseData.last_contact_date
                ? new Date(caseData.last_contact_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'None recorded'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
