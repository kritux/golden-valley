'use client'

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react'

interface FileUploadProps {
  onFile: (file: File) => void
  accept?: string
  maxSizeMB?: number
  label?: string
  className?: string
}

export function FileUpload({
  onFile,
  accept = 'image/*',
  maxSizeMB = 10,
  label = 'Upload file',
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const validate = useCallback(
    (file: File): string | null => {
      const maxBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        return `File is too large. Maximum size is ${maxSizeMB}MB.`
      }
      if (accept && accept !== '*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim())
        const fileType = file.type
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const valid = acceptedTypes.some((a) => {
          if (a.endsWith('/*')) {
            return fileType.startsWith(a.replace('/*', '/'))
          }
          return a === fileType || a === ext
        })
        if (!valid) {
          return `Invalid file type. Accepted: ${accept}`
        }
      }
      return null
    },
    [accept, maxSizeMB]
  )

  const processFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) {
        setError(err)
        return
      }
      setError(null)
      setFileName(file.name)
      onFile(file)

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    },
    [validate, onFile]
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'border border-dashed rounded-sm p-6 text-center cursor-pointer',
          'transition-all duration-200',
          dragging
            ? 'border-[var(--gold)] bg-[rgba(201,168,76,0.07)]'
            : 'border-[var(--black-border)] hover:border-[var(--gold-dark)] hover:bg-[var(--black-card)]',
        ].join(' ')}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 max-w-full object-contain rounded"
            />
            <span className="text-xs text-[var(--white-muted)] truncate max-w-full">
              {fileName}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold-dark)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm text-[var(--white-muted)]">
              {label}
            </p>
            <p className="text-xs text-[var(--white-muted)] opacity-60">
              Drag & drop or click • Max {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {fileName && !preview && (
        <p className="text-xs text-[var(--gold)] truncate">{fileName}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
