'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

interface ModuleStats {
  totalVideos: number; completedVideos: number; videoComplete: boolean
  totalMaterials: number; viewedMaterials: number; materialsComplete: boolean
  hasTests: boolean; testPassed: boolean
  components: number; completedComponents: number; percent: number
}
interface ModuleProgress {
  id: string; title: string
  category: { id: string; title: string; slug: string }
  stats: ModuleStats
}
interface CategoryProgress {
  id: string; title: string; slug: string
  modules: ModuleProgress[]
  totalModules: number; completedModules: number; percent: number
}
interface TestAttempt {
  id: string; test: { title: string }; score: number; maxScore: number; passed: boolean; submittedAt: string
}

export default function ProgressPage() {
  const [modules, setModules] = useState<ModuleProgress[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [activeTab, setActiveTab] = useState<'categories' | 'tests'>('categories')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/progress/modules', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/tests', { credentials: 'include' }).then(r => r.json()),
    ]).then(([modRes, testRes]) => {
      const mods = modRes.data?.modules || []
      setModules(mods)
      setAttempts(testRes.data?.attempts || [])
      const cats = groupByCategory(mods)
      const initial: Record<string, boolean> = {}
      cats.forEach((c, i) => { initial[c.id] = i === 0 })
      setExpanded(initial)
    }).finally(() => setLoading(false))
  }, [])

  const groupByCategory = (mods: ModuleProgress[]): CategoryProgress[] => {
    const map: Record<string, CategoryProgress> = {}
    mods.forEach(mod => {
      const cat = mod.category
      if (!map[cat.id]) {
        map[cat.id] = { id: cat.id, title: cat.title, slug: cat.slug, modules: [], totalModules: 0, completedModules: 0, percent: 0 }
      }
      map[cat.id].modules.push(mod)
    })
    return Object.values(map).map(cat => {
      const total = cat.modules.filter(m => m.stats.components > 0).length
      const completed = cat.modules.filter(m => m.stats.percent === 100).length
      return { ...cat, totalModules: total, completedModules: completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
    })
  }

  const categories = groupByCategory(modules)
  const startedCategories = categories.filter(c => c.modules.some(m => m.stats.completedComponents > 0 || m.stats.viewedMaterials > 0))

  const toggleCategory = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progresul meu</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {(['categories', 'tests'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500'}`}>
            {t === 'categories' ? `Categorii (${startedCategories.length})` : `Teste (${attempts.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'categories' ? (
        <div className="space-y-4">
          {startedCategories.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-gray-400">
              Niciun modul accesat încă. <Link href="/dashboard/courses" className="text-aep-600 hover:underline">Accesați materialele</Link>
            </div>
          ) : startedCategories.map(cat => {
            const isOpen = expanded[cat.id] ?? false
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => toggleCategory(cat.id)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <i className={`ti ${isOpen ? 'ti-chevron-down' : 'ti-chevron-right'} transition-transform`}
                        aria-hidden="true" style={{ fontSize: '15px', color: '#6b7280', flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{cat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.completedModules} din {cat.totalModules} module completate</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${cat.percent === 100 ? 'text-green-600' : 'text-aep-700'}`}>
                      {cat.percent}%
                    </span>
                  </div>
                  <div className="mt-2 ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${cat.percent === 100 ? 'bg-green-500' : 'bg-aep-500'}`}
                      style={{ width: `${cat.percent}%` }} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {cat.modules.map(mod => {
                      const { stats } = mod
                      const hasProgress = stats.completedComponents > 0 || stats.viewedMaterials > 0
                      return (
                        <Link
                          key={mod.id}
                          href={`/dashboard/courses/${cat.slug}`}
                          className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${hasProgress ? '' : 'opacity-50'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{mod.title}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {stats.totalVideos > 0 && (
                                <span className={`text-xs flex items-center gap-0.5 ${stats.videoComplete ? 'text-green-600' : 'text-gray-400'}`}>
                                  <i className="ti ti-player-play" aria-hidden="true" style={{ fontSize: '11px' }} />
                                  {stats.completedVideos}/{stats.totalVideos} video{stats.videoComplete ? ' ✓' : ''}
                                </span>
                              )}
                              {stats.totalMaterials > 0 && (
                                <span className={`text-xs flex items-center gap-0.5 ${stats.materialsComplete ? 'text-green-600' : 'text-gray-400'}`}>
                                  <i className="ti ti-files" aria-hidden="true" style={{ fontSize: '11px' }} />
                                  {stats.viewedMaterials}/{stats.totalMaterials} materiale{stats.materialsComplete ? ' ✓' : ''}
                                </span>
                              )}
                              {stats.hasTests && (
                                <span className={`text-xs flex items-center gap-0.5 ${stats.testPassed ? 'text-green-600' : 'text-gray-400'}`}>
                                  <i className="ti ti-clipboard-check" aria-hidden="true" style={{ fontSize: '11px' }} />
                                  {stats.testPassed ? 'Test promovat ✓' : 'Test nesusținut'}
                                </span>
                              )}
                              {stats.components === 0 && (
                                <span className="text-xs text-gray-400">Fără conținut</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className={`text-xs font-bold ${stats.percent === 100 ? 'text-green-600' : stats.completedComponents > 0 ? 'text-aep-700' : 'text-gray-400'}`}>
                              {stats.completedComponents}/{stats.components}
                            </span>
                            {stats.components > 0 && (
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                <div className={`h-full rounded-full ${stats.percent === 100 ? 'bg-green-500' : 'bg-aep-500'}`}
                                  style={{ width: `${stats.percent}%` }} />
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-gray-400">
              Niciun test susținut încă.
            </div>
          ) : attempts.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">{a.test.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {a.submittedAt ? format(new Date(a.submittedAt), 'dd.MM.yyyy HH:mm') : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: a.passed ? '#16a34a' : '#dc2626' }}>
                  {a.score}/{a.maxScore}
                </div>
                <span className={`text-xs font-medium ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
                  {a.passed ? '✓ Promovat' : '✗ Nepromovat'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
