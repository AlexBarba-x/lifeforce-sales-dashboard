'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { humanize } from '@/lib/design'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeReport {
  id: string
  vendor: string
  ordered_date: string | null
  received_date: string | null
  mean_le_months: number | null
  valid_until: string | null
  report_url: string | null
}

interface MedicalRecord {
  id: string
  record_type: string
  ordered_date: string | null
  received_date: string | null
  expected_date: string | null
  status: string
  request_method: string | null
  provider_display: string
  notes: string | null
}

interface HipaaAuth {
  signed_date: string | null
  expiry_date: string | null
  storage_url: string | null
}

interface PolicyRequirement {
  id: string
  item_type: string
  description: string
  requested_from: string | null
  status: string
  requested_date: string | null
  received_date: string | null
  document_url: string | null
  notes: string | null
}

interface Valuation {
  id: string
  valuation_date: string
  discount_rate: number
  mortality_multiplier: number
  npv: number
  pct_face: number
  le_months_used: number
  methodology_notes: string | null
}

interface LeProjection {
  id: string
  projection_date: string
  mm: number
  mm_rationale: string | null
  conservative_le_months: number
  central_le_months: number
  aggressive_le_months: number
  conservative_npv: number
  central_npv: number
  aggressive_npv: number
  confidence_tier: number | null
  survival_probabilities: Record<string, number> | null
}

interface LifeExpectancy {
  id: string
  provider: string
  mean_le_months: number
  median_le_months: number | null
  mortality_multiplier: number | null
  methodology: string | null
  report_date: string | null
}

interface DistributionPackage {
  id: string
  status: string
  drive_folder_url: string | null
  sent_at: string | null
  bid_deadline: string | null
  final_outcome: string | null
  phantom_bid_amount: number | null
  notes: string | null
  distribution_recipients: DistributionRecipient[]
  market_updates: MarketUpdate[]
}

interface DistributionRecipient {
  id: string
  account_id: string
  account_name: string
  status: string | null
  sent_at: string | null
}

interface MarketUpdate {
  id: string
  announced_amount: number | null
  is_phantom: boolean
  excluded_buyer_account_id: string | null
  sent_at: string | null
  notes: string | null
}

interface ClosingDetail {
  id: string
  gross_offer_amount: number | null
  gross_comp: number | null
  net_comp: number | null
  closing_subphase: string | null
  comp_release_date: string | null
  comp_payables: CompPayable[]
  deal: Deal | null
}

interface CompPayable {
  id: string
  payee_name: string
  comp_amount: number | null
  payment_date: string | null
}

interface Deal {
  id: string
  escrow_agent: string | null
  closing_date: string | null
  funded_amount: number | null
  carrier_ack_date: string | null
  ownership_transfer_date: string | null
  commission_amount: number | null
  commission_pct: number | null
}

