'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

interface ProgressItem {
  lessonId: string; lesson: { title: string; module: { title: string; category: { title: string } } }
  watchedPercent: number; status: string; completedAt: string | null
}

interface TestAttempt {
  id: string; test: { title: string }; score: number; maxScore: number; passed: boolean; submittedAt: string
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [activeTab, setActiveTab] = useState<'lessons' | 'tests'>('lessons')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/tests').then(r => r.json()),
    ]).then(([progRes, testRes]) => {
      setProgress(progRes.data?.lessonProgress || [])
      setAttempts(testRes.data?.attempts || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Progresul meu</h1>
      
      <div className="flex gap-2 border-b border-gray-200">
        {(['lessons', 'tests'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500'}`}>
            {t === 'lessons' ? `Lecții (${progress.length})` : `Teste (${attempts.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'lessons' ? (
        <div className="space-y-3">
          {progress.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 text-gray-400">
              Nicio lecție accesată încă. <a href="/dashboard/courses" className="text-aep-600 hover:underline">Accesați materialele</a>
            </div>
          ) : progress.map(p => (
            <div key={p.lessonId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm">{p.lesson.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.lesson.module.category.title} › {p.lesson.module.title}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.status === 'COMPLETED' ? 'Finalizat' : p.status === 'IN_PROGRESS' ? 'În progres' : 'Neînceput'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-aep-500 rounded-full" style={{ width: `${p.watchedPercent}%` }} />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(p.watchedPercent)}%</span>
              </div>
              {p.completedAt && <div className="text-xs text-gray-400 mt-1">Finalizat: {format(new Date(p.completedAt), 'dd MMMM yyyy', { locale: ro })}</div>}
            </div>
          ))}
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
                <div className="text-xs text-gray-400 mt-0.5">{a.submittedAt ? format(new Date(a.submittedAt), 'dd.MM.yyyy HH:mm') : '—'}</div>
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
