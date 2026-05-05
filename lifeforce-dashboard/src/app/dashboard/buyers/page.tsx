'use client'

import { useEffect, useMemo, useState } from 'react'
import { humanize } from '@/lib/design'

interface Contact {
  id: string
  first_name: string | null
  last_name: string | null
  title: string | null
  phone: string | null
  email: string | null
}

interface Buyer {
  id: string
  name: string | null
  account_type: string | null
  phone: string | null
  website: string | null
  licensed_states: string[] | string | null
  notes: string | null
  created_at: string
  contacts: Contact[]
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#9A9A9A',
}

function parseStates(raw: string[] | string | null): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  // might be a comma-separated string
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/buyers')
      .then(r => r.json())
      .then((d: Buyer[]) => { setBuyers(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => ({
    totalBuyers: buyers.length,
    totalContacts: buyers.reduce((s, b) => s + (b.contacts?.length ?? 0), 0),
  }), [buyers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return buyers
    return buyers.filter(b => {
      const nameMatch = (b.name ?? '').toLowerCase().includes(q)
      const states = parseStates(b.licensed_states)
      const stateMatch = states.some(s => s.toLowerCase().includes(q))
      return nameMatch || stateMatch
    })
  }, [buyers, search])

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'Canela, serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '52px',
          letterSpacing: '-0.02em',
          color: '#2A2A2A',
          lineHeight: 1.0,
          margin: 0,
        }}>
          Buyers
        </h1>
        <div style={{ ...SECTION_HEADER, color: '#5B7B6F', marginTop: '6px' }}>
          Buyer Directory
        </div>
      </div>

      {/* KPI bar */}
      <div style={{
        display: 'flex',
        gap: '0px',
        marginBottom: '28px',
        borderTop: '1px solid var(--lf-rule, #E5E3DF)',
        borderBottom: '1px solid var(--lf-rule, #E5E3DF)',
      }}>
        {[
          { label: 'Total Buyers',   value: kpis.totalBuyers },
          { label: 'Total Contacts', value: kpis.totalContacts },
        ].map((kpi, i) => (
          <div key={kpi.label} style={{
            padding: '16px 24px',
            borderRight: i < 1 ? '1px solid var(--lf-rule, #E5E3DF)' : 'none',
            minWidth: '120px',
          }}>
            <div style={{
              fontFamily: 'Sohne, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#2A2A2A',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {kpi.value}
            </div>
            <div style={{ ...SECTION_HEADER, marginTop: '4px' }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by account name or state…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            padding: '8px 12px',
            border: '1px solid var(--lf-rule, #E5E3DF)',
            borderRadius: '4px',
            outline: 'none',
            color: '#2A2A2A',
            backgroundColor: '#FFFFFF',
            width: '320px',
          }}
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#7A7A7A' }}>Loading buyers…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#7A7A7A' }}>No buyers on record.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}>
          {filtered.map(buyer => {
            const states = parseStates(buyer.licensed_states)
            return (
              <div
                key={buyer.id}
                style={{
                  border: '1px solid var(--lf-rule, #E5E3DF)',
                  borderRadius: '4px',
                  padding: '20px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Account name + type */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2A2A2A',
                  }}>
                    {buyer.name ?? '—'}
                  </span>
                  {buyer.account_type && (
                    <span style={{
                      fontFamily: 'Sohne, sans-serif',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#7A7A7A',
                      backgroundColor: '#F0EFED',
                      borderRadius: '9999px',
                      padding: '2px 10px',
                    }}>
                      {humanize(buyer.account_type)}
                    </span>
                  )}
                </div>

                {/* Phone + website */}
                {(buyer.phone || buyer.website) && (
                  <div style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '12px',
                    color: '#9A9A9A',
                    marginBottom: '10px',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    {buyer.phone && <span>{buyer.phone}</span>}
                    {buyer.website && (
                      <a
                        href={buyer.website.startsWith('http') ? buyer.website : `https://${buyer.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#5B7B6F', textDecoration: 'none' }}
                      >
                        {buyer.website}
                      </a>
                    )}
                  </div>
                )}

                {/* Licensed states */}
                {states.length > 0 && (
                  <div style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {states.map(s => (
                      <span
                        key={s}
                        style={{
                          fontFamily: 'Sohne, sans-serif',
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.04em',
                          color: '#5B7B6F',
                          backgroundColor: '#EBF1EE',
                          borderRadius: '3px',
                          padding: '2px 6px',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contacts section */}
                <div style={{
                  borderTop: '1px solid var(--lf-rule, #E5E3DF)',
                  paddingTop: '12px',
                  marginTop: '4px',
                }}>
                  <div style={{ ...SECTION_HEADER, marginBottom: '10px' }}>Contacts</div>
                  {(!buyer.contacts || buyer.contacts.length === 0) ? (
                    <div style={{
                      fontFamily: 'Sohne, sans-serif',
                      fontSize: '12px',
                      color: '#9A9A9A',
                      fontStyle: 'italic',
                    }}>
                      No contacts on file.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {buyer.contacts.map(contact => (
                        <div key={contact.id}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                            <span style={{
                              fontFamily: 'Sohne, sans-serif',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#2A2A2A',
                            }}>
                              {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                            </span>
                            {contact.title && (
                              <span style={{
                                fontFamily: 'Sohne, sans-serif',
                                fontSize: '12px',
                                color: '#9A9A9A',
                              }}>
                                {contact.title}
                              </span>
                            )}
                          </div>
                          {(contact.phone || contact.email) && (
                            <div style={{
                              fontFamily: 'Sohne, sans-serif',
                              fontSize: '12px',
                              color: '#7A7A7A',
                              display: 'flex',
                              gap: '10px',
                              flexWrap: 'wrap',
                            }}>
                              {contact.phone && <span>{contact.phone}</span>}
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  style={{ color: '#5B7B6F', textDecoration: 'none' }}
                                >
                                  {contact.email}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
