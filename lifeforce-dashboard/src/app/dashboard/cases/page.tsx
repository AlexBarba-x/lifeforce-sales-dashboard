'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CaseV2, COLORS, TYPE, TYPE_SCALE, STAGES, STAGE_META, Density, DENSITY,
  formatMoney, formatPct, caseUrgency, urgencyScore, contactStaleness, URGENCY_META,
  Stage,
} from '@/lib/design'
import { Pill, UrgencyPill } from '@/components/ui/Pill'
import { Avatar } from '@/components/ui/Avatar'
import { FilterBar, Chip } from '@/components/ui/FilterBar'

type SortKey = 'name' | 'stage' | 'face' | 'days' | 'probability' | 'close' | 'urgency'
type SortDir = 'asc' | 'desc'

interface ColumnDef {
  key: SortKey
  label: string
  width: string
  align?: 'left' | 'right'
  sortable?: boolean
}

const COLUMNS: ColumnDef[] = [
  { key: 'urgency',     label: '',          width: '4px',   sortable: true },
  { key: 'name',        label: 'Insured',   width: '220px', sortable: true },
  { key: 'stage',       label: 'Stage',     width: '120px', sortable: true },
  { key: 'face',        label: 'Face',      width: '90px',  align: 'right', sortable: true },
  { key: 'probability', label: 'Prob.',     width: '60px',  align: 'right', sortable: true },
  { key: 'close',       label: 'Close',     width: '90px',  align: 'right', sortable: true },
  { key: 'days',        label: 'Last touch',width: '120px', align: 'right', sortable: true },
]

function sortFn(key: SortKey, dir: SortDir) {
  const mult = dir === 'asc' ? 1 : -1
  return (a: CaseV2, b: CaseV2) => {
    let aV: any, bV: any
    switch (key) {
      case 'name':       aV = `${a.insured.last_name}${a.insured.first_name}`; bV = `${b.insured.last_name}${b.insured.first_name}`; break
      case 'stage':      aV = STAGES.indexOf(a.stage); bV = STAGES.indexOf(b.stage); break
      case 'face':       aV = a.policies?.[0]?.face_amount ?? 0; bV = b.policies?.[0]?.face_amount ?? 0; break
      case 'days':       aV = a.alertInfo?.days_since_contact ?? 0; bV = b.alertInfo?.days_since_contact ?? 0; break
      case 'probability':aV = a.probability ?? 0; bV = b.probability ?? 0; break
      case 'close':      aV = a.expected_close ? new Date(a.expected_close).getTime() : Infinity; bV = b.expected_close ? new Date(b.expected_close).getTime() : Infinity; break
      case 'urgency':    return (urgencyScore(a) - urgencyScore(b)) * mult
    }
    if (aV < bV) return -1 * mult
    if (aV > bV) return  1 * mult
    return 0
  }
}

