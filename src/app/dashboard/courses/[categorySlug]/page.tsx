'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface MaterialProgress { id: string; viewedAt: string }
interface Material { id: string; title: string; url: string; type: string; order: number; progress: MaterialProgress[] }
interface Lesson {
  id: string; title: string; description?: string; videoUrl?: string; pdfUrl?: string; order: number
  progress: { status: string; watchedPercent: number }[]
}
interface TestAttempt { passed: boolean; score: number; maxScore: number; submittedAt: string }
interface Test { id: string; title: string; questionsPerAttempt: number; passingScore: number; attempts: TestAttempt[] }
interface ModuleStats {
  totalVideos: number; completedVideos: number; videoComplete: boolean
  totalMaterials: number; viewedMaterials: number; materialsComplete: boolean
  hasTests: boolean; testPassed: boolean
  components: number; completedComponents: number; percent: number
  total: number; completed: number
}
interface Module {
  id: string; title: string; description?: string
  lessons: Lesson[]
  materials: Material[]
  tests: Test[]
  stats: ModuleStats
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
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
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

function MaterialsDrawer({ materials, moduleId, onViewed }: {
  materials: Material[]
  moduleId: string
  onViewed: (materialId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const viewed = materials.filter(m => m.progress.length > 0).length
  const total = materials.length

  const handleView = async (material: Material) => {
    if (material.progress.length === 0) {
      await fetch(`/api/courses/materials/${material.id}/progress`, {
        method: 'POST', credentials: 'include',
      })
      onViewed(material.id)
    }
    window.open(material.url, '_blank')
  }

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className="ti ti-files" aria-hidden="true" style={{ fontSize: '18px', color: '#004B87' }} />
          <span className="text-sm font-medium text-gray-900">Materiale instruire</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            viewed === total ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-aep-700'
          }`}>
            {viewed}/{total} vizualizate
          </span>
        </div>
        <i className={`ti ti-chevron-down transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true" style={{ fontSize: '16px', color: '#6b7280' }} />
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {materials.map(material => {
            const isViewed = material.progress.length > 0
            return (
              <div key={material.id} className={`flex items-center justify-between px-5 py-3 ${isViewed ? 'bg-green-50/40' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <i className={`ti ${material.type === 'PDF' ? 'ti-file-type-pdf' : 'ti-file-type-ppt'}`}
                    aria-hidden="true" style={{ fontSize: '18px', color: isViewed ? '#16a34a' : '#9ca3af', flexShrink: 0 }} />
                  <span className="text-sm text-gray-800 truncate">{material.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isViewed && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Vizualizat
                    </span>
                  )}
                  <button
                    onClick={() => handleView(material)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isViewed
                        ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'bg-aep-600 text-white hover:bg-aep-700'
                    }`}>
                    <i className="ti ti-eye" aria-hidden="true" style={{ fontSize: '13px', marginRight: '4px' }} />
                    {isViewed ? 'Redeschide' : 'Vizualizează'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TestRow({ test }: { test: Test }) {
  const lastAttempt = test.attempts[0]
  const passed = lastAttempt?.passed
  const attempted = !!lastAttempt

  return (
    <div className="border-t-2 border-gray-100 flex items-center gap-4 px-5 py-3.5 bg-white">
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
        passed ? 'bg-green-500 border-green-500' : attempted ? 'bg-red-100 border-red-300' : 'border-gray-200 bg-white'
      }`}>
        {passed ? (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <i className="ti ti-clipboard-check" aria-hidden="true" style={{ fontSize: '13px', color: attempted ? '#ef4444' : '#9ca3af' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{test.title}</div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{test.questionsPerAttempt} întrebări · prag {test.passingScore}/{test.questionsPerAttempt}</span>
          {passed && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Promovat</span>
          )}
          {attempted && !passed && (
            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">✗ Nepromovat</span>
          )}
          {!attempted && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Nesusținut</span>
          )}
        </div>
      </div>
      <Link
        href={`/dashboard/courses/lesson/${test.id}`}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
          passed
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-aep-600 text-white hover:bg-aep-700'
        }`}
      >
        {passed ? 'Reia testul' : attempted ? '↺ Reia testul' : '▶ Start test'}
      </Link>
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
        const initial: Record<string, boolean> = {}
        mods.forEach((m: Module, i: number) => { initial[m.id] = i === 0 })
        setExpanded(initial)
      })
      .finally(() => setLoading(false))
  }, [categorySlug])

  const toggleModule = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const handleMaterialViewed = (moduleId: string, materialId: string) => {
    setModules(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod
      const updatedMaterials = mod.materials.map(m =>
        m.id === materialId && m.progress.length === 0
          ? { ...m, progress: [{ id: 'local', viewedAt: new Date().toISOString() }] }
          : m
      )
      const viewedMaterials = updatedMaterials.filter(m => m.progress.length > 0).length
      const totalMaterials = updatedMaterials.length
      const materialsComplete = totalMaterials > 0 && viewedMaterials === totalMaterials
      const newStats = {
        ...mod.stats,
        viewedMaterials,
        materialsComplete,
        completedComponents: mod.stats.completedComponents + (materialsComplete && !mod.stats.materialsComplete ? 1 : 0),
        percent: Math.round(
          ((mod.stats.completedComponents + (materialsComplete && !mod.stats.materialsComplete ? 1 : 0)) / mod.stats.components) * 100
        ),
      }
      return { ...mod, materials: updatedMaterials, stats: newStats }
    }))
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
            const { stats } = mod
            const hasVideos = stats.totalVideos > 0
            const hasMaterials = stats.totalMaterials > 0
            const hasTests = mod.tests && mod.tests.length > 0

            return (
              <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header modul */}
                <button onClick={() => toggleModule(mod.id)} className="w-full text-left p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      <div className={`text-sm font-bold ${stats.percent === 100 ? 'text-green-600' : 'text-aep-700'}`}>
                        {stats.completedComponents}/{stats.components}
                      </div>
                      <div className="text-xs text-gray-400">completat</div>
                    </div>
                  </div>

                  {stats.components > 0 && (
                    <div className="mt-3 ml-9 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stats.percent === 100 ? 'bg-green-500' : 'bg-aep-500'}`}
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>
                  )}

                  {!isOpen && (
                    <div className="flex items-center gap-4 mt-3 ml-9">
                      {hasVideos && (
                        <span className={`text-xs flex items-center gap-1 ${stats.videoComplete ? 'text-green-600' : 'text-gray-400'}`}>
                          <i className="ti ti-player-play" aria-hidden="true" style={{ fontSize: '12px' }} />
                          {stats.completedVideos}/{stats.totalVideos} video
                        </span>
                      )}
                      {hasMaterials && (
                        <span className={`text-xs flex items-center gap-1 ${stats.materialsComplete ? 'text-green-600' : 'text-gray-400'}`}>
                          <i className="ti ti-files" aria-hidden="true" style={{ fontSize: '12px' }} />
                          {stats.viewedMaterials}/{stats.totalMaterials} materiale
                        </span>
                      )}
                      {hasTests && (
                        <span className={`text-xs flex items-center gap-1 ${stats.testPassed ? 'text-green-600' : 'text-gray-400'}`}>
                          <i className="ti ti-clipboard-check" aria-hidden="true" style={{ fontSize: '12px' }} />
                          {stats.testPassed ? 'Test promovat' : 'Test nesusținut'}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Lecții video */}
                {isOpen && mod.lessons.filter(l => l.videoUrl).length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {mod.lessons.filter(l => l.videoUrl).map((lesson, idx) => {
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
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <i className="ti ti-player-play" aria-hidden="true" style={{ fontSize: '11px' }} /> Video
                              </span>
                              {isCompleted && (
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Completat</span>
                              )}
                              {isInProgress && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  ⏳ În curs — {Math.round(watchedPercent)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                            isCompleted ? 'bg-green-100 text-green-700 group-hover:bg-green-200' :
                            isInProgress ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200' :
                            'bg-aep-600 text-white group-hover:bg-aep-700'
                          }`}>
                            {isCompleted ? 'Revizuiește' : isInProgress ? 'Continuă' : 'Start'}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Materiale instruire */}
                {isOpen && mod.materials.length > 0 && (
                  <MaterialsDrawer
                    materials={mod.materials}
                    moduleId={mod.id}
                    onViewed={(materialId) => handleMaterialViewed(mod.id, materialId)}
                  />
                )}

                {/* Teste */}
                {isOpen && hasTests && mod.tests.map(test => (
                  <TestRow key={test.id} test={test} />
                ))}

                {/* Collapsed summary */}
                {!isOpen && (
                  <div className="border-t border-gray-100 px-5 py-2.5">
                    <span className="text-xs text-gray-400">
                      {mod.lessons.filter(l => l.videoUrl).length} lecții video
                      {mod.materials.length > 0 ? ` · ${mod.materials.length} materiale` : ''}
                      {hasTests ? ` · ${mod.tests.length} ${mod.tests.length === 1 ? 'test' : 'teste'}` : ''}
                    </span>
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
