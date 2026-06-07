'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Notification {
  id: string; title: string; body: string; type: string; createdAt: string; readAt?: string | null
}

interface DashboardData {
  user: { email: string; profile: any }
  stats: { totalLessons: number; completedLessons: number; totalTests: number; passedTests: number; failedTests: number }
  notifications: Notification[]
  upcomingEvents: { id: string; title: string; startAt: string; county: any }[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `acum ${mins} min`
  if (hours < 24) return `acum ${hours} ${hours === 1 ? 'oră' : 'ore'}`
  if (days === 1) return 'ieri'
  return `${days} zile`
}

function AnnouncementCard({ notif }: { notif: Notification }) {
  const config = {
    ERROR: {
      label: 'Urgent',
      icon: 'ti-alert-triangle',
      bg: 'radial-gradient(ellipse at 25% 25%, #fdf0f0, #f9d8d8 60%, #f5c8c8)',
      border: '#e8b0b0',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(180,80,80,0.15), inset 2px 0 4px rgba(255,255,255,0.6), inset -2px 0 4px rgba(180,80,80,0.1), 0 2px 6px rgba(180,80,80,0.12)',
      iconBg: 'radial-gradient(ellipse at 35% 30%, #fde8e8, #f5a0a0)',
      iconBorder: '#e88888',
    },
    WARNING: {
      label: 'Reamintire',
      icon: 'ti-clock',
      bg: 'radial-gradient(ellipse at 25% 25%, #fefbf0, #faf0d0 60%, #f5e8b8)',
      border: '#e8d080',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.85), inset 0 -2px 4px rgba(160,120,0,0.12), inset 2px 0 4px rgba(255,255,255,0.65), inset -2px 0 4px rgba(160,120,0,0.08), 0 2px 6px rgba(160,120,0,0.1)',
      iconBg: 'radial-gradient(ellipse at 35% 30%, #fef5d0, #f8d880)',
      iconBorder: '#e0b840',
    },
    INFO: {
      label: 'Informare',
      icon: 'ti-info-circle',
      bg: 'radial-gradient(ellipse at 25% 25%, #f0f7fe, #d8eaf9 60%, #c8e0f7)',
      border: '#a8cef0',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(40,100,180,0.12), inset 2px 0 4px rgba(255,255,255,0.6), inset -2px 0 4px rgba(40,100,180,0.08), 0 2px 6px rgba(40,100,180,0.1)',
      iconBg: 'radial-gradient(ellipse at 35% 30%, #e8f4fe, #a8d0f5)',
      iconBorder: '#80b8e8',
    },
    SUCCESS: {
      label: 'Informare',
      icon: 'ti-info-circle',
      bg: 'radial-gradient(ellipse at 25% 25%, #f0f7fe, #d8eaf9 60%, #c8e0f7)',
      border: '#a8cef0',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(40,100,180,0.12), inset 2px 0 4px rgba(255,255,255,0.6), inset -2px 0 4px rgba(40,100,180,0.08), 0 2px 6px rgba(40,100,180,0.1)',
      iconBg: 'radial-gradient(ellipse at 35% 30%, #e8f4fe, #a8d0f5)',
      iconBorder: '#80b8e8',
    },
  }

  const c = config[notif.type as keyof typeof config] || config.INFO

