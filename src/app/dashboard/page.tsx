'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  user: { email: string; profile: any }
  stats: { totalLessons: number; completedLessons: number; totalTests: number; passedTests: number; failedTests: number }
  notifications: { id: string; title: string; body: string; createdAt: string }[]
  upcomingEvents: { id: string; title: string; startAt: string; county: any }[]
}

function StatsTimeline({ stats, completionPct }: {
  stats: { totalLessons: number; completedLessons: number; passedTests: number; failedTests: number } | undefined
  completionPct: number
}) {
  const items = [
    {
      value: `${stats?.completedLessons || 0}/${stats?.totalLessons || 0}`,
      icon: '📚',
      color: '#00aaff',
      dotClass: 'td-blue',
      circleClass: 'ic-blue',
      marginBottom: '0px',
      stemHeight: '130px',
      title: 'Lecții finalizate',
      desc: 'Numărul total de lecții parcurse din curriculum',
    },
    {
      value: `${completionPct}%`,
      icon: '📊',
      color: '#00cc6a',
      dotClass: 'td-green',
      circleClass: 'ic-green',
      marginBottom: '50px',
      stemHeight: '80px',
      title: 'Progres total',
      desc: 'Procentul de completare al cursului tău',
    },
    {
      value: String(stats?.passedTests || 0),
      icon: '✅',
      color: '#ff6b00',
      dotClass: 'td-orange',
      circleClass: 'ic-orange',
      marginBottom: '90px',
      stemHeight: '40px',
      title: 'Teste promovate',
      desc: 'Testele finalizate cu succes până acum',
    },
    {
      value: String(stats?.failedTests || 0),
      icon: '❌',
      color: '#f5a800',
      dotClass: 'td-gold',
      circleClass: 'ic-gold',
      marginBottom: '25px',
      stemHeight: '105px',
      title: 'Teste nepromovate',
      desc: 'Testele care necesită o nouă încercare',
    },
  ]

  return (
    <div style={{
      background: '#f0f4f8',
      borderRadius: '16px',
      padding: '2rem 1rem 1.5rem',
      overflow: 'hidden',
    }}>
      {/* Bubbles row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 0,
        position: 'relative',
        height: '260px',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '155px', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: item.marginBottom }}>
              {/* Outer ring */}
              <div style={{
                width: '130px', height: '130px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.55)',
                border: '2px solid rgba(200,210,225,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '4px 4px 12px rgba(0,0,0,0.13), -2px -2px 8px rgba(255,255,255,0.8)',
              }}>
                {/* Inner circle */}
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: item.color,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '-4px -4px 8px rgba(255,255,255,0.7), 4px 4px 10px rgba(0,0,0,0.28), inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '22px', marginBottom: '2px' }}>{item.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0d2e52', lineHeight: 1 }}>{item.value}</span>
                </div>
              </div>
              {/* Stem */}
              <div style={{
                width: '3px',
                height: item.stemHeight,
                background: 'linear-gradient(to bottom, #b0bec5, #90a4ae)',
                flexShrink: 0,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Track row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '28px' }}>
        {/* Track line */}
        <div style={{
          height: '6px',
          background: 'linear-gradient(to right, #cfd8dc, #b0bec5)',
          borderRadius: '3px',
          width: '620px',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 -1px 2px rgba(255,255,255,0.6)',
        }} />
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, width: '620px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ width: '155px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: item.color,
                border: '3px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                zIndex: 2,
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Labels row */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ width: '155px', textAlign: 'center', padding: '0 6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0d2e52', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '11px', color: '#4a6080', lineHeight: 1.4 }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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

      {/* Infografic statistici */}
      <StatsTimeline stats={stats} completionPct={completionPct} />

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
