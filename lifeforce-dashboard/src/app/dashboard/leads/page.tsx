'use client'

import { useEffect, useMemo, useState } from 'react'
import { COLORS, TYPE, TYPE_SCALE } from '@/lib/design'

interface Lead {
  id: string
  insured_first_name: string | null
  insured_last_name: string | null
  insured_dob: string | null
  insured_gender: string | null
  primary_medical_condition: string | null
  death_benefit: number | null
  policy_type: string | null
  residence_state: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_relationship: string | null
  lead_status: string | null
  disqualify_reason: string | null
  lead_source: string | null
  first_contact_date: string | null
  marketing_brand: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function formatFaceValue(amount: number | null): string {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}m`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`
  return `$${amount}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  new:          { color: '#3060A0', bg: '#E4EAF4' },
  qualified:    { color: '#5B7B6F', bg: '#EBF1EE' },
  disqualified: { color: '#C4452C', bg: '#F4E4E1' },
  converted:    { color: '#FFFFFF', bg: '#5B7B6F' },
}

const STATUS_FILTERS = ['All', 'new', 'qualified', 'disqualified', 'converted']

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: 'Sohne, sans-serif',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#9A9A9A',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then((d: Lead[]) => { setLeads(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter(l => l.lead_status === 'qualified').length,
    disqualified: leads.filter(l => l.lead_status === 'disqualified').length,
    converted: leads.filter(l => l.lead_status === 'converted').length,
  }), [leads])

  const filtered = useMemo(() => {
    let list = leads
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(l => {
        const name = `${l.insured_first_name ?? ''} ${l.insured_last_name ?? ''}`.toLowerCase()
        return name.includes(q)
      })
    }
    if (statusFilter !== 'All') {
      list = list.filter(l => l.lead_status === statusFilter)
    }
    return list
  }, [leads, search, statusFilter])

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
          Leads
        </h1>
        <div style={{ ...SECTION_HEADER, color: '#5B7B6F', marginTop: '6px' }}>
          Intake Pipeline
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
          { label: 'Total Leads',    value: kpis.total },
          { label: 'Qualified',      value: kpis.qualified },
          { label: 'Disqualified',   value: kpis.disqualified },
          { label: 'Converted',      value: kpis.converted },
        ].map((kpi, i) => (
          <div key={kpi.label} style={{
            padding: '16px 24px',
            borderRight: i < 3 ? '1px solid var(--lf-rule, #E5E3DF)' : 'none',
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

      {/* Filter/search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by insured name…"
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
            width: '280px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                fontFamily: 'Sohne, sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1px solid var(--lf-rule, #E5E3DF)',
                cursor: 'pointer',
                backgroundColor: statusFilter === f ? '#2A2A2A' : '#FFFFFF',
                color: statusFilter === f ? '#FFFFFF' : '#7A7A7A',
                transition: 'all 100ms',
              }}
            >
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#7A7A7A' }}>Loading leads…</p>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--lf-rule, #E5E3DF)',
          borderRadius: '4px',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.2fr',
            padding: '12px 16px',
            borderBottom: '1px solid var(--lf-rule, #E5E3DF)',
            backgroundColor: '#FAF8F4',
            gap: '12px',
          }}>
            {['INSURED', 'CONDITION', 'FACE VALUE', 'STATE', 'STATUS', 'LEAD SOURCE', 'FIRST CONTACT'].map(col => (
              <span key={col} style={{ ...SECTION_HEADER }}>{col}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              fontFamily: 'Sohne, sans-serif',
              fontSize: '13px',
              color: '#7A7A7A',
            }}>
              No leads on record.
            </div>
          ) : (
            filtered.map((lead, idx) => {
              const firstName = lead.insured_first_name
              const lastName = lead.insured_last_name
              const insuredName = (firstName || lastName)
                ? `${firstName ?? ''} ${lastName ?? ''}`.trim()
                : '—'
              const status = lead.lead_status ?? 'new'
              const statusStyle = STATUS_STYLES[status] || { color: '#7A7A7A', bg: '#F0EFED' }

              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.2fr',
                    padding: '14px 16px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--lf-rule, #E5E3DF)' : 'none',
                    cursor: 'pointer',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    transition: 'background-color 100ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FAF8F4' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}
                >
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2A2A2A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {insuredName}
                  </span>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: '#7A7A7A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {lead.primary_medical_condition ?? '—'}
                  </span>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2A2A2A',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatFaceValue(lead.death_benefit)}
                  </span>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: '#7A7A7A',
                  }}>
                    {lead.residence_state ?? '—'}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {status}
                  </span>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: '#7A7A7A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {lead.lead_source ?? '—'}
                  </span>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif',
                    fontSize: '13px',
                    color: '#7A7A7A',
                  }}>
                    {formatDate(lead.first_contact_date)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