  return (
    <div style={{
      borderRadius: '10px',
      padding: '12px 14px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      boxShadow: c.boxShadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: c.iconBg,
          border: `1px solid ${c.iconBorder}`,
          boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className={`ti ${c.icon}`} aria-hidden="true" style={{ fontSize: '14px', color: '#0C447C' }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#042C53', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {c.label}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#185FA5' }}>
          {timeAgo(notif.createdAt)}
        </span>
      </div>
      <p style={{ fontSize: '13px', fontWeight: 500, color: '#042C53', margin: '0 0 2px' }}>{notif.title}</p>
      <p style={{ fontSize: '12px', color: '#185FA5', margin: 0 }}>{notif.body}</p>
    </div>
  )
}

function StatsTimeline({ stats, completionPct }: {
  stats: { totalLessons: number; completedLessons: number; passedTests: number; failedTests: number } | undefined
  completionPct: number
}) {
  const items = [
    {
      value: `${stats?.completedLessons || 0}/${stats?.totalLessons || 0}`,
      icon: 'ti-book',
      outerStyle: { background: 'linear-gradient(145deg, #e8f4fd, #b8d9f5)', border: '1.5px solid #8fc8f0', boxShadow: '5px 7px 16px rgba(0,80,160,0.18), -3px -3px 10px rgba(255,255,255,0.95)' },
      innerStyle: { background: 'linear-gradient(145deg, #5aaae0, #1a7cc0)', boxShadow: 'inset -3px -3px 8px rgba(0,50,120,0.3), inset 2px 2px 6px rgba(255,255,255,0.35), 2px 4px 8px rgba(0,80,160,0.22)' },
      dotStyle: { background: 'linear-gradient(145deg, #5aaae0, #1a7cc0)' },
      stemHeight: '40px', title: 'Lecții finalizate', desc: 'Numărul total de lecții parcurse',
    },
    {
      value: `${completionPct}%`,
      icon: 'ti-chart-bar',
      outerStyle: { background: 'linear-gradient(145deg, #fef9e7, #fde9a0)', border: '1.5px solid #fbd660', boxShadow: '5px 7px 16px rgba(180,130,0,0.15), -3px -3px 10px rgba(255,255,255,0.95)' },
      innerStyle: { background: 'linear-gradient(145deg, #fde060, #d4a000)', boxShadow: 'inset -3px -3px 8px rgba(150,90,0,0.25), inset 2px 2px 6px rgba(255,255,255,0.5), 2px 4px 8px rgba(180,130,0,0.22)' },
      dotStyle: { background: 'linear-gradient(145deg, #fde060, #d4a000)' },
      stemHeight: '80px', title: 'Progres total', desc: 'Procentul de completare al cursului',
    },
    {
      value: String(stats?.passedTests || 0),
      icon: 'ti-circle-check',
      outerStyle: { background: 'linear-gradient(145deg, #eaf6ec, #b8e5bf)', border: '1.5px solid #8ed49a', boxShadow: '5px 7px 16px rgba(0,120,40,0.15), -3px -3px 10px rgba(255,255,255,0.95)' },
      innerStyle: { background: 'linear-gradient(145deg, #5ec885, #1a9a50)', boxShadow: 'inset -3px -3px 8px rgba(0,80,30,0.3), inset 2px 2px 6px rgba(255,255,255,0.35), 2px 4px 8px rgba(0,120,40,0.22)' },
      dotStyle: { background: 'linear-gradient(145deg, #5ec885, #1a9a50)' },
      stemHeight: '120px', title: 'Teste promovate', desc: 'Testele finalizate cu succes',
    },
    {
      value: String(stats?.failedTests || 0),
      icon: 'ti-circle-x',
      outerStyle: { background: 'linear-gradient(145deg, #fdecea, #f9bfba)', border: '1.5px solid #f49090', boxShadow: '5px 7px 16px rgba(180,40,30,0.15), -3px -3px 10px rgba(255,255,255,0.95)' },
      innerStyle: { background: 'linear-gradient(145deg, #f07070, #c02020)', boxShadow: 'inset -3px -3px 8px rgba(130,20,20,0.3), inset 2px 2px 6px rgba(255,255,255,0.35), 2px 4px 8px rgba(180,30,30,0.22)' },
      dotStyle: { background: 'linear-gradient(145deg, #f07070, #c02020)' },
      stemHeight: '160px', title: 'Teste nepromovate', desc: 'Testele care necesită o nouă încercare',
    },
  ]

  return (
    <div style={{ background: '#f4f7fa', borderRadius: '16px', padding: '2rem 1.5rem 1.5rem', border: '1px solid #dde4ec' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '300px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '155px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', ...item.outerStyle }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', ...item.innerStyle }}>
                  <i className={`ti ${item.icon}`} aria-hidden="true" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.95)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{item.value}</span>
                </div>
              </div>
              <div style={{ width: '3px', height: item.stemHeight, background: 'linear-gradient(to bottom, #c8d8e8, #a0b8cc)', flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '28px' }}>
        <div style={{ height: '7px', background: 'linear-gradient(to right, #dde8f2, #b0c8dc)', borderRadius: '4px', width: '620px', position: 'absolute', top: '50%', transform: 'translateY(-50%)', boxShadow: '0 3px 5px rgba(0,0,0,0.1), inset 0 1px 3px rgba(255,255,255,0.8)' }} />
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, width: '620px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ width: '155px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '3px solid #f4f7fa', boxShadow: '2px 3px 6px rgba(0,0,0,0.16)', zIndex: 2, ...item.dotStyle }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ width: '155px', textAlign: 'center', padding: '0 6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.title}</div>
            <div style={{ fontSize: '11px', color: '#5a7a9a', lineHeight: 1.4 }}>{item.desc}</div>
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
      fetch('/api/notifications', { credentials: 'include' }).then(r => r.json()),
    ]).then(([profileRes, progressRes, eventsRes, notifRes]) => {
      setData({
        user: profileRes.data,
        stats: progressRes.data || {},
        notifications: notifRes.data || [],
        upcomingEvents: eventsRes.data || [],
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aep-600" />
    </div>
  )

  const profile = data?.user?.profile
  const stats = data?.stats
  const notifications = data?.notifications || []
  const completionPct = stats && stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0

  const unreadCount = notifications.filter(n => !n.readAt).length

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
        {/* Anunțuri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
            <i className="ti ti-speakerphone" aria-hidden="true" style={{ fontSize: '18px', color: '#0C447C' }} />
            <span className="font-semibold text-gray-900 text-sm">Anunțuri și informări</span>
            {unreadCount > 0 && (
              <span className="ml-auto text-xs bg-blue-50 text-aep-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                {unreadCount} noi
              </span>
            )}
          </div>
          <div className="p-3 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Nu există anunțuri momentan</p>
            ) : (
              notifications.slice(0, 3).map(n => (
                <AnnouncementCard key={n.id} notif={n} />
              ))
            )}
          </div>
          {notifications.length > 3 && (
            <div className="px-5 pb-3 text-right">
              <Link href="/dashboard/notifications" className="text-xs text-aep-600 hover:underline">
                Vezi toate anunțurile →
              </Link>
            </div>
          )}
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
