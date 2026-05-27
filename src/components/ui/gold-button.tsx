'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonSize = 'sm' | 'md' | 'lg'

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  size?: ButtonSize
  className?: string
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function GoldButton({
  children,
  loading = false,
  size = 'md',
  className = '',
  disabled,
  ...props
}: GoldButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'relative overflow-hidden font-semibold tracking-widest uppercase',
        'text-[var(--black)] rounded-sm transition-all duration-200',
        'btn-gold-shimmer',
        sizeClasses[size],
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-[0_0_24px_rgba(201,168,76,0.5)] hover:scale-[1.02] active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <GoldSpinner />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  )
}

export function GoldSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
      />
    </svg>
  )
}