function formatCloseDate(iso?: string): string {
  // Always relative — keeps the CLOSE column scannable. Calendar-day anchored.
  if (!iso) return '—'
  const d = new Date(iso)
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const now = new Date()
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((target - nowDay) / 86400000)
  if (days < 0)   return `${Math.abs(days)}d ago`
  if (days === 0) return 'today'
  if (days < 7)   return `${days}d`
  if (days < 35)  return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

// ── Main ────────────────────────────────────────────────────────────────
export default function AllCasesPage() {
  const [allCases, setAllCases] = useState<CaseV2[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [density, setDensity] = useState<Density>('compact')
  const [sortKey, setSortKey] = useState<SortKey>('urgency')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [stageFilter, setStageFilter] = useState<Set<Stage>>(new Set())
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'attention'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then((d: CaseV2[]) => { setAllCases(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = allCases
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(c =>
        `${c.insured.first_name} ${c.insured.last_name}`.toLowerCase().includes(q) ||
        c.insured.conditions?.toLowerCase().includes(q) ||
        c.policies?.[0]?.carrier?.toLowerCase().includes(q) ||
        c.alertInfo?.reason?.toLowerCase().includes(q)
      )
    }
    if (stageFilter.size > 0) {
      list = list.filter(c => stageFilter.has(c.stage))
    }
    if (urgencyFilter === 'critical') {
      list = list.filter(c => caseUrgency(c) === 'critical')
    } else if (urgencyFilter === 'attention') {
      const u = (c: CaseV2) => caseUrgency(c)
      list = list.filter(c => u(c) === 'attention' || u(c) === 'critical')
    }
    return [...list].sort(sortFn(sortKey, sortDir))
  }, [allCases, search, stageFilter, urgencyFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'face' || key === 'probability' || key === 'days' ? 'desc' : 'asc')
    }
  }

  const toggleStage = (s: Stage) => {
    const next = new Set(stageFilter)
    next.has(s) ? next.delete(s) : next.add(s)
    setStageFilter(next)
  }

  const toggleSelected = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  const totalFace = filtered.reduce((s, c) => s + (c.policies?.[0]?.face_amount ?? 0), 0)
  const rowH = DENSITY[density].rowH
  const rowPad = density === 'compact' ? '14px 16px' : '14px 18px'

  // Last Touch column: no "Stale" prefix, color by age
  function lastTouchCell(days: number): { text: string; color: string } {
    if (days >= 14) return { text: days === 0 ? 'Today' : `${days}d ago`, color: '#8B2818' }
    if (days >= 7)  return { text: `${days}d ago`, color: '#8A6E1F' }
    if (days <= 0)  return { text: 'Today', color: '#6B6862' }
    if (days === 1) return { text: 'Yesterday', color: '#6B6862' }
    return { text: `${days}d ago`, color: '#6B6862' }
  }

  return (
    <div>
      <style>{`
        .case-row:hover .row-checkbox { opacity: 1 !important; }
      `}</style>
      {/* Hero */}
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
          All Cases
        </h1>
        <span style={{ ...TYPE.body, color: COLORS.warmGray }}>
          {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
          {filtered.length !== allCases.length && ` of ${allCases.length}`}
          {' · '}
          {formatMoney(totalFace)} face
        </span>
        {selected.size > 0 && (
          <Pill tone="blue" variant="soft">
            {selected.size} selected
          </Pill>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        density={density}
        onDensityChange={setDensity}
        searchPlaceholder="Search by name, condition, carrier…"
        leftSlot={
          <div style={{ display: 'flex', gap: '6px' }}>
            <Chip active={urgencyFilter === 'all'}      onClick={() => setUrgencyFilter('all')}>All</Chip>
            <Chip active={urgencyFilter === 'critical'}  onClick={() => setUrgencyFilter('critical')}  tone="red">● Critical</Chip>
            <Chip active={urgencyFilter === 'attention'} onClick={() => setUrgencyFilter('attention')} tone="amber">● Attention+</Chip>
          </div>
        }
        rightSlot={
          <button
            style={{
              ...TYPE.label,
              padding: '6px 14px',
              backgroundColor: '#1A3A28',
              color: '#FFFFFF',
              border: '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '10px',
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F2418' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1A3A28' }}
            onClick={() => alert('+ New case (Supabase wiring pending)')}
          >
            + New case
          </button>
        }
      />

      {/* Stage chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ ...TYPE.label, color: COLORS.warmGray, fontSize: '9px', alignSelf: 'center', marginRight: '4px' }}>STAGE</span>
        {STAGES.map(s => (
          <Chip
            key={s}
            active={stageFilter.has(s)}
            onClick={() => toggleStage(s)}
            count={allCases.filter(c => c.stage === s).length}
            style={{ minWidth: '90px', justifyContent: 'center' }}
          >
            {STAGE_META[s].label}
          </Chip>
        ))}
        {stageFilter.size > 0 && (
          <button
            onClick={() => setStageFilter(new Set())}
            style={{
              ...TYPE.micro,
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: COLORS.warmGray,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ ...TYPE.body, color: COLORS.warmGray }}>Loading cases…</p>
      ) : (
        <div style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.rule}`,
          borderRadius: '4px',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `36px 4px 220px 110px 90px 60px 90px 1fr 100px`,
            alignItems: 'center',
            padding: rowPad,
            paddingLeft: '12px',
            borderBottom: `1px solid ${COLORS.rule}`,
            backgroundColor: COLORS.surfaceAlt,
            ...TYPE_SCALE.micro,
            fontFamily: 'Sohne, sans-serif',
            color: '#6B6862',
            paddingBottom: '12px',
            gap: '12px',
          }}>
            {/* Header checkbox always visible */}
            <input
              type="checkbox"
              checked={selected.size > 0 && selected.size === filtered.length}
              onChange={toggleAll}
              style={{ cursor: 'pointer' }}
            />
            <span /> {/* urgency rail */}
            <SortHeader col={COLUMNS[1]} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortHeader col={{ ...COLUMNS[2], align: 'left' }} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortHeader col={COLUMNS[3]} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortHeader col={COLUMNS[4]} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortHeader col={COLUMNS[5]} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <span style={{ ...TYPE_SCALE.micro, fontFamily: 'Sohne, sans-serif' }}>Action</span>
            <SortHeader col={COLUMNS[6]} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </div>

          {/* Body */}
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              ...TYPE.body,
              color: COLORS.warmGray,
            }}>
              No cases match your filters.
            </div>
          ) : (
            filtered.map(c => {
              const u = caseUrgency(c)
              const meta = URGENCY_META[u]
              const face = c.policies?.[0]?.face_amount ?? 0
              const stale = contactStaleness(c.alertInfo?.days_since_contact ?? 0)
              const isSelected = selected.has(c.id)

              return (
                <div
                  key={c.id}
                  className="case-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `36px 4px 220px 110px 90px 60px 90px 1fr 100px`,
                    alignItems: 'center',
                    padding: rowPad,
                    paddingLeft: '12px',
                    borderBottom: `1px solid #E0DCD2`,
                    backgroundColor: isSelected ? COLORS.surfaceAlt : COLORS.surface,
                    cursor: 'pointer',
                    gap: '12px',
                    minHeight: Math.max(rowH, 56),
                    transition: 'background-color 120ms ease-out',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = COLORS.surface }}
                  onClick={() => router.push(`/dashboard/cases/${c.id}?demo=1`)}
                >
                  {/* Custom checkbox: hidden by default, shown on hover or when selected */}
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      border: isSelected ? '1.5px solid #1A3A28' : '1.5px solid #C8C2B5',
                      borderRadius: '3px',
                      backgroundColor: isSelected ? '#1A3A28' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      // Hide by default via CSS class; show on row hover or when selected
                      opacity: isSelected ? 1 : 0,
                      transition: 'opacity 100ms',
                    }}
                    className="row-checkbox"
                    onClick={e => { e.stopPropagation(); toggleSelected(c.id) }}
                  >
                    {isSelected && (
                      <span style={{ color: '#FFFFFF', fontSize: '9px', lineHeight: 1, fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    color: (() => {
                      if (u === 'critical')  return '#C4452C'
                      if (u === 'attention') return '#D4A017'
                      if (u === 'monitor')   return '#6B8F71'
                      return '#A8A49E'
                    })(),
                  }} title={meta.label}>●</span>

                  <Link href={`/dashboard/cases/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {c.owner && <Avatar initials={c.owner.initials} size={22} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...TYPE.subtitle, color: COLORS.ink, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.insured.is_anonymous
                          ? <span style={{ color: COLORS.warmGray, fontStyle: 'italic' }}>Anonymous</span>
                          : <>{c.insured.last_name}, {c.insured.first_name}</>}
                        {c.insured.is_anonymous && (
                          <span style={{ fontSize: '9px', fontStyle: 'normal', letterSpacing: '0.06em', fontFamily: 'Söhne, sans-serif', fontWeight: 600, color: '#7A7570', background: '#EAE6DF', borderRadius: '3px', padding: '1px 5px' }}>ANON</span>
                        )}
                        {(c as any).has_pending_le && (
                          <span style={{ fontSize: '9px', fontStyle: 'normal', letterSpacing: '0.06em', fontFamily: 'Sohne, sans-serif', fontWeight: 600, color: '#D4A017', background: '#F5EAD8', borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>LE PENDING</span>
                        )}
                      </div>
                      {density === 'comfortable' && (
                        <div style={{ ...TYPE.micro, color: COLORS.warmGray, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Age {c.insured.age} · {c.insured.conditions}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Stage badge */}
                  {(() => {
                    const stageBadgeBg: Record<string, string> = {
                      intake: '#E5DFD5',
                      underwriting: '#C5D4CA',
                      market: '#F5F2EC',
                      working: '#D9CFB7',
                      closing: '#B8CCC0',
                      closed: '#E0DDD8',
                    }
                    const stageBadgeBorder: Record<string, string> = {
                      intake: '#D6CFBF',
                      underwriting: '#AABFB3',
                      market: '#DDD8CE',
                      working: '#C8BC9E',
                      closing: '#9AB0A5',
                      closed: '#C8C4BE',
                    }
                    const bg = stageBadgeBg[c.stage] ?? COLORS.parchmentDeep
                    const bdr = stageBadgeBorder[c.stage] ?? COLORS.rule
                    return (
                      <span style={{
                        display: 'inline-block',
                        minWidth: '100px',
                        textAlign: 'center',
                        padding: '6px 12px',
                        backgroundColor: bg,
                        border: `1px solid ${bdr}`,
                        borderRadius: '3px',
                        fontFamily: 'Sohne, sans-serif',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: COLORS.ink2,
                      }}>
                        {STAGE_META[c.stage]?.label || c.stage}
                      </span>
                    )
                  })()}

                  {/* Face */}
                  <span style={{ ...TYPE.data, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: COLORS.ink, textAlign: 'right' }}>
                    {formatMoney(face)}
                  </span>

                  {/* Probability */}
                  <span style={{ ...TYPE.body, color: COLORS.warmGray, textAlign: 'right', fontSize: '12px' }}>
                    {c.probability !== undefined ? formatPct(c.probability) : '—'}
                  </span>

                  {/* Close */}
                  <span style={{ ...TYPE.body, color: COLORS.warmGray, textAlign: 'right', fontSize: '12px' }}>
                    {c.stage === 'closed' ? '—' : formatCloseDate(c.expected_close)}
                  </span>

                  {/* Action / next-step */}
                  <span
                    style={{
                      fontFamily: 'Sohne, sans-serif',
                      fontSize: '14px',
                      fontWeight: u === 'critical' ? 600 : 400,
                      lineHeight: '1.4',
                      color: u === 'critical' ? COLORS.red : u === 'attention' ? COLORS.amber : COLORS.warmGray,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={c.alertInfo?.reason || c.next_action?.label}
                  >
                    {c.alertInfo?.reason || c.next_action?.label || '—'}
                  </span>

                  {/* Days since contact — Nd ago, no Stale prefix, tabular-nums, right-aligned */}
                  {(() => {
                    const lt = lastTouchCell(c.alertInfo?.days_since_contact ?? 0)
                    return (
                      <span style={{
                        ...TYPE.micro,
                        color: lt.color,
                        textAlign: 'right',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        display: 'block',
                      }}>
                        {lt.text}
                      </span>
                    )
                  })()}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: COLORS.ink,
          color: COLORS.surface,
          padding: '10px 16px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 20,
        }}>
          <span style={{ ...TYPE.body, fontSize: '12px' }}>
            {selected.size} {selected.size === 1 ? 'case' : 'cases'} selected
          </span>
          <button onClick={() => alert('Reassign')} style={bulkBtn}>Reassign</button>
          <button onClick={() => alert('Update stage')} style={bulkBtn}>Move stage</button>
          <button onClick={() => alert('Export')} style={bulkBtn}>Export CSV</button>
          <button onClick={() => setSelected(new Set())} style={{ ...bulkBtn, opacity: 0.6 }}>Clear</button>
        </div>
      )}
    </div>
  )
}

const bulkBtn: React.CSSProperties = {
  ...TYPE.label,
  padding: '4px 10px',
  backgroundColor: 'transparent',
  border: `1px solid rgba(255,255,255,0.2)`,
  color: '#FFFFFF',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '10px',
}

function SortHeader({ col, sortKey, sortDir, onSort }: {
  col: ColumnDef
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}) {
  const isActive = sortKey === col.key
  return (
    <button
      onClick={() => col.sortable && onSort(col.key)}
      style={{
        ...TYPE.label,
        background: 'transparent',
        border: 'none',
        cursor: col.sortable ? 'pointer' : 'default',
        color: isActive ? COLORS.ink : COLORS.warmGray,
        textAlign: col.align || 'left',
        padding: 0,
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {col.label}
      {isActive && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )
}
