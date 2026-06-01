'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/users', label: 'Utilizatori', icon: '👥' },
  { href: '/admin/content', label: 'Conținut', icon: '📚' },
  { href: '/admin/tests', label: 'Teste & Întrebări', icon: '✅' },
  { href: '/admin/calendar', label: 'Calendar', icon: '📅' },
  { href: '/admin/reports', label: 'Rapoarte', icon: '📈' },
  { href: '/admin/settings', label: 'Setări', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div>
              <span className="font-bold text-aep-700 text-sm">AEP Admin</span>
              <p className="text-xs text-gray-400">Panou administrare</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm mx-2 rounded-lg mb-0.5 transition-colors ${
                isActive(item.href, item.exact)
                  ? 'bg-aep-50 text-aep-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link href="/dashboard"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <span>←</span>
            {!collapsed && <span>Înapoi la platformă</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            {NAV.filter(n => isActive(n.href, n.exact)).map(n => (
              <span key={n.href} className="text-sm font-medium text-gray-900">{n.icon} {n.label}</span>
            ))}
          </div>
          <button
  onClick={async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/auth/login'
  }}
  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
  Ieșire
</button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
