'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  user: { email: string; profile: any }
  stats: { totalLessons: number; completedLessons: number; totalTests: number; passedTests: number; failedTests: number }
  notifications: { id: string; title: string; body: string; createdAt: string }[]
  upcomingEvents: { id: string; title: string; startAt: string; county: any }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/progress', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/events?limit=5', { credentials: 'include' }).then(r => r.json()),
    ]).then(([profileRes, progressRes, eventsRes]) => {
      const profile = profileRes.data
      const stats = progressRes.data || {}
      const events = eventsRes.data || []
      setData({ user: profile, stats, notifications: [], upcomingEvents: events })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aep-600" />
    </div>
  )

  const profile = data?.user?.profile
  const stats = data?.stats
  const completionPct = stats && stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Bun venit */}
      <div className="bg-gradient-to-r from-aep-600 to-aep-700 rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold">
          Bun venit{profile?.prenume ? `, ${profile.prenume}!` : '!'}
        </h1>
        <p className="text-blue-200 mt-1 text-sm">Continuă să înveți și să progresezi!</p>
      </div>

      {/* Statistici progres */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-700">
            {stats?.completedLessons || 0}/{stats?.totalLessons || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">Lecții finalizate</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-700">{completionPct}%</div>
          <div className="text-xs text-green-600 mt-1">Progres total</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-orange-600">{stats?.passedTests || 0}</div>
          <div className="text-xs text-orange-500 mt-1">Teste promovate</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">{stats?.failedTests || 0}</div>
          <div className="text-xs text-purple-500 mt-1">Teste nepromovate</div>
        </div>
      </div>

      {/* Bară progres */}
      {stats && stats.totalLessons > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Progres general</span>
            <span className="text-aep-600 font-bold">{completionPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-aep-500 to-aep-600 rounded-full transition-all"
              style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acces rapid */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Acces rapid</h2>
          <div className="space-y-2">
            <Link href="/dashboard/courses"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-aep-50 transition-colors group">
              <span className="text-2xl">📚</span>
              <div>
                <div className="font-medium text-gray-800 group-hover:text-aep-700 text-sm">Materiale de instruire</div>
                <div className="text-xs text-gray-400">Accesați lecțiile video și PDF</div>
              </div>
            </Link>
            <Link href="/dashboard/calendar"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-aep-50 transition-colors group">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-medium text-gray-800 group-hover:text-aep-700 text-sm">Calendar instruiri</div>
                <div className="text-xs text-gray-400">Consultați evenimentele din județ</div>
              </div>
            </Link>
            <Link href="/dashboard/progress"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-aep-50 transition-colors group">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-gray-800 group-hover:text-aep-700 text-sm">Progresul meu</div>
                <div className="text-xs text-gray-400">Istoricul lecțiilor și testelor</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Evenimente viitoare */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Instruiri viitoare</h2>
          {(data?.upcomingEvents || []).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nu există instruiri programate în prezent</p>
          ) : (
            <div className="space-y-3">
              {(data?.upcomingEvents || []).slice(0, 4).map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50">
                  <span className="text-lg mt-0.5">📅</span>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 text-sm truncate">{ev.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(ev.startAt).toLocaleDateString('ro', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    {ev.county && <div className="text-xs text-aep-600 mt-0.5">{ev.county.name}</div>}
                  </div>
                </div>
              ))}
              <Link href="/dashboard/calendar" className="text-xs text-aep-600 hover:underline block text-right">
                Vezi toate →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
