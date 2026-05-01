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
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}`)
        const data = await res.json()
        setCaseData(data)
      } catch (error) {
        console.error('Error fetching case:', error)
      } finally {
        setLoading(false)
      }
    }

    if (caseId) {
      fetchCase()
    }
  }, [caseId])

  const getAlertColor = (status: string) => {
    switch (status) {
      case 'red':
        return '#DC2626'
      case 'yellow':
        return '#F59E0B'
      case 'green':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  if (loading) {
    return <div className="py-12 text-center">Loading case...</div>
  }

  if (!caseData) {
    return <div className="py-12 text-center">Case not found</div>
  }

  const handleSaveNote = async () => {
    if (!newNote.trim()) return

    setSavingNote(true)
    try {
      const res = await fetch('/api/cases/' + caseId + '/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          is_public: newNotePublic,
        }),
      })

      if (res.ok) {
        setNewNote('')
        setNewNotePublic(false)
        // Refetch case data
        const caseRes = await fetch(`/api/cases/${caseId}`)
        const data = await caseRes.json()
        setCaseData(data)
      }
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSavingNote(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'medical', label: 'Medical' },
    { id: 'communication', label: 'Communication' },
    { id: 'bids', label: 'Bids' },
    { id: 'documents', label: 'Documents' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-semibold mb-2">
          {caseData.insured.first_name} {caseData.insured.last_name}
        </h1>
        <div className="flex items-center gap-4">
          <span
            className="px-3 py-1 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: getAlertColor(caseData.alertInfo.status) }}
          >
            {caseData.alertInfo.status.toUpperCase()}
          </span>
          <span className="text-gray-600 text-sm">{caseData.alertInfo.reason}</span>
          <span className="text-gray-600 text-sm">Stage: {caseData.stage}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Policy Information</h2>
                {caseData.policies.map((policy) => (
                  <div key={policy.id} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-semibold">{policy.carrier}</p>
                    <p className="text-sm text-gray-600">${(policy.face_amount / 1000000).toFixed(1)}M face</p>
                    <p className="text-sm text-gray-600">${policy.premium_annual}/year</p>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* Medical Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Medical History</h2>
                <p className="text-gray-600">Medical information coming soon...</p>
              </section>
            </div>
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Communication Log</h2>
                {caseData.communication_log && caseData.communication_log.length > 0 ? (
                  <div className="space-y-3">
                    {caseData.communication_log.map((entry) => (
                      <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
                        <p className="font-semibold text-sm">{entry.type}</p>
                        <p className="text-sm text-gray-600 mt-1">{entry.outcome}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No communication logged yet</p>
                )}
              </section>
            </div>
          )}

          {/* Bids Tab */}
          {activeTab === 'bids' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Offers Received</h2>
                {caseData.bids && caseData.bids.length > 0 ? (
                  <div className="space-y-3">
                    {caseData.bids
                      .filter((bid) => !bid.is_phantom)
                      .map((bid) => (
                        <div key={bid.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{bid.buyer}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                ${(bid.amount / 1000).toFixed(0)}K
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No offers yet</p>
                )}
              </section>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Documents</h2>
                {caseData.documents && caseData.documents.length > 0 ? (
                  <div className="space-y-3">
                    {caseData.documents.map((doc) => (
                      <div key={doc.id} className="p-4 border border-gray-200 rounded-lg">
                        <p className="font-semibold text-sm">{doc.file_name}</p>
                        <p className="text-xs text-gray-600 mt-1">{doc.document_type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No documents uploaded</p>
                )}
              </section>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Notes</h2>

                {/* Add Note Form */}
                <div className="p-4 border border-gray-200 rounded-lg mb-6 bg-gray-50">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                    rows={3}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newNotePublic}
                        onChange={(e) => setNewNotePublic(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>Make public (visible to Jim)</span>
                    </label>
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote || !newNote.trim()}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>

                {/* Existing Notes */}
                {caseData.notes && caseData.notes.length > 0 ? (
                  <div className="space-y-3">
                    {caseData.notes.map((note) => (
                      <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              note.is_public
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {note.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No notes yet</p>
                )}
              </section>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Stage Timeline</h2>
                <p className="text-gray-600">Timeline coming soon...</p>
              </section>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-1">
          {/* Alert */}
          <div className="p-4 border border-gray-200 rounded-lg mb-6">
            <h3 className="font-semibold text-sm mb-2">Status</h3>
            <div
              className="px-3 py-2 rounded text-white text-sm"
              style={{ backgroundColor: getAlertColor(caseData.alertInfo.status) }}
            >
              {caseData.alertInfo.status.toUpperCase()}
            </div>
            {caseData.alertInfo.reason && (
              <p className="text-xs text-gray-600 mt-2">{caseData.alertInfo.reason}</p>
            )}
          </div>

          {/* Stage */}
          <div className="p-4 border border-gray-200 rounded-lg mb-6">
            <h3 className="font-semibold text-sm mb-2">Current Stage</h3>
            <p className="text-sm capitalize">{caseData.stage}</p>
          </div>

          {/* Activity */}
          <div className="p-4 border border-gray-200 rounded-lg mb-6">
            <h3 className="font-semibold text-sm mb-2">Last Contact</h3>
            {caseData.last_contact_date ? (
              <p className="text-sm">
                {new Date(caseData.last_contact_date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm text-gray-600">No contact recorded</p>
            )}
          </div>

          {/* Insured Info */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Insured Info</h3>
            {caseData.insured.phone && (
              <p className="text-xs text-gray-600">{caseData.insured.phone}</p>
            )}
            {caseData.insured.email && (
              <p className="text-xs text-gray-600">{caseData.insured.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