interface PolicyOwner {
  id: string
  owner_type: string | null
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

interface Beneficiary {
  id: string
  name: string
  relationship: string | null
  percentage: number | null
}

interface EntityEvent {
  id: string
  entity_type: string
  event_type: string
  actor: string | null
  old_value: any
  new_value: any
  notes: string | null
  occurred_at: string
}

interface Bid {
  id: string
  amount: number
  buyer: string
  created_at: string
  is_phantom: boolean
}

interface CaseDetail {
  id: string
  insured: {
    first_name: string
    last_name: string
    dob: string
    phone: string
    email: string
    age?: number
    conditions?: string
    gender?: string
    tobacco?: boolean
    health_status?: string
    residence_state?: string
  }
  policies: {
    id: string
    carrier: string
    policy_number?: string
    face_amount: number
    premium_annual: number
    annual_premium: number
    issue_date?: string
    policy_type?: string
  }[]
  stage: string
  alertInfo: { status: string; reason?: string; days_since_contact?: number }
  last_contact_date?: string
  mean_le_months?: number | null
  est_settlement_value?: number | null
  est_settlement_pct_face?: number | null
  notes?: Array<{ id: string; content: string; is_public: boolean; created_at: string }>
  bids?: Bid[]
  documents?: Array<{ id: string; file_name: string; document_type: string }>
  // Phase 1
  le_reports?: LeReport[]
  medical_records?: MedicalRecord[]
  hipaa_authorization?: HipaaAuth | null
  policy_requirements?: PolicyRequirement[]
  // Phase 2
  valuations?: Valuation[]
  le_projections?: LeProjection[]
  life_expectancies?: LifeExpectancy[]
  // Phase 3
  distribution_package?: DistributionPackage | null
  // Phase 4
  closing_detail?: ClosingDetail | null
  // Phase 5
  policy_owners?: PolicyOwner[]
  beneficiaries?: Beneficiary[]
  entity_events?: EntityEvent[]
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  intake: 'Intake', underwriting: 'Underwriting', market: 'Market',
  working: 'Working', closing: 'Closing', closed: 'Closed',
}

const fl: React.CSSProperties = { fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A', marginBottom: '3px' }
const fv: React.CSSProperties = { fontFamily: 'Sohne, sans-serif', fontSize: '14px', color: '#2A2A2A' }

function fmtDate(d: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(0)}`
}

function badge(
  text: string,
  color: string,
  bg: string,
  border = color,
): React.ReactNode {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: '3px',
      color, backgroundColor: bg, border: `1px solid ${border}`,
    }}>
      {text}
    </span>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#9A9A9A', marginBottom: '12px',
    }}>
      {title}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)',
      padding: '20px 24px', marginBottom: '12px', ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LeReportsSection({ reports }: { reports: LeReport[] }) {
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <SectionHeader title="LE Orders" />
        <p style={fv}>No LE orders on record.</p>
      </Card>
    )
  }
  const today = new Date()
  return (
    <Card>
      <SectionHeader title="LE Orders" />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
            {['Vendor', 'Ordered', 'Received', 'Mean LE', 'Valid Until', 'Report'].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 12px 8px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map(r => {
            const pending = !r.received_date
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                <td style={{ ...fv, padding: '10px 12px 10px 0', fontWeight: 500 }}>{r.vendor}</td>
                <td style={{ ...fv, padding: '10px 12px 10px 0', color: '#7A7A7A' }}>{fmtDate(r.ordered_date)}</td>
                <td style={{ padding: '10px 12px 10px 0' }}>
                  {pending
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Sohne, sans-serif', fontSize: '11px', fontWeight: 600, color: '#B07830', backgroundColor: '#F5EAD8', border: '1px solid #D4A017', padding: '2px 8px', borderRadius: '3px' }}>Pending</span>
                    : <span style={{ ...fv, color: '#2A2A2A' }}>{fmtDate(r.received_date)}</span>}
                </td>
                <td style={{ ...fv, padding: '10px 12px 10px 0' }}>{r.mean_le_months != null ? `${r.mean_le_months} mo` : '—'}</td>
                <td style={{ ...fv, padding: '10px 12px 10px 0', color: '#7A7A7A' }}>{fmtDate(r.valid_until)}</td>
                <td style={{ padding: '10px 0' }}>
                  {r.report_url
                    ? <a href={r.report_url} target="_blank" rel="noreferrer" style={{ color: 'var(--lf-sage)', fontSize: '12px', fontFamily: 'Sohne, sans-serif' }}>View PDF</a>
                    : <span style={{ ...fv, color: '#9A9A9A' }}>—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function ApsSection({ records }: { records: MedicalRecord[] }) {
  if (!records || records.length === 0) {
    return (
      <Card>
        <SectionHeader title="APS Records" />
        <p style={fv}>No APS records on file.</p>
      </Card>
    )
  }
  const today = new Date()
  return (
    <Card>
      <SectionHeader title="APS Records" />
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
            {['Provider', 'Type', 'Ordered', 'Expected', 'Received', 'Method', 'Status'].map(h => (
              <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 10px 8px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(r => {
            const overdue = r.expected_date && !r.received_date && new Date(r.expected_date) < today
            const statusColor = r.received_date ? '#2A7A4A' : overdue ? '#C4452C' : '#7A7A7A'
            const statusBg = r.received_date ? '#E8F5EE' : overdue ? '#F4E4E1' : '#F0EDE8'
            const statusLabel = r.received_date ? 'Received' : overdue ? 'Overdue' : (r.status || 'Ordered')
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                <td style={{ ...fv, padding: '10px 10px 10px 0', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.provider_display}</td>
                <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A', textTransform: 'uppercase', fontSize: '10px' }}>{r.record_type}</td>
                <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A' }}>{fmtDate(r.ordered_date)}</td>
                <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A' }}>{fmtDate(r.expected_date)}</td>
                <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A' }}>{r.received_date ? fmtDate(r.received_date) : '—'}</td>
                <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A', textTransform: 'capitalize' }}>{r.request_method || '—'}</td>
                <td style={{ padding: '10px 0' }}>
                  <span style={{
                    fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: '3px',
                    color: statusColor, backgroundColor: statusBg, border: `1px solid ${statusColor}`,
                  }}>{statusLabel}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function InternalProjectionsSection({ projections, lifeExpectancies }: { projections: LeProjection[]; lifeExpectancies: LifeExpectancy[] }) {
  const latest = projections[0]
  if (!latest && lifeExpectancies.length === 0) return null

  const confidenceLabel = (tier: number | null) => {
    if (tier == null) return null
    if (tier >= 3) return { label: 'High Confidence', color: '#2A7A4A', bg: '#E8F5EE' }
    if (tier === 2) return { label: 'Medium Confidence', color: '#B07830', bg: '#F5EAD8' }
    return { label: 'Low Confidence', color: '#9A9A9A', bg: '#F0EDE8' }
  }

  return (
    <>
      {latest && (
        <Card>
          <SectionHeader title="Internal Projections" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: '20px' }}>
            <div>
              <div style={fl}>Mortality Multiplier</div>
              <div style={{ ...fv, fontWeight: 600, fontSize: '18px' }}>{latest.mm}x</div>
              {latest.mm_rationale && <div style={{ ...fv, fontSize: '12px', color: '#7A7A7A', marginTop: '4px' }}>{latest.mm_rationale}</div>}
            </div>
            <div>
              {latest.confidence_tier != null && (() => {
                const conf = confidenceLabel(latest.confidence_tier)
                return conf ? (
                  <div>
                    <div style={fl}>Confidence</div>
                    <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', padding: '3px 10px', borderRadius: '3px', color: conf.color, backgroundColor: conf.bg, border: `1px solid ${conf.color}` }}>{conf.label}</span>
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {/* LE Scenarios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: 'var(--lf-rule)', marginBottom: '16px' }}>
            {[
              { label: 'Conservative LE', months: latest.conservative_le_months, npv: latest.conservative_npv },
              { label: 'Central LE', months: latest.central_le_months, npv: latest.central_npv, highlight: true },
              { label: 'Aggressive LE', months: latest.aggressive_le_months, npv: latest.aggressive_npv },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: s.highlight ? '#2A2A2A' : 'var(--lf-surface)', padding: '16px' }}>
                <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '24px', color: s.highlight ? '#FFFFFF' : '#2A2A2A', lineHeight: 1, marginBottom: '4px' }}>
                  {s.months} <span style={{ fontSize: '14px' }}>mo</span>
                </div>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: s.highlight ? 'rgba(255,255,255,0.7)' : '#9A9A9A', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', fontWeight: 600, color: s.highlight ? '#FFFFFF' : '#5B7B6F' }}>{fmtMoney(s.npv)} NPV</div>
              </div>
            ))}
          </div>
          <div style={{ ...fl, fontSize: '11px' }}>Projection date: {fmtDate(latest.projection_date)}</div>
        </Card>
      )}

      {lifeExpectancies.length > 0 && (
        <Card>
          <SectionHeader title="Historical LE Reports" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
                {['Provider', 'Mean LE', 'Median LE', 'MM', 'Methodology', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 10px 8px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lifeExpectancies.map(le => (
                <tr key={le.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', fontWeight: 500 }}>{le.provider}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0' }}>{le.mean_le_months ? `${le.mean_le_months} mo` : '—'}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A' }}>{le.median_le_months ? `${le.median_le_months} mo` : '—'}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0' }}>{le.mortality_multiplier ? `${le.mortality_multiplier}x` : '—'}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A', textTransform: 'capitalize' }}>{le.methodology || '—'}</td>
                  <td style={{ ...fv, padding: '10px 0', color: '#7A7A7A' }}>{fmtDate(le.report_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

function RequirementsSection({ requirements }: { requirements: PolicyRequirement[] }) {
  if (!requirements || requirements.length === 0) return null
  const today = new Date()

  // Group by item_type
  const grouped: Record<string, PolicyRequirement[]> = {}
  for (const r of requirements) {
    const cat = r.item_type || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(r)
  }

  return (
    <Card>
      <SectionHeader title="Requirements Checklist" />
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7A7A', marginBottom: '8px' }}>{humanize(cat)}</div>
          {items.map(item => {
            const isReceived = item.status === 'received' || !!item.received_date
            const isStale = !isReceived && item.requested_date
              && (new Date().getTime() - new Date(item.requested_date).getTime()) > 7 * 86400000
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F8F5F0' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0, marginTop: '1px',
                  border: `1.5px solid ${isReceived ? '#5B7B6F' : '#C8C4BC'}`,
                  backgroundColor: isReceived ? '#5B7B6F' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isReceived && <span style={{ color: '#FFFFFF', fontSize: '9px', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A' }}>{item.description}</span>
                    {isStale && !isReceived && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D4A017', flexShrink: 0 }} title="Requested over 7 days ago" />
                    )}
                    {item.document_url && (
                      <a href={item.document_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: 'var(--lf-sage)' }}>View</a>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#9A9A9A', marginTop: '2px' }}>
                    {item.requested_from && `From: ${item.requested_from}`}
                    {item.requested_date && ` · Req: ${fmtDate(item.requested_date)}`}
                    {item.received_date ? ` · Rec: ${fmtDate(item.received_date)}` : !isReceived ? ' · Pending' : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </Card>
  )
}

function OwnersAndBeneficiaries({ owners, beneficiaries }: { owners: PolicyOwner[]; beneficiaries: Beneficiary[] }) {
  if (owners.length === 0 && beneficiaries.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      <Card style={{ marginBottom: 0 }}>
        <SectionHeader title="Policy Owner" />
        {owners.length === 0
          ? <p style={fv}>No owner on record.</p>
          : owners.map(o => (
            <div key={o.id} style={{ marginBottom: '12px' }}>
              {o.owner_type && <div style={{ marginBottom: '6px' }}>{badge(o.owner_type, '#5B7B6F', '#E8F2EE')}</div>}
              <div style={{ ...fv, fontWeight: 600, marginBottom: '4px' }}>{o.name}</div>
              {o.phone && <div style={{ ...fv, color: '#7A7A7A', fontSize: '12px' }}>{o.phone}</div>}
              {o.email && <div style={{ ...fv, color: '#7A7A7A', fontSize: '12px' }}>{o.email}</div>}
              {o.address && <div style={{ ...fv, color: '#7A7A7A', fontSize: '12px' }}>{o.address}</div>}
            </div>
          ))}
      </Card>
      <Card style={{ marginBottom: 0 }}>
        <SectionHeader title="Beneficiaries" />
        {beneficiaries.length === 0
          ? <p style={fv}>No beneficiaries on record.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
                  {['Name', 'Relationship', '%'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 8px 6px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ ...fv, padding: '8px 8px 8px 0' }}>{b.name}</td>
                    <td style={{ ...fv, padding: '8px 8px 8px 0', color: '#7A7A7A', textTransform: 'capitalize' }}>{b.relationship || '—'}</td>
                    <td style={{ ...fv, padding: '8px 0', fontWeight: 600 }}>{b.percentage != null ? `${b.percentage}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>
    </div>
  )
}

