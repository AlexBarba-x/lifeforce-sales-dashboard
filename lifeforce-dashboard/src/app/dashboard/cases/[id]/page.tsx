'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface CaseDetail {
  id: string
  insured: {
    first_name: string
    last_name: string
    dob: string
    phone: string
    email: string
  }
  policies: {
    id: string
    carrier: string
    face_amount: number
    premium_annual: number
  }[]
  stage: string
  alertInfo: { status: string; reason?: string }
  last_contact_date?: string
  notes?: Array<{ id: string; content: string; is_public: boolean; created_at: string }>
  communication_log?: Array<{ id: string; type: string; outcome: string; created_at: string }>
  bids?: Array<{ id: string; amount: number; buyer: string; created_at: string; is_phantom: boolean }>
  documents?: Array<{ id: string; file_name: string; document_type: string }>
}

const statusColor = (status: string) => {
  if (status === 'red') return 'var(--status-red)'
  if (status === 'yellow') return 'var(--status-amber)'
  return 'var(--status-green)'
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--lf-surface)',
  border: '1px solid var(--lf-rule)',
  borderRadius: '2px',
  padding: '20px',
  marginBottom: '12px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontWeight: 500,
  fontSize: '9px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--lf-warm-gray)',
  marginBottom: '6px',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontSize: '13px',
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
        const caseRes = await fetch(`/api/cases/${caseId}`)
        setCaseData(await caseRes.json())
      }
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
        Loading…
      </p>
    )
  }

  if (!caseData) {
    return (
      <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)' }}>
        Case not found
      </p>
    )
  }

  const tabs = ['overview', 'medical', 'communication', 'bids', 'documents', 'notes', 'timeline']

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--lf-rule)' }}>
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '34px',
          color: 'var(--lf-ink)',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
        }}>
          {caseData.insured.first_name} {caseData.insured.last_name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: statusColor(caseData.alertInfo.status),
            border: `1px solid ${statusColor(caseData.alertInfo.status)}`,
            padding: '3px 10px',
            borderRadius: '2px',
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

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lf-rule)', marginBottom: '32px' }}>
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
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'capitalize',
              color: activeTab === tab ? 'var(--lf-ink)' : 'var(--lf-warm-gray)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px' }}>
        {/* Main */}
        <div>

          {activeTab === 'overview' && (
            <div>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Policy Information</div>
              {caseData.policies.map(policy => (
                <div key={policy.id} style={card}>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '14px', color: 'var(--lf-ink)', marginBottom: '8px' }}>
                    {policy.carrier}
                  </div>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div style={labelStyle}>Face Amount</div>
                      <div style={{ ...valueStyle, fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '20px' }}>
                        ${policy.face_amount >= 1000000
                          ? `${(policy.face_amount / 1000000).toFixed(1)}M`
                          : `${(policy.face_amount / 1000).toFixed(0)}K`}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Annual Premium</div>
                      <div style={{ ...valueStyle, fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '20px' }}>
                        ${policy.premium_annual?.toLocaleString() ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'medical' && (
            <p style={valueStyle}>Medical information coming soon.</p>
          )}

          {activeTab === 'communication' && (
            <div>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Communication Log</div>
              {caseData.communication_log && caseData.communication_log.length > 0
                ? caseData.communication_log.map(entry => (
                  <div key={entry.id} style={card}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '4px' }}>{entry.type}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-warm-gray)', marginBottom: '6px' }}>{entry.outcome}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>{new Date(entry.created_at).toLocaleDateString()}</div>
                  </div>
                ))
                : <p style={valueStyle}>No communication logged yet.</p>
              }
            </div>
          )}

          {activeTab === 'bids' && (
            <div>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Offers Received</div>
              {caseData.bids && caseData.bids.filter(b => !b.is_phantom).length > 0
                ? caseData.bids.filter(b => !b.is_phantom).map(bid => (
                  <div key={bid.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '4px' }}>{bid.buyer}</div>
                      <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '20px', color: 'var(--lf-ink)' }}>
                        ${(bid.amount / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>
                      {new Date(bid.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
                : <p style={valueStyle}>No offers yet.</p>
              }
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Documents</div>
              {caseData.documents && caseData.documents.length > 0
                ? caseData.documents.map(doc => (
                  <div key={doc.id} style={card}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '4px' }}>{doc.file_name}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>{doc.document_type}</div>
                  </div>
                ))
                : <p style={valueStyle}>No documents uploaded.</p>
              }
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {/* Add Note */}
              <div style={{ ...card, marginBottom: '24px' }}>
                <div style={{ ...labelStyle, marginBottom: '10px' }}>Add Note</div>
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
                    borderRadius: '2px',
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: 'var(--lf-ink)',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      borderRadius: '2px',
                      fontFamily: 'Sohne, sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: savingNote ? 'not-allowed' : 'pointer',
                      opacity: savingNote || !newNote.trim() ? 0.5 : 1,
                    }}
                  >
                    {savingNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {caseData.notes && caseData.notes.length > 0
                ? caseData.notes.map(note => (
                  <div key={note.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: 'var(--lf-ink)', marginBottom: '8px', lineHeight: 1.6 }}>{note.content}</div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-warm-gray)' }}>{new Date(note.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      fontFamily: 'Sohne, sans-serif',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: note.is_public ? 'var(--status-green)' : 'var(--lf-warm-gray)',
                      flexShrink: 0,
                    }}>
                      {note.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                ))
                : <p style={valueStyle}>No notes yet.</p>
              }
            </div>
          )}

          {activeTab === 'timeline' && (
            <p style={valueStyle}>Timeline coming soon.</p>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={card}>
            <div style={labelStyle}>Alert Status</div>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: statusColor(caseData.alertInfo.status),
              border: `1px solid ${statusColor(caseData.alertInfo.status)}`,
              padding: '4px 10px',
              borderRadius: '2px',
              display: 'inline-block',
              marginBottom: caseData.alertInfo.reason ? '8px' : 0,
            }}>
              {caseData.alertInfo.status}
            </div>
            {caseData.alertInfo.reason && (
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: 'var(--lf-warm-gray)' }}>
                {caseData.alertInfo.reason}
              </div>
            )}
          </div>

          <div style={card}>
            <div style={labelStyle}>Stage</div>
            <div style={valueStyle}>{caseData.stage}</div>
          </div>

          <div style={card}>
            <div style={labelStyle}>Last Contact</div>
            <div style={valueStyle}>
              {caseData.last_contact_date
                ? new Date(caseData.last_contact_date).toLocaleDateString()
                : 'None recorded'}
            </div>
          </div>

          <div style={card}>
            <div style={labelStyle}>Insured</div>
            {caseData.insured.phone && (
              <div style={{ ...valueStyle, marginBottom: '4px' }}>{caseData.insured.phone}</div>
            )}
            {caseData.insured.email && (
              <div style={{ ...valueStyle, fontSize: '12px', color: 'var(--lf-warm-gray)' }}>{caseData.insured.email}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
