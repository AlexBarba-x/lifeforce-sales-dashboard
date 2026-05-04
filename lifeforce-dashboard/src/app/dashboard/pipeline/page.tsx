'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CaseV2, COLORS, TYPE, TYPE_SCALE, STAGES, STAGE_META, Density, DENSITY,
  formatMoney, formatPct, caseUrgency, urgencyScore, contactStaleness, URGENCY_META,
} from '@/lib/design'
import { Pill, UrgencyPill } from '@/components/ui/Pill'
import { Avatar } from '@/components/ui/Avatar'
import { FilterBar, Chip } from '@/components/ui/FilterBar'

interface ApiResp {
  stages: string[]
  grouped: Record<string, CaseV2[]>
  stageStats: Record<string, { count: number; total_face: number }>
  stats: { total_face: number; active_count: number; require_action: number; bids_pending: number }
}

type SortBy = 'urgency' | 'age' | 'value' | 'probability'

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'urgency',     label: 'Urgency' },
  { key: 'age',         label: 'Age' },
  { key: 'value',       label: 'Value' },
  { key: 'probability', label: 'Probability' },
]

// Normalise alert/next-action reason strings to compact dot format: "Verb · Nd"
function formatAlertReason(reason?: string, nextLabel?: string): string | null {
  const raw = reason || nextLabel
  if (!raw) return null
  // "X in N days" → "X · Nd"
  let m = raw.match(/^(.+?)\s+in\s+(\d+)\s+days?$/i)
  if (m) return `${m[1].trim()} · ${m[2]}d`
  // "X — N days" or "X - N days"
  m = raw.match(/^(.+?)\s*[\u2014\u2013-]+\s*(\d+)\s+days?$/i)
  if (m) return `${m[1].trim()} · ${m[2]}d`
  return raw
}

function sortFn(by: SortBy) {
  return (a: CaseV2, b: CaseV2) => {
    if (by === 'urgency')     return urgencyScore(a) - urgencyScore(b)
    if (by === 'age')         return (b.alertInfo?.days_since_contact ?? 0) - (a.alertInfo?.days_since_contact ?? 0)
    if (by === 'value')       return (b.policies?.[0]?.face_amount ?? 0) - (a.policies?.[0]?.face_amount ?? 0)
    if (by === 'probability') return (b.probability ?? 0) - (a.probability ?? 0)
    return 0
  }
}