function TimelineTab({ events }: { events: EntityEvent[] }) {
  const [filter, setFilter] = useState<string>('all')
  const filters = ['All', 'Stage Changes', 'Bids', 'Documents', 'Notes']

  const filtered = events.filter(e => {
    if (filter === 'all') return true
    if (filter === 'stage changes') return e.event_type.toLowerCase().includes('stage')
    if (filter === 'bids') return e.event_type.toLowerCase().includes('bid')
    if (filter === 'documents') return e.event_type.toLowerCase().includes('doc')
    if (filter === 'notes') return e.event_type.toLowerCase().includes('note')
    return true
  })

  const eventTypeColor = (type: string) => {
    if (type.includes('stage')) return { color: '#5B7B6F', bg: '#E8F2EE' }
    if (type.includes('bid')) return { color: '#B07830', bg: '#F5EAD8' }
    if (type.includes('doc')) return { color: '#7A7AAA', bg: '#EEEEF5' }
    return { color: '#7A7A7A', bg: '#F0EDE8' }
  }

  if (events.length === 0) {
    return <p style={fv}>No timeline events recorded yet.</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f.toLowerCase())} style={{
            fontFamily: 'Sohne, sans-serif', fontSize: '11px', fontWeight: 500,
            padding: '5px 12px', borderRadius: '3px', border: '1px solid var(--lf-rule)',
            backgroundColor: filter === f.toLowerCase() ? '#2A2A2A' : '#FFFFFF',
            color: filter === f.toLowerCase() ? '#FFFFFF' : '#7A7A7A',
            cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.map(ev => {
          const tc = eventTypeColor(ev.event_type)
          const newVal = ev.new_value && typeof ev.new_value === 'object' ? JSON.stringify(ev.new_value) : String(ev.new_value ?? '')
          const oldVal = ev.old_value && typeof ev.old_value === 'object' ? JSON.stringify(ev.old_value) : String(ev.old_value ?? '')
          return (
            <div key={ev.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '14px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '3px', color: tc.color, backgroundColor: tc.bg, border: `1px solid ${tc.color}` }}>
                  {ev.event_type.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', lineHeight: 1.4 }}>
                  {ev.old_value != null && ev.new_value != null && `${oldVal} → ${newVal}`}
                  {ev.notes && <span style={{ color: '#7A7A7A', fontSize: '12px' }}> {ev.notes}</span>}
                </div>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#9A9A9A', marginTop: '3px' }}>
                  {fmtDate(ev.occurred_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {ev.actor && ` · ${ev.actor}`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MarketTab({ pkg }: { pkg: DistributionPackage | null | undefined }) {
  if (!pkg) return <p style={fv}>No distribution package on record.</p>
  const statusColor = pkg.status === 'sent' ? { color: '#B07830', bg: '#F5EAD8' }
    : pkg.status === 'closed' ? { color: '#5B7B6F', bg: '#E8F2EE' }
    : { color: '#9A9A9A', bg: '#F0EDE8' }

  return (
    <div>
      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '3px', color: statusColor.color, backgroundColor: statusColor.bg, border: `1px solid ${statusColor.color}` }}>{pkg.status}</span>
          {pkg.drive_folder_url && <a href={pkg.drive_folder_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: 'var(--lf-sage)' }}>Open Drive Folder ↗</a>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Sent', value: fmtDate(pkg.sent_at) },
            { label: 'Bid Deadline', value: fmtDate(pkg.bid_deadline) },
            { label: 'Final Outcome', value: pkg.final_outcome || '—' },
          ].map(r => (
            <div key={r.label}>
              <div style={fl}>{r.label}</div>
              <div style={fv}>{r.value}</div>
            </div>
          ))}
        </div>
        {pkg.notes && <div style={{ ...fv, fontSize: '12px', color: '#7A7A7A', marginTop: '12px', borderTop: '1px solid var(--lf-rule)', paddingTop: '10px' }}>{pkg.notes}</div>}
      </Card>

      {/* Recipients */}
      {pkg.distribution_recipients && pkg.distribution_recipients.length > 0 && (
        <Card>
          <SectionHeader title="Recipients" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
                {['Buyer', 'Sent', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 10px 8px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pkg.distribution_recipients.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', fontWeight: 500 }}>{r.account_name}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', color: '#7A7A7A' }}>{fmtDate(r.sent_at)}</td>
                  <td style={{ ...fv, padding: '10px 0', color: '#7A7A7A', textTransform: 'capitalize' }}>{r.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Phantom Bids */}
      {pkg.market_updates && pkg.market_updates.length > 0 && (
        <Card>
          <SectionHeader title="Market Updates" />
          {pkg.market_updates.map(mu => (
            <div key={mu.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #F8F5F0' }}>
              {mu.is_phantom && <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', fontWeight: 600, color: '#7A7A9A', backgroundColor: '#EBEBF5', border: '1px solid #7A7A9A', padding: '2px 8px', borderRadius: '3px' }}>🎭 Phantom</span>}
              <span style={{ ...fv, fontWeight: 600 }}>{fmtMoney(mu.announced_amount)}</span>
              <span style={{ ...fv, color: '#9A9A9A', fontSize: '12px' }}>{fmtDate(mu.sent_at)}</span>
              {mu.notes && <span style={{ ...fv, color: '#7A7A7A', fontSize: '12px' }}>{mu.notes}</span>}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function ClosingTab({ closing }: { closing: ClosingDetail | null | undefined }) {
  if (!closing) return <p style={fv}>No closing details on record.</p>

  const SUBPHASES = ['Escrow Opened', 'Carrier Filed', 'Funded', 'Commission Released']
  const deal = closing.deal

  const currentSubphaseIndex = deal?.funded_amount != null
    ? (closing.comp_release_date ? 3 : 2)
    : deal?.carrier_ack_date != null ? 1
    : deal?.escrow_agent ? 0
    : -1

  return (
    <div>
      {/* Progress bar */}
      <Card>
        <SectionHeader title="Closing Progress" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px' }}>
          {SUBPHASES.map((phase, i) => {
            const done = i <= currentSubphaseIndex
            const active = i === currentSubphaseIndex
            return (
              <div key={phase} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div style={{ height: '2px', flex: 1, backgroundColor: done ? '#5B7B6F' : '#E0DDD8' }} />}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: done ? '#5B7B6F' : '#F0EDE8',
                    border: `2px solid ${done ? '#5B7B6F' : '#C8C4BC'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Sohne, sans-serif', fontSize: '11px', fontWeight: 700,
                    color: done ? '#FFFFFF' : '#9A9A9A',
                  }}>{done ? '✓' : i + 1}</div>
                  {i < SUBPHASES.length - 1 && <div style={{ height: '2px', flex: 1, backgroundColor: i < currentSubphaseIndex ? '#5B7B6F' : '#E0DDD8' }} />}
                </div>
                <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', color: done ? '#5B7B6F' : '#9A9A9A', marginTop: '6px', fontWeight: active ? 600 : 400 }}>{phase}</div>
              </div>
            )
          })}
        </div>

        {/* Financial Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Gross Offer', value: fmtMoney(closing.gross_offer_amount) },
            { label: 'Net Comp', value: fmtMoney(closing.net_comp) },
            { label: 'Est. Release', value: fmtDate(closing.comp_release_date) },
          ].map(r => (
            <div key={r.label}>
              <div style={fl}>{r.label}</div>
              <div style={{ ...fv, fontWeight: 600, fontSize: '16px' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Deal record */}
      {deal && (
        <Card>
          <SectionHeader title="Deal Record" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Escrow Agent', value: deal.escrow_agent || '—' },
              { label: 'Closing Date', value: fmtDate(deal.closing_date) },
              { label: 'Funded Amount', value: fmtMoney(deal.funded_amount) },
              { label: 'Carrier Ack Date', value: fmtDate(deal.carrier_ack_date) },
              { label: 'Ownership Transfer', value: fmtDate(deal.ownership_transfer_date) },
              { label: 'Commission', value: deal.commission_amount ? `${fmtMoney(deal.commission_amount)}${deal.commission_pct ? ` (${deal.commission_pct}%)` : ''}` : '—' },
            ].map(r => (
              <div key={r.label}>
                <div style={fl}>{r.label}</div>
                <div style={fv}>{r.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comp Payables */}
      {closing.comp_payables && closing.comp_payables.length > 0 && (
        <Card>
          <SectionHeader title="Comp Payables" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sohne, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lf-rule)' }}>
                {['Payee', 'Amount', 'Payment Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: '#9A9A9A', fontWeight: 500, padding: '0 10px 8px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closing.comp_payables.map(cp => (
                <tr key={cp.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', fontWeight: 500 }}>{cp.payee_name}</td>
                  <td style={{ ...fv, padding: '10px 10px 10px 0', fontWeight: 600 }}>{fmtMoney(cp.comp_amount)}</td>
                  <td style={{ ...fv, padding: '10px 0', color: '#7A7A7A' }}>{fmtDate(cp.payment_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newNotePublic, setNewNotePublic] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [valuationExpanded, setValuationExpanded] = useState(false)

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
  const daysNoContact = caseData.alertInfo.days_since_contact ?? 0

  // Build tabs: include Market if distribution_package exists, Closing only if closing/closed
  const baseTabs = ['overview', 'medical', 'communication', 'bids']
  if (caseData.distribution_package) baseTabs.push('market')
  baseTabs.push('documents')
  if (['closing', 'closed'].includes(caseData.stage?.toLowerCase())) baseTabs.push('closing')
  baseTabs.push('notes', 'timeline')

  // HIPAA status
  const hipaa = caseData.hipaa_authorization
  const hipaaExpired = hipaa?.expiry_date ? new Date(hipaa.expiry_date) < new Date() : false
  const hipaaStatus = !hipaa ? { label: 'Missing', color: '#C4452C', bg: '#F4E4E1' }
    : hipaaExpired ? { label: 'Expired', color: '#C4452C', bg: '#F4E4E1' }
    : { label: 'Valid', color: '#2A7A4A', bg: '#E8F5EE' }

  // Latest valuation
  const latestVal = caseData.valuations?.[0] ?? null
  const hasPendingLe = (caseData.le_reports ?? []).some(r => !r.received_date)

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
        color: '#9A9A9A',
      }}>
        <Link href="/dashboard/cases" style={{ color: 'var(--lf-sage)', textDecoration: 'none' }}>← All Cases</Link>
        <span>/</span>
        <Link href="/dashboard/pipeline" style={{ color: 'var(--lf-sage)', textDecoration: 'none' }}>Pipeline</Link>
        <span>/</span>
        <span>{caseData.insured.last_name}, {caseData.insured.first_name}</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lf-sage)' }}>
            Insured Profile · {stageLabel} Stage
          </span>
          {hasPendingLe && (
            <span style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#F5EAD8', color: '#B07830', border: '1px solid #D4A017', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              LE PENDING
            </span>
          )}
          {caseData.alertInfo?.status === 'red' && (
            <span style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '11px', padding: '3px 10px', borderRadius: '3px', backgroundColor: '#F4E4E1', color: '#B83232', border: '1px solid #B83232', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#B83232' }} />
              {caseData.alertInfo.reason || 'Critical'}
            </span>
          )}
          {caseData.alertInfo?.status === 'yellow' && (
            <span style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '11px', padding: '3px 10px', borderRadius: '3px', backgroundColor: '#F5EAD8', color: '#B07830', border: '1px solid #B07830', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#B07830' }} />
              {caseData.alertInfo.reason || 'Attention'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'Canela, serif', fontWeight: 300, fontStyle: 'italic', fontSize: '52px', color: '#2A2A2A', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {caseData.insured.first_name} {caseData.insured.last_name}
          </h1>
          {stageLabel && (
            <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid #C8C4BC', borderRadius: '3px', padding: '10px 18px', color: '#5A5A5A', flexShrink: 0 }}>
              {stageLabel}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0', borderTop: '1px solid var(--lf-rule)', borderBottom: '1px solid var(--lf-rule)' }}>
          {[
            { label: 'Age', value: caseData.insured.age ? String(caseData.insured.age) : '—' },
            { label: 'Face Value', value: policy ? `$${(policy.face_amount / 1000000).toFixed(1)}M` : '—' },
            { label: 'Policy Type', value: humanize(policy?.policy_type) },
            { label: 'Carrier', value: policy?.carrier || '—' },
            { label: 'Gender / State', value: [humanize(caseData.insured.gender), caseData.insured.residence_state].filter(s => s && s !== '—').join(' · ') || '—' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ padding: '12px 20px', borderRight: i < arr.length - 1 ? '1px solid var(--lf-rule)' : 'none', flex: i === 3 ? 1 : 'none' }}>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', color: '#9A9A9A', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '14px', color: '#2A2A2A', fontWeight: 400 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lf-rule)', marginBottom: '28px' }}>
        {baseTabs.map(tab => (
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
        <div>

          {/* ─── OVERVIEW TAB ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI row: 5 cards (HIPAA added as 5th) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', backgroundColor: 'var(--lf-rule)', marginBottom: '28px' }}>
                {[
                  { label: 'Face Value', value: policy ? `$${(policy.face_amount / 1000000).toFixed(1)}m` : '—', inverted: false },
                  { label: 'Days No Contact', value: daysNoContact ? String(daysNoContact) : '—', inverted: true },
                  { label: 'Mean LE', value: caseData.mean_le_months ? `${Math.round(caseData.mean_le_months)} mo` : '—', inverted: false },
                  {
                    label: 'Est. Settlement Value',
                    value: latestVal ? fmtMoney(latestVal.npv) : '—',
                    sub: latestVal ? `${latestVal.pct_face?.toFixed(1)}% of face` : undefined,
                    inverted: false,
                    clickable: !!latestVal,
                  },
                  {
                    label: 'HIPAA Auth',
                    value: hipaaStatus.label,
                    sub: hipaa?.expiry_date ? `Exp: ${fmtDate(hipaa.expiry_date)}` : undefined,
                    color: hipaaStatus.color,
                    inverted: false,
                  },
                ].map((kpi: any) => (
                  <div
                    key={kpi.label}
                    onClick={kpi.clickable ? () => setValuationExpanded(!valuationExpanded) : undefined}
                    style={{
                      backgroundColor: kpi.inverted ? '#2A2A2A' : 'var(--lf-surface)',
                      padding: '20px',
                      cursor: kpi.clickable ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      fontFamily: 'Canela, serif', fontStyle: 'italic', fontWeight: 300,
                      fontSize: '26px', color: kpi.color ?? (kpi.inverted ? '#FFFFFF' : '#2A2A2A'),
                      lineHeight: 1, marginBottom: '4px',
                    }}>
                      {kpi.value}
                    </div>
                    {kpi.sub && <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', color: kpi.inverted ? 'rgba(255,255,255,0.5)' : '#9A9A9A', marginBottom: '4px' }}>{kpi.sub}</div>}
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: kpi.inverted ? 'rgba(255,255,255,0.55)' : '#9A9A9A' }}>
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Valuation detail drawer */}
              {valuationExpanded && latestVal && (
                <Card style={{ marginBottom: '20px', borderLeft: '3px solid #5B7B6F' }}>
                  <SectionHeader title={`Valuation — ${fmtDate(latestVal.valuation_date)}`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    {[
                      { label: 'NPV', value: fmtMoney(latestVal.npv) },
                      { label: '% of Face', value: `${latestVal.pct_face?.toFixed(2)}%` },
                      { label: 'LE Used', value: `${latestVal.le_months_used} mo` },
                      { label: 'Discount Rate', value: `${(latestVal.discount_rate * 100).toFixed(1)}%` },
                      { label: 'Mortality Mult.', value: `${latestVal.mortality_multiplier}x` },
                    ].map(r => (
                      <div key={r.label}>
                        <div style={fl}>{r.label}</div>
                        <div style={{ ...fv, fontWeight: 600 }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                  {latestVal.methodology_notes && <div style={{ ...fv, fontSize: '12px', color: '#7A7A7A', borderTop: '1px solid var(--lf-rule)', paddingTop: '10px' }}>{latestVal.methodology_notes}</div>}
                </Card>
              )}

              {/* Policy info */}
              {caseData.policies.map(pol => (
                <Card key={pol.id}>
                  <SectionHeader title="Policy Information" />
                  <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontWeight: 300, fontSize: '22px', color: '#2A2A2A', marginBottom: '20px' }}>
                    {pol.carrier}{pol.policy_type ? ` ${humanize(pol.policy_type)}` : ''}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                    {[
                      { label: 'Policy Number', value: pol.policy_number || '—' },
                      { label: 'Issue Date', value: pol.issue_date ? fmtDate(pol.issue_date, { month: 'long', year: 'numeric' }) : '—' },
                      { label: 'Face Value', value: pol.face_amount ? `$${pol.face_amount.toLocaleString()}` : '—' },
                      { label: 'Annual Premium', value: pol.annual_premium ? `$${pol.annual_premium.toLocaleString()}` : '—' },
                    ].map(r => (
                      <div key={r.label}>
                        <div style={fl}>{r.label}</div>
                        <div style={fv}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Requirements Checklist */}
              {(caseData.policy_requirements ?? []).length > 0 && (
                <RequirementsSection requirements={caseData.policy_requirements!} />
              )}

              {/* Policy Owner + Beneficiaries */}
              <OwnersAndBeneficiaries owners={caseData.policy_owners ?? []} beneficiaries={caseData.beneficiaries ?? []} />

              {/* Insured info */}
              <Card>
                <SectionHeader title="Insured" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                  {[
                    { label: 'Date of Birth', value: caseData.insured.dob ? fmtDate(caseData.insured.dob, { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                    { label: 'Health Status', value: humanize(caseData.insured.health_status) },
                    { label: 'Phone', value: caseData.insured.phone || '—' },
                    { label: 'Email', value: caseData.insured.email || '—' },
                    { label: 'State', value: caseData.insured.residence_state || '—' },
                    { label: 'Primary Condition', value: caseData.insured.conditions || '—' },
                  ].map(r => (
                    <div key={r.label}>
                      <div style={fl}>{r.label}</div>
                      <div style={fv}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ─── MEDICAL TAB ──────────────────────────────────────────── */}
          {activeTab === 'medical' && (
            <>
              <LeReportsSection reports={caseData.le_reports ?? []} />
              <ApsSection records={caseData.medical_records ?? []} />
              <InternalProjectionsSection
                projections={caseData.le_projections ?? []}
                lifeExpectancies={caseData.life_expectancies ?? []}
              />
            </>
          )}

          {/* ─── COMMUNICATION TAB ────────────────────────────────────── */}
          {activeTab === 'communication' && (
            <div>
              {caseData.notes && caseData.notes.length > 0
                ? caseData.notes.map(entry => (
                  <div key={entry.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 600, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '6px' }}>
                      {fmtDate(entry.created_at).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', lineHeight: 1.5 }}>{entry.content}</div>
                  </div>
                ))
                : <p style={fv}>No communication logged yet.</p>
              }
            </div>
          )}

          {/* ─── BIDS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'bids' && (
            <div>
              {caseData.bids && caseData.bids.filter(b => !b.is_phantom).length > 0
                ? caseData.bids.filter(b => !b.is_phantom).map(bid => (
                  <div key={bid.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '14px', color: '#2A2A2A', marginBottom: '4px' }}>{bid.buyer}</div>
                      <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A' }}>{fmtDate(bid.created_at)}</div>
                    </div>
                    <div style={{ fontFamily: 'Canela, serif', fontStyle: 'italic', fontSize: '28px', color: '#2A2A2A' }}>
                      {fmtMoney(bid.amount)}
                    </div>
                  </div>
                ))
                : <p style={fv}>No offers yet.</p>
              }
            </div>
          )}

          {/* ─── MARKET TAB ───────────────────────────────────────────── */}
          {activeTab === 'market' && <MarketTab pkg={caseData.distribution_package} />}

          {/* ─── DOCUMENTS TAB ────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              {caseData.documents && caseData.documents.length > 0
                ? caseData.documents.map(doc => (
                  <div key={doc.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 24px', marginBottom: '4px' }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '13px', color: '#2A2A2A', marginBottom: '3px' }}>{doc.file_name}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#7A7A7A' }}>{doc.document_type}</div>
                  </div>
                ))
                : <p style={fv}>No documents uploaded.</p>
              }
            </div>
          )}

          {/* ─── CLOSING TAB ──────────────────────────────────────────── */}
          {activeTab === 'closing' && <ClosingTab closing={caseData.closing_detail} />}

          {/* ─── NOTES TAB ────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div>
              <Card>
                <SectionHeader title="Add Note" />
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Write a note…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--lf-parchment)', border: '1px solid var(--lf-rule-mid)', fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Sohne, sans-serif', fontSize: '12px', color: '#7A7A7A', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newNotePublic} onChange={e => setNewNotePublic(e.target.checked)} />
                    Visible to Jim
                  </label>
                  <button onClick={handleSaveNote} disabled={savingNote || !newNote.trim()} style={{ padding: '8px 16px', backgroundColor: '#2A2A2A', color: '#F5F3EF', border: 'none', borderRadius: '3px', fontFamily: 'Sohne, sans-serif', fontWeight: 500, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: !newNote.trim() ? 'not-allowed' : 'pointer', opacity: !newNote.trim() ? 0.5 : 1 }}>
                    {savingNote ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </Card>
              {caseData.notes && caseData.notes.map(note => (
                <div key={note.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '20px 24px', marginBottom: '4px', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '13px', color: '#2A2A2A', lineHeight: 1.6, marginBottom: '8px' }}>{note.content}</div>
                    <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '11px', color: '#7A7A7A' }}>{fmtDate(note.created_at)}</div>
                  </div>
                  <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: note.is_public ? 'var(--lf-sage)' : '#9A9A9A', flexShrink: 0 }}>
                    {note.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ─── TIMELINE TAB ─────────────────────────────────────────── */}
          {activeTab === 'timeline' && <TimelineTab events={caseData.entity_events ?? []} />}

        </div>

        {/* Right sidebar */}
        <div>
          {/* Dark action panel */}
          {caseData.alertInfo.reason && (
            <div style={{ backgroundColor: '#000000', padding: '24px', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '9px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--lf-sage)', marginBottom: '10px' }}>
                Next Required Action
              </div>
              <div style={{ fontFamily: 'Sohne, sans-serif', fontSize: '15px', color: '#FFFFFF', lineHeight: 1.6 }}>
                {caseData.alertInfo.reason}
              </div>
            </div>
          )}

          {/* Stage + Last Contact */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px', marginBottom: '4px' }}>
            <div style={fl}>Current Stage</div>
            <div style={fv}>{stageLabel}</div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px', marginBottom: '4px' }}>
            <div style={fl}>Last Contact</div>
            <div style={fv}>
              {caseData.last_contact_date
                ? fmtDate(caseData.last_contact_date, { month: 'long', day: 'numeric', year: 'numeric' })
                : 'None recorded'}
            </div>
          </div>

          {/* HIPAA status */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px', marginBottom: '4px' }}>
            <div style={fl}>HIPAA Authorization</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontFamily: 'Sohne, sans-serif', fontSize: '12px', fontWeight: 600, color: hipaaStatus.color, backgroundColor: hipaaStatus.bg, border: `1px solid ${hipaaStatus.color}`, padding: '2px 8px', borderRadius: '3px' }}>{hipaaStatus.label}</span>
              {hipaa?.expiry_date && <span style={{ ...fv, fontSize: '12px', color: '#7A7A7A' }}>Exp: {fmtDate(hipaa.expiry_date)}</span>}
            </div>
          </div>

          {/* Quick stats */}
          {(caseData.le_reports ?? []).length > 0 && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px', marginBottom: '4px' }}>
              <div style={fl}>LE Orders</div>
              <div style={fv}>{(caseData.le_reports ?? []).length} total · {(caseData.le_reports ?? []).filter(r => !r.received_date).length} pending</div>
            </div>
          )}

          {(caseData.medical_records ?? []).length > 0 && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--lf-rule)', padding: '16px 20px' }}>
              <div style={fl}>APS Records</div>
              <div style={fv}>{(caseData.medical_records ?? []).length} total · {(caseData.medical_records ?? []).filter(r => !r.received_date).length} pending</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
