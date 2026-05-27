import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--black)] flex items-center justify-center px-4">
      {children}
    </div>
  )
}
