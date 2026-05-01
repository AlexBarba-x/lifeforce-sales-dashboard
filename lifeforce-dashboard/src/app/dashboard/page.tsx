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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('attention')
  const [cases, setCases] = useState<{ red: Case[]; yellow: Case[]; green: Case[] }>({
    red: [],
    yellow: [],
    green: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('/api/cases?groupBy=alertStatus')
        const data = await res.json()
        setCases(data)
      } catch (error) {
        console.error('Error fetching cases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('attention')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'attention'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Attention
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'pipeline'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Pipeline
          </button>
        </div>
      </div>

      {/* Attention Tab */}
      {activeTab === 'attention' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading cases...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-6">See what needs attention</h2>

              {/* Red Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-semibold">🔴 NEEDS ATTENTION NOW — {cases.red.length} Case{cases.red.length !== 1 ? 's' : ''}</span>
                </div>
                {cases.red.length > 0 ? (
                  <div className="space-y-3">
                    {cases.red.map((c) => (
                      <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
                        <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition cursor-pointer flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">
                              {c.insured.first_name} {c.insured.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ${(c.policies[0]?.face_amount / 1000000).toFixed(1)}M face • {c.stage}
                            </p>
                            <p className="text-sm text-red-600 mt-1">⚠ {c.alertInfo.reason}</p>
                          </div>
                          <span className="text-gray-400">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg bg-white text-gray-600">
                    <p>No urgent cases</p>
                  </div>
                )}
              </div>

              {/* Yellow Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-semibold">🟡 PENDING ACTION — {cases.yellow.length} Case{cases.yellow.length !== 1 ? 's' : ''}</span>
                </div>
                {cases.yellow.length > 0 ? (
                  <div className="space-y-3">
                    {cases.yellow.map((c) => (
                      <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
                        <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition cursor-pointer flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">
                              {c.insured.first_name} {c.insured.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ${(c.policies[0]?.face_amount / 1000000).toFixed(1)}M face • {c.stage}
                            </p>
                            <p className="text-sm text-yellow-600 mt-1">⚠ {c.alertInfo.reason}</p>
                          </div>
                          <span className="text-gray-400">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg bg-white text-gray-600">
                    <p>No pending cases</p>
                  </div>
                )}
              </div>

              {/* Green Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-semibold">🟢 ON TRACK — {cases.green.length} Case{cases.green.length !== 1 ? 's' : ''}</span>
                </div>
                {cases.green.length > 0 ? (
                  <div className="space-y-3">
                    {cases.green.map((c) => (
                      <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
                        <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition cursor-pointer flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">
                              {c.insured.first_name} {c.insured.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ${(c.policies[0]?.face_amount / 1000000).toFixed(1)}M face • {c.stage}
                            </p>
                          </div>
                          <span className="text-gray-400">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg bg-white text-gray-600">
                    <p>All cases on track</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Pipeline by Stage</h2>
          <p className="text-gray-600">Pipeline view coming soon...</p>
        </div>
      )}
    </div>
  )
}
