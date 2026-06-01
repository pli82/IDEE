'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Lesson {
  id: string
  title: string
  description?: string
  videoUrl?: string
  pdfUrl?: string
  moduleId: string
  module: { title: string; category: { title: string; slug: string }; lessons: { id: string; title: string; order: number }[] }
  minWatchPercentForTest: number
  progress?: { status: string; watchedPercent: number }[]
}

export default function LessonPage() {
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video')
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('NOT_STARTED')
  const [watchedPercent, setWatchedPercent] = useState(0)
  const [saving, setSaving] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const videoStarted = useRef(false)

  useEffect(() => {
    fetch(`/api/courses/lessons/${lessonId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setLesson(d.data)
        const prog = d.data?.progress?.[0]
        if (prog) {
          setStatus(prog.status)
          setWatchedPercent(prog.watchedPercent || 0)
        }
        if (!d.data?.videoUrl && d.data?.pdfUrl) setActiveTab('pdf')
      })
      .finally(() => setLoading(false))
    return () => { if (progressInterval.current) clearInterval(progressInterval.current) }
  }, [lessonId])

  // Simulează progres când utilizatorul e pe tab video
  // (YouTube iframe nu permite tracking real fără YouTube API)
  useEffect(() => {
    if (activeTab !== 'video' || status === 'COMPLETED') return
    if (!lesson?.videoUrl) return

    // Marchează ca IN_PROGRESS după 3 secunde pe pagina video
    const startTimer = setTimeout(() => {
      if (status === 'NOT_STARTED') {
        updateProgress('IN_PROGRESS', watchedPercent)
        setStatus('IN_PROGRESS')
      }
      videoStarted.current = true
    }, 3000)

    return () => clearTimeout(startTimer)
  }, [activeTab, lesson])

  const updateProgress = async (newStatus: string, percent: number) => {
    setSaving(true)
    try {
      await fetch(`/api/courses/lessons/${lessonId}/progress`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, watchedPercent: percent }),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const markCompleted = async () => {
    setStatus('COMPLETED')
    setWatchedPercent(100)
    await updateProgress('COMPLETED', 100)
  }

  const embedUrl = lesson?.videoUrl?.includes('youtube.com/watch')
    ? lesson.videoUrl.replace('watch?v=', 'embed/')
    : lesson?.videoUrl?.includes('youtu.be/')
    ? lesson.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
    : lesson?.videoUrl

  // Lecțiile din același modul pentru navigare
  const moduleLessons = lesson?.module?.lessons || []
  const currentIndex = moduleLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  if (!lesson) return (
    <div className="text-center py-12 text-gray-400">Lecția nu a fost găsită.</div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href="/dashboard/courses" className="hover:text-aep-600">Materiale</Link>
        <span>/</span>
        <Link href={`/dashboard/courses/${lesson.module.category.slug}`} className="hover:text-aep-600">
          {lesson.module.category.title}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{lesson.title}</span>
      </div>

      {/* Header lecție cu status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.description && <p className="text-gray-500 mt-1">{lesson.description}</p>}
        </div>
        <div className="shrink-0">
          {status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Completat
            </span>
          ) : status === 'IN_PROGRESS' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              În curs
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
              Neînceput
            </span>
          )}
        </div>
      </div>

      {/* Progress bar vizionare */}
      {status !== 'NOT_STARTED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progres vizionare</span>
            <span className="text-sm font-bold text-aep-700">{Math.round(watchedPercent)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-aep-500'}`}
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
          {status === 'COMPLETED' && (
            <p className="text-xs text-green-600 mt-2 font-medium">✓ Lecție finalizată</p>
          )}
        </div>
      )}

      {/* Tab-uri Video / PDF */}
      {(lesson.videoUrl || lesson.pdfUrl) && (
        <div>
          <div className="flex gap-2 border-b border-gray-200 mb-4">
            {lesson.videoUrl && (
              <button onClick={() => setActiveTab('video')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'video' ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                🎬 Video
              </button>
            )}
            {lesson.pdfUrl && (
              <button onClick={() => setActiveTab('pdf')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'pdf' ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                📄 Suport de curs
              </button>
            )}
          </div>

          {activeTab === 'video' && lesson.videoUrl && (
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {activeTab === 'pdf' && lesson.pdfUrl && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">📄 Suport de curs</span>
                <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-aep-600 hover:underline">
                  Deschide în tab nou ↗
                </a>
              </div>
              <iframe src={lesson.pdfUrl} className="w-full" style={{ height: '70vh' }} title="Suport de curs" />
            </div>
          )}
        </div>
      )}

      {/* Buton Marchează ca finalizat */}
      {status !== 'COMPLETED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Ai terminat această lecție?</p>
            <p className="text-xs text-gray-400 mt-0.5">Marchează ca finalizată pentru a urmări progresul tău</p>
          </div>
          <button
            onClick={markCompleted}
            disabled={saving}
            className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Se salvează...' : '✓ Marchează ca finalizat'}
          </button>
        </div>
      )}

      {/* Navigare prev/next */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {prevLesson ? (
          <Link href={`/dashboard/courses/lesson/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600 transition-colors">
            ← <span className="truncate max-w-[200px]">{prevLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/dashboard/courses/${lesson.module.category.slug}`}
            className="text-sm text-gray-500 hover:text-aep-600 transition-colors">
            ← Înapoi la modul
          </Link>
        )}
        {nextLesson && (
          <Link href={`/dashboard/courses/lesson/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600 transition-colors">
            <span className="truncate max-w-[200px]">{nextLesson.title}</span> →
          </Link>
        )}
      </div>
    </div>
  )
}
