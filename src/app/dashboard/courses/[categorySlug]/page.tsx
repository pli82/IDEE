'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Lesson {
  id: string
  title: string
  description?: string
  videoUrl?: string
  pdfUrl?: string
  order: number
  progress: { status: string; watchedPercent: number }[]
}

interface Module {
  id: string
  title: string
  description?: string
  lessons: Lesson[]
  stats: { total: number; completed: number; percent: number }
}

function StatusCircle({ status, watchedPercent, index }: { status: string; watchedPercent: number; index: number }) {
  if (status === 'COMPLETED') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'IN_PROGRESS') {
    const radius = 12
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (watchedPercent / 100) * circumference
    return (
      <div className="w-8 h-8 shrink-0 relative flex items-center justify-center">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="16" cy="16" r={radius} fill="none" stroke="#3b82f6" strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" />
        </svg>
        <span className="absolute text-[9px] font-bold text-blue-600">{Math.round(watchedPercent)}%</span>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 bg-white">
      <span className="text-xs font-medium text-gray-400">{index + 1}</span>
    </div>
  )
}

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.categorySlug as string
  const [modules, setModules] = useState<Module[]>([])
  const [categoryTitle, setCategoryTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/courses/modules?category=${categorySlug}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const mods = d.data?.modules || []
        setModules(mods)
        setCategoryTitle(d.data?.category?.title || categorySlug)
        // primul modul expandat implicit, restul colapsate
        const initial: Record<string, boolean> = {}
        mods.forEach((m: Module, i: number) => { initial[m.id] = i === 0 })
        setExpanded(initial)
      })
      .finally(() => setLoading(false))
  }, [categorySlug])

  const toggleModule = (id: string) => {
    setExpanded(p => ({ ...p, [id]: !p[id] }))
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/courses"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-aep-600 transition-colors">
          ← Înapoi la materiale
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{categoryTitle}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{categoryTitle}</h1>

      {modules.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">Nu există module disponibile în această categorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map(mod => {
            const isOpen = expanded[mod.id] ?? false
            return (
              <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header modul — clickabil pentru expand/collapse */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Săgeată expand/collapse */}
                      <div className={`shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-gray-900 text-lg leading-tight">{mod.title}</h2>
                        {mod.description && <p className="text-sm text-gray-500 mt-1">{mod.description}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${mod.stats.percent === 100 ? 'text-green-600' : 'text-aep-700'}`}>
                        {mod.stats.percent}%
                      </div>
                      <div className="text-xs text-gray-400">{mod.stats.completed}/{mod.stats.total} lecții</div>
                    </div>
                  </div>
                  {mod.stats.total > 0 && (
                    <div className="mt-3 ml-9 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${mod.stats.percent === 100 ? 'bg-green-500' : 'bg-aep-500'}`}
                        style={{ width: `${mod.stats.percent}%` }}
                      />
                    </div>
                  )}
                </button>

                {/* Lista lecții — vizibilă doar când e expandat */}
                {isOpen && mod.lessons.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {mod.lessons.map((lesson, idx) => {
                      const progress = lesson.progress[0]
                      const status = progress?.status || 'NOT_STARTED'
                      const watchedPercent = progress?.watchedPercent || 0
                      const isCompleted = status === 'COMPLETED'
                      const isInProgress = status === 'IN_PROGRESS'

                      return (
                        <Link
                          key={lesson.id}
                          href={`/dashboard/courses/lesson/${lesson.id}`}
                          className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${isCompleted ? 'bg-green-50/30' : ''}`}
                        >
                          <StatusCircle status={status} watchedPercent={watchedPercent} index={idx} />

                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm group-hover:text-aep-700 ${isCompleted ? 'text-gray-600' : 'text-gray-900'}`}>
                              {lesson.title}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {lesson.videoUrl && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <span>▶</span> Video
                                </span>
                              )}
                              {lesson.pdfUrl && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <span>📄</span> Suport curs
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                  ✓ Completat
                                </span>
                              )}
                              {isInProgress && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  ⏳ În curs — {Math.round(watchedPercent)}% vizionat
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                            isCompleted
                              ? 'bg-green-100 text-green-700 group-hover:bg-green-200'
                              : isInProgress
                              ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                              : 'bg-aep-600 text-white group-hover:bg-aep-700'
                          }`}>
                            {isCompleted ? 'Revizuiește' : isInProgress ? 'Continuă' : 'Start'}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Mesaj când e collapsat */}
                {!isOpen && mod.lessons.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-2.5">
                    <span className="text-xs text-gray-400">{mod.lessons.length} {mod.lessons.length === 1 ? 'lecție' : 'lecții'}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
