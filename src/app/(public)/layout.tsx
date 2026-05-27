import { ReactNode } from 'react'
import { SiteFooter } from '@/components/footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
