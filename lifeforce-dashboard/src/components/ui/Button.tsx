'use client'

import React from 'react'
import { BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/design'

type Variant = keyof typeof BUTTON_VARIANTS
type Size = keyof typeof BUTTON_SIZES

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  children: React.ReactNode
  style?: React.CSSProperties
  disabled?: boolean
  title?: string
}

// Button rendered as <button>
interface ButtonAsButton extends ButtonBaseProps {
  as?: 'button'
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
}

// Button rendered as <a>
interface ButtonAsAnchor extends ButtonBaseProps {
  as: 'a'
  href: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

type ButtonProps = ButtonAsButton | ButtonAsAnchor

export function Button(props: ButtonProps) {
  const { variant = 'secondary', size = 'md', children, style, disabled, title } = props
  const v = BUTTON_VARIANTS[variant]
  const s = BUTTON_SIZES[size]

  const baseStyle: React.CSSProperties = {
    fontFamily: 'Sohne, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontSize: s.fontSize,
    height: s.height,
    padding: s.padding,
    borderRadius: s.borderRadius,
    backgroundColor: v.bg,
    color: v.color,
    border: `1px solid ${v.border}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    lineHeight: 1,
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 100ms, color 100ms',
    ...style,
  }

  if (props.as === 'a') {
    return (
      <a
        href={props.href}
        onClick={props.onClick as React.MouseEventHandler<HTMLAnchorElement>}
        style={baseStyle}
        title={title}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = v.hoverBg }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = v.bg }}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={(props as ButtonAsButton).type || 'button'}
      onClick={(props as ButtonAsButton).onClick}
      disabled={disabled}
      style={baseStyle}
      title={title}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = v.hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = v.bg }}
    >
      {children}
    </button>
  )
}
