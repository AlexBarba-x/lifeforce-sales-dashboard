'use client'

import { useEffect, useRef } from 'react'
import { COLORS, TYPE, Density } from '@/lib/design'
import { Kbd } from './Kbd'

interface FilterBarProps {
  search: string
  onSearch: (q: string) => void
  density?: Density
  onDensityChange?: (d: Density) => void
  rightSlot?: React.ReactNode
  leftSlot?: React.ReactNode
  searchPlaceholder?: string
}

export function FilterBar({
  search,
  onSearch,
  density,
  onDensityChange,
  rightSlot,
  leftSlot,
  searchPlaceholder = 'Search cases…',
}: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Global "/" focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 0',
      borderBottom: `1px solid ${COLORS.rule}`,
      marginBottom: '20px',
    }}>
      {leftSlot}

      {/* Search */}
      <div style={{
        flex: '0 1 320px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{
          position: 'absolute',
          left: '10px',
          color: COLORS.mutedGray,
          fontSize: '14px',
          pointerEvents: 'none',
        }}>⌕</span>
        <input
          ref={inputRef}
          data-search-input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          style={{
            ...TYPE.body,
            flex: 1,
            padding: '7px 10px 7px 30px',
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.rule}`,
            borderRadius: '4px',
            color: COLORS.ink,
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = COLORS.sage}
          onBlur={e => e.target.style.borderColor = COLORS.rule}
        />
        <span style={{
          position: 'absolute',
          right: '8px',
          pointerEvents: 'none',
        }}>
          <Kbd>/</Kbd>
        </span>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {density && onDensityChange && (
          <DensityToggle density={density} onChange={onDensityChange} />
        )}
        {rightSlot}
      </div>
    </div>
  )
}

function DensityToggle({ density, onChange }: { density: Density; onChange: (d: Density) => void }) {
  return (
    <div style={{
      display: 'inline-flex',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderRadius: '6px',
      padding: '2px',
    }}>
      {(['compact', 'comfortable'] as Density[]).map(d => {
        const active = density === d
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            style={{
              ...TYPE.label,
              padding: '4px 10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '9px',
              backgroundColor: active ? '#1A1A17' : 'transparent',
              color: active ? '#FFFFFF' : '#6B6862',
              borderRadius: '4px',
              fontWeight: active ? 700 : 500,
              height: '22px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {d === 'compact' ? 'COMPACT' : 'COMFORTABLE'}
          </button>
        )
      })}
    </div>
  )
}

interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  count?: number
  tone?: 'neutral' | 'red' | 'amber' | 'green'
  style?: React.CSSProperties
}

export function Chip({ active, onClick, children, count, tone = 'neutral', style }: ChipProps) {
  const toneColor = tone === 'red' ? COLORS.red : tone === 'amber' ? COLORS.amber : tone === 'green' ? COLORS.green : COLORS.warmGray

  return (
    <button
      onClick={onClick}
      style={{
        ...TYPE.micro,
        padding: '4px 10px',
        backgroundColor: active ? '#1A3A28' : COLORS.surface,
        color: active ? '#FFFFFF' : toneColor,
        border: `1px solid ${active ? '#1A3A28' : '#E5E1D8'}`,
        borderRadius: '6px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        height: '26px',
        ...style,
      }}
    >
      {children}
      {count !== undefined && (
        <span style={{
          opacity: 0.7,
          fontWeight: 500,
        }}>{count}</span>
      )}
    </button>
  )
}
