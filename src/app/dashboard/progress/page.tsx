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
interface TestAttempt {
  id: string; test: { title: string }; score: number; maxScore: number; passed: boolean; submittedAt: string
}

export default function ProgressPage() {
  const [modules, setModules] = useState<ModuleProgress[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [activeTab, setActiveTab] = useState<'modules' | 'tests'>('modules')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/progress/modules', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/tests', { credentials: 'include' }).then(r => r.json()),
    ]).then(([modRes, testRes]) => {
      setModules(modRes.data?.modules || [])
      setAttempts(testRes.data?.attempts || [])
    }).finally(() => setLoading(false))
  }, [])

  const startedModules = modules.filter(m => m.stats.completedComponents > 0 || m.stats.viewedMaterials > 0)

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progresul meu</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {(['modules', 'tests'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500'}`}>
            {t === 'modules' ? `Module (${startedModules.length})` : `Teste (${attempts.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'modules' ? (
        <div className="space-y-3">
          {startedModules.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-gray-400">
              Niciun modul accesat încă. <Link href="/dashboard/courses" className="text-aep-600 hover:underline">Accesați materialele</Link>
            </div>
          ) : startedModules.map(mod => {
            const { stats } = mod
            return (
              <Link
                key={mod.id}
                href={`/dashboard/courses/${mod.category.slug}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-aep-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm">{mod.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{mod.category.title}</div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${stats.percent === 100 ? 'text-green-600' : 'text-aep-700'}`}>
                    {stats.completedComponents}/{stats.components}
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${stats.percent === 100 ? 'bg-green-500' : 'bg-aep-500'}`}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {stats.totalVideos > 0 && (
                    <span className={`text-xs flex items-center gap-1 ${stats.videoComplete ? 'text-green-600' : 'text-gray-400'}`}>
                      <i className="ti ti-player-play" aria-hidden="true" style={{ fontSize: '12px' }} />
                      {stats.completedVideos}/{stats.totalVideos} video
                      {stats.videoComplete && ' ✓'}
                    </span>
                  )}
                  {stats.totalMaterials > 0 && (
                    <span className={`text-xs flex items-center gap-1 ${stats.materialsComplete ? 'text-green-600' : 'text-gray-400'}`}>
                      <i className="ti ti-files" aria-hidden="true" style={{ fontSize: '12px' }} />
                      {stats.viewedMaterials}/{stats.totalMaterials} materiale
                      {stats.materialsComplete && ' ✓'}
                    </span>
                  )}
                  {stats.hasTests && (
                    <span className={`text-xs flex items-center gap-1 ${stats.testPassed ? 'text-green-600' : 'text-gray-400'}`}>
                      <i className="ti ti-clipboard-check" aria-hidden="true" style={{ fontSize: '12px' }} />
                      {stats.testPassed ? 'Test promovat ✓' : 'Test nesusținut'}
                    </span>
                  )}
                </div>
              </Link>
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
