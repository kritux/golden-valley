'use client'

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusIndex = (idx: number) => {
    if (idx >= 0 && idx < 6) {
      inputRefs.current[idx]?.focus()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) return

    // Take only last char typed (handles case where browser inserts 2 chars)
    const digit = raw.slice(-1)
    const next = [...value]
    next[idx] = digit
    onChange(next)

    // Advance focus
    if (idx < 5) focusIndex(idx + 1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (value[idx]) {
        // Clear current slot
        const next = [...value]
        next[idx] = ''
        onChange(next)
      } else if (idx > 0) {
        // Move back and clear previous slot
        const next = [...value]
        next[idx - 1] = ''
        onChange(next)
        focusIndex(idx - 1)
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusIndex(idx - 1)
    } else if (e.key === 'ArrowRight' && idx < 5) {
      focusIndex(idx + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    onChange(next)
    // Focus last filled or next empty
    const focusAt = Math.min(pasted.length, 5)
    focusIndex(focusAt)
  }

  const handleFocus = (idx: number) => {
    // Select text on focus so re-typing replaces
    inputRefs.current[idx]?.select()
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(idx)}
          autoComplete="one-time-code"
          className={[
            'w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black',
            'bg-[var(--black-surface)] border-2 rounded-sm outline-none',
            'text-[var(--white)] transition-all duration-200',
            'font-[var(--font-dm-mono)]',
            disabled ? 'opacity-40 cursor-not-allowed' : '',
            value[idx]
              ? 'border-[var(--gold)] shadow-[0_0_12px_rgba(212,175,55,0.35)]'
              : 'border-[var(--black-border)] focus:border-[var(--gold)] focus:shadow-[0_0_12px_rgba(212,175,55,0.25)]',
          ].join(' ')}
          style={{ fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)' }}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  )
}
