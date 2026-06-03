'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SessionUser {
  id: string; email: string; name?: string; roles: string[]; profileComplete: boolean
}

const NAV = [
  { href: '/dashboard', label: 'Acasă', icon: '🏠', exact: true },
  { href: '/dashboard/courses', label: 'Materiale instruire', icon: '📚' },
  { href: '/dashboard/calendar', label: 'Calendar evenimente', icon: '📅' },
  { href: '/dashboard/progress', label: 'Progresul meu', icon: '📊' },
  { href: '/dashboard/profile', label: 'Profil', icon: '👤' },
  { href: '/dashboard/help', label: 'Ajutor / Contact AEP', icon: '❓' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.data) setUser({ id: d.data.id, email: d.data.email, name: d.data.profile?.prenume, roles: d.data.roles?.map((r: any) => r.role) || [], profileComplete: d.data.profile?.profileComplete || false })
    }).catch(() => {})
  }, [])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-aep-700 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(o => !o)} className="lg:hidden p-2 hover:bg-aep-600 rounded-lg">
              ☰
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-aep-600 font-bold text-xs">AEP</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">Instruire Online</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('CONTENT_ADMIN') || user?.roles?.includes('REPORTING_ADMIN') ? (
              <Link href="/admin" className="text-xs text-blue-200 hover:text-white hidden sm:block">Admin ↗</Link>
            ) : null}
            <span className="text-sm text-blue-200 hidden sm:block">
              {user?.name ? `Bun venit, ${user.name}!` : user?.email}
            </span>
            <button
  onClick={async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/auth/login'
  }}
  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
  Ieșire
</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar navigare */}
        <aside className={`${sidebarOpen ? 'fixed inset-0 z-30 bg-black/50' : 'hidden'} lg:relative lg:block lg:bg-transparent lg:inset-auto lg:z-auto`}>
          <nav className={`${sidebarOpen ? 'relative z-50 bg-white shadow-xl rounded-xl w-64 p-4' : ''} lg:bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-100 lg:p-4 lg:w-56 lg:shrink-0 lg:h-fit`}>
            <div onClick={() => setSidebarOpen(false)}>
              {NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'bg-aep-50 text-aep-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Conținut principal */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} AEP · 
        <Link href="/politica-confidentialitate" className="hover:text-gray-600 ml-1">Politică de confidențialitate</Link>
      </footer>
    </div>
  )
}
