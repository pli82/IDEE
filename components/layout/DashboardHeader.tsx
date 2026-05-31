// src/components/layout/DashboardHeader.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/types'

export default function DashboardHeader({ session }: { session: SessionUser }) {
  const router = useRouter()
  const isAdmin = session.roles.some((r) =>
    ['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORTING_ADMIN'].includes(r)
  )

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const displayName = session.name || session.email

  return (
    <header className="bg-aep-600 text-white shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-aep-600 font-bold text-xs">AEP</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">
              AEP Instruire Online
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs text-blue-200 hover:text-white border border-blue-400 hover:border-white rounded-md px-3 py-1.5 transition-colors"
            >
              Panou Admin
            </Link>
          )}

          {/* Notificări */}
          <button
            aria-label="Notificări"
            className="relative p-1.5 text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium truncate max-w-[150px]">{displayName}</p>
              <p className="text-xs text-blue-200 truncate">
                {session.roles.includes('SUPER_ADMIN')
                  ? 'Super Admin'
                  : session.roles.includes('CONTENT_ADMIN')
                  ? 'Admin Conținut'
                  : session.roles.includes('REPORTING_ADMIN')
                  ? 'Admin Raportare'
                  : 'Utilizator'}
              </p>
            </div>
            <div className="w-8 h-8 bg-aep-400 rounded-full flex items-center justify-center text-xs font-bold uppercase">
              {(session.name || session.email).charAt(0)}
            </div>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Ieșire din cont"
            className="p-1.5 text-blue-200 hover:text-white transition-colors"
            title="Ieșire"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