// ── Pipeline card ───────────────────────────────────────────────────────
function PipelineCard({ c, density }: { c: CaseV2; density: Density }) {
  const u = caseUrgency(c)
  const meta = URGENCY_META[u]
  const face = c.policies?.[0]?.face_amount ?? 0
  const stale = contactStaleness(c.alertInfo?.days_since_contact ?? 0)
  const alertLabel = formatAlertReason(c.alertInfo?.reason, c.next_action?.label)

  const cardPad = density === 'compact' ? '12px' : '18px'
  const cardGap = density === 'compact' ? '6px' : '12px'
  const dotColor = u === 'critical' ? '#C4452C' : u === 'attention' ? '#D4A017' : '#6B8F71'

  return (
    <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        backgroundColor: COLORS.surface,
        borderTop: `1px solid ${COLORS.rule}`,
        borderRight: `1px solid ${COLORS.rule}`,
        borderBottom: `1px solid ${COLORS.rule}`,
        borderLeft: `3px solid ${meta.border}`,
        padding: cardPad,
        marginBottom: cardGap,
        cursor: 'pointer',
        transition: 'background-color 100ms',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceAlt }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = COLORS.surface }}
      >
        {/* Slot 1: Name — h3 (15px/600/-0.005em) */}
        <div style={{
          ...TYPE_SCALE.h3,
          fontFamily: 'Sohne, sans-serif',
          color: COLORS.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {c.insured.is_anonymous
            ? <><span style={{ fontStyle: 'italic', color: COLORS.warmGray }}>Anonymous</span>{' '}<span style={{ fontSize: '9px', letterSpacing: '0.06em', fontWeight: 600, color: '#7A7570', background: '#EAE6DF', borderRadius: '3px', padding: '1px 5px' }}>ANON</span></>
            : <>{c.insured.last_name}, {c.insured.first_name}</>}
        </div>

        {/* Slot 2: Condition — small (13px/400/#6B6862) */}
        <div style={{
          ...TYPE_SCALE.small,
          fontFamily: 'Sohne, sans-serif',
          color: '#6B6862',
          lineHeight: '1.5',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minHeight: '16px',
        }}>
          {c.insured.conditions || ''}
        </div>

        {/* Slot 3: Face value (14px/600/tabular-nums, right-aligned) */}
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Sohne, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            color: COLORS.ink,
          }}>
            {formatMoney(face)}
          </span>
        </div>

        {/* Slot 4: Meta — [● dot] action·Nd  |  timestamp */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflow: 'hidden',
            flex: 1,
            minWidth: 0,
          }}>
            <span style={{ color: dotColor, fontSize: '8px', flexShrink: 0, lineHeight: 1 }}>●</span>
            <span style={{
              ...TYPE_SCALE.small,
              fontFamily: 'Sohne, sans-serif',
              color: u === 'critical' ? COLORS.red : u === 'attention' ? COLORS.amber : COLORS.warmGray,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }} title={alertLabel || undefined}>
              {alertLabel || ''}
            </span>
          </div>
          <span style={{
            ...TYPE_SCALE.small,
            fontFamily: 'Sohne, sans-serif',
            color: stale.color,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }} title={`${c.alertInfo?.days_since_contact ?? 0}d since last contact`}>
            {stale.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Pipeline column ─────────────────────────────────────────────────────
function PipelineColumn({
  stage,
  cases,
  density,
  width,
}: {
  stage: string
  cases: CaseV2[]
  density: Density
  width: number
}) {
  const meta = STAGE_META[stage as keyof typeof STAGE_META] || { label: stage, short: stage.slice(0, 2).toUpperCase() }
  const totalFace = cases.reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)
  const criticalCount = cases.filter(c => caseUrgency(c) === 'critical').length

  return (
    <div style={{
      flex: `0 0 ${width}px`,
      backgroundColor: COLORS.parchmentDeep,
      border: `1px solid ${COLORS.rule}`,
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 280px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px 12px',
        borderBottom: '1px solid #E5DFD5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{
            ...TYPE_SCALE.micro,
            fontFamily: 'Sohne, sans-serif',
            color: '#9A958F',
            letterSpacing: '0.10em',
          }}>
            {meta.label}
          </span>
          <span style={{
            fontFamily: 'Sohne, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1A1A17',
          }}>
            {cases.length}
          </span>
          {criticalCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#FCEFEC',
              border: '1px solid #F0CFC7',
              color: '#8B2818',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: 'Sohne, sans-serif',
            }} title={`${criticalCount} critical`}>
              {criticalCount} ATTN
            </span>
          )}
        </div>
        <span style={{
          ...TYPE_SCALE.label,
          fontFamily: 'Sohne, sans-serif',
          color: '#6B6862',
        }}>
          {formatMoney(totalFace)}
        </span>
      </div>

      {/* Body */}
      <div style={{
        padding: '8px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {cases.length === 0 ? (
          <div style={{
            ...TYPE.micro,
            color: COLORS.mutedGray,
            textAlign: 'center',
            padding: '24px 8px',
            fontStyle: 'italic',
          }}>
            empty
          </div>
        ) : (
          cases.map(c => <PipelineCard key={c.id} c={c} density={density} />)
        )}
      </div>
    </div>
  )
}

