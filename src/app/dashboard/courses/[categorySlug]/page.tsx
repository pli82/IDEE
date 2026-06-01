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

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.categorySlug as string
  const [modules, setModules] = useState<Module[]>([])
  const [categoryTitle, setCategoryTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/courses/modules?category=${categorySlug}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setModules(d.data?.modules || [])
        setCategoryTitle(d.data?.category?.title || categorySlug)
      })
      .finally(() => setLoading(false))
  }, [categorySlug])

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/courses" className="hover:text-aep-600">← Categorii</Link>
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
          {modules.map(mod => (
            <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{mod.title}</h2>
                    {mod.description && <p className="text-sm text-gray-500 mt-1">{mod.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-aep-700">{mod.stats.percent}%</div>
                    <div className="text-xs text-gray-400">{mod.stats.completed}/{mod.stats.total} lecții</div>
                  </div>
                </div>
                {mod.stats.total > 0 && (
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aep-500 rounded-full transition-all"
                      style={{ width: `${mod.stats.percent}%` }}
                    />
                  </div>
                )}
              </div>

              {mod.lessons.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {mod.lessons.map((lesson, idx) => {
                    const progress = lesson.progress[0]
                    const isCompleted = progress?.status === 'COMPLETED'
                    const isInProgress = progress?.status === 'IN_PROGRESS'
                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/courses/lesson/${lesson.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          isCompleted ? 'bg-green-100 text-green-700' :
                          isInProgress ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm group-hover:text-aep-700">
                            {lesson.title}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {lesson.videoUrl && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">🎬 Video</span>
                            )}
                            {lesson.pdfUrl && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">📄 Suport curs</span>
                            )}
                            {isInProgress && progress.watchedPercent > 0 && (
                              <span className="text-xs text-blue-500">{Math.round(progress.watchedPercent)}% vizionat</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-aep-400">→</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
