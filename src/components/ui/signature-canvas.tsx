'use client'

import { useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignatureCanvasProps {
  onSave: (base64: string) => void
  onClear?: () => void
  className?: string
}

export function SignatureCanvasComponent({
  onSave,
  onClear,
  className = '',
}: SignatureCanvasProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png')
      onSave(dataUrl)
    }
  }, [onSave])

  const handleClear = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear()
    }
    onClear?.()
    onSave('')
  }, [onClear, onSave])

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      <div
        className={[
          'border border-[var(--gold)] rounded-sm overflow-hidden',
          'bg-white',
          'w-full min-w-0',
        ].join(' ')}
        style={{ minHeight: 150 }}
      >
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleEnd}
          penColor="#1a1a1a"
          canvasProps={{
            className: 'w-full',
            style: { width: '100%', height: 150, display: 'block', background: '#fff' },
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleClear}
        className={[
          'self-start text-xs text-[var(--white-muted)] hover:text-[var(--gold)]',
          'transition-colors duration-150 underline underline-offset-2',
        ].join(' ')}
      >
        Clear signature
      </button>
    </div>
  )
}