// ── Main: Pipeline v2 ───────────────────────────────────────────────────
export default function PipelinePage() {
  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [density, setDensity] = useState<Density>('comfortable')
  const [sortBy, setSortBy] = useState<SortBy>('urgency')
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'attention'>('all')

  useEffect(() => {
    fetch('/api/cases?groupBy=stage')
      .then(r => r.json())
      .then((d: ApiResp) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return null
    const q = search.toLowerCase().trim()
    const out: Record<string, CaseV2[]> = {}
    for (const stage of data.stages) {
      let list = data.grouped[stage] || []

      if (q) {
        list = list.filter(c =>
          `${c.insured.first_name} ${c.insured.last_name}`.toLowerCase().includes(q) ||
          c.insured.conditions?.toLowerCase().includes(q) ||
          c.policies?.[0]?.carrier?.toLowerCase().includes(q) ||
          c.alertInfo?.reason?.toLowerCase().includes(q)
        )
      }

      if (urgencyFilter === 'critical') {
        list = list.filter(c => caseUrgency(c) === 'critical')
      } else if (urgencyFilter === 'attention') {
        list = list.filter(c => caseUrgency(c) === 'attention' || caseUrgency(c) === 'critical')
      }

      out[stage] = [...list].sort(sortFn(sortBy))
    }
    return out
  }, [data, search, sortBy, urgencyFilter])

  // Variable column widths — proportional to case count, with floor
  const columnWidths = useMemo(() => {
    if (!filtered || !data) return {}
    const minW = 220
    const maxW = 320
    const counts = data.stages.map(s => filtered[s]?.length ?? 0)
    const maxCount = Math.max(...counts, 1)
    const widths: Record<string, number> = {}
    for (const s of data.stages) {
      const n = filtered[s]?.length ?? 0
      // Empty/sparse → minW; full → maxW
      const ratio = Math.min(n / maxCount, 1)
      widths[s] = Math.round(minW + ratio * (maxW - minW))
    }
    return widths
  }, [filtered, data])

  // Compute totals over the FILTERED, non-closed cases so the hero + columns reconcile.
  const filteredAggregate = useMemo(() => {
    if (!filtered || !data) return { active: 0, face: 0, critical: 0 }
    let active = 0, face = 0, critical = 0
    for (const stage of data.stages) {
      if (stage === 'closed') continue
      const list = filtered[stage] || []
      for (const c of list) {
        active++
        face += c.policies?.[0]?.face_amount ?? 0
        if (caseUrgency(c) === 'critical') critical++
      }
    }
    return { active, face, critical }
  }, [filtered, data])

  const filteredActive = filteredAggregate.active
  const filteredFace = filteredAggregate.face
  const filteredCriticalCount = filteredAggregate.critical

  return (
    <div>
      {/* Page hero — reflect FILTERED counts, not raw API stats */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '20px',
        marginBottom: '20px',
      }}>
        <h1 style={{
          fontFamily: 'Sohne, sans-serif',
          ...TYPE_SCALE.h1,
          color: COLORS.ink,
          margin: 0,
        }}>
          Pipeline
        </h1>
        <span style={{ ...TYPE.body, color: COLORS.warmGray }}>
          {filteredActive} active · {formatMoney(filteredFace)} face
        </span>
        {filteredCriticalCount > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#FCEFEC',
            border: '1px solid #F0CFC7',
            color: '#8B2818',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: 'Sohne, sans-serif',
          }}>
            {filteredCriticalCount} ATTN
          </span>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        density={density}
        onDensityChange={setDensity}
        searchPlaceholder="Search pipeline…"
        leftSlot={
          <div style={{ display: 'flex', gap: '6px' }}>
            <Chip
              active={urgencyFilter === 'all'}
              onClick={() => setUrgencyFilter('all')}
            >
              All
            </Chip>
            <Chip
              active={urgencyFilter === 'critical'}
              onClick={() => setUrgencyFilter('critical')}
              tone="red"
            >
              ● Critical
            </Chip>
            <Chip
              active={urgencyFilter === 'attention'}
              onClick={() => setUrgencyFilter('attention')}
              tone="amber"
            >
              ● Attention+
            </Chip>
          </div>
        }
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...TYPE.label, color: COLORS.warmGray, fontSize: '9px' }}>SORT</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              style={{
                ...TYPE.body,
                padding: '5px 8px',
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.rule}`,
                borderRadius: '3px',
                color: COLORS.ink,
                fontSize: '12px',
              }}
            >
              {SORT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
          </div>
        }
      />

      {/* Board */}
      {loading || !data ? (
        <p style={{ ...TYPE.body, color: COLORS.warmGray }}>Loading pipeline…</p>
      ) : (
        <div style={{
          display: 'flex',
          gap: density === 'compact' ? '14px' : '18px',
          overflowX: 'auto',
          paddingBottom: '20px',
          alignItems: 'flex-start',
        }}>
          {data.stages.map(stage => (
            <PipelineColumn
              key={stage}
              stage={stage}
              cases={filtered?.[stage] ?? []}
              density={density}
              width={columnWidths[stage] ?? 260}
            />
          ))}
        </div>
      )}
    </div>
  )
}
