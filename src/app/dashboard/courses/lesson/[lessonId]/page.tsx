'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  progress?: { status: string; watchedPercent: number; lastPositionSeconds: number }[]
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function LessonPage() {
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video')
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('NOT_STARTED')
  const [watchedPercent, setWatchedPercent] = useState(0)
  const [lastPosition, setLastPosition] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lessonRef = useRef<Lesson | null>(null)
  const statusRef = useRef(status)
  const watchedPercentRef = useRef(watchedPercent)
  const lastPositionRef = useRef(lastPosition)

  // Sync refs
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { watchedPercentRef.current = watchedPercent }, [watchedPercent])
  useEffect(() => { lastPositionRef.current = lastPosition }, [lastPosition])
  useEffect(() => { lessonRef.current = lesson }, [lesson])

  const extractYouTubeId = (url: string) => {
    const patterns = [
      /youtube\.com\/embed\/([^?&]+)/,
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
    ]
    for (const p of patterns) {
      const m = url.match(p)
      if (m) return m[1]
    }
    return null
  }

  const saveProgress = useCallback(async (newStatus: string, percent: number, positionSeconds: number) => {
    try {
      await fetch(`/api/courses/lessons/${lessonId}/progress`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchedPercent: percent, lastPositionSeconds: positionSeconds }),
      })
    } catch (e) {
      console.error('Progress save error:', e)
    }
  }, [lessonId])

  // Salvează la ieșirea din pagină
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current && statusRef.current !== 'COMPLETED') {
        try {
          const currentTime = playerRef.current.getCurrentTime?.() || lastPositionRef.current
          const duration = playerRef.current.getDuration?.() || 1
          const percent = Math.min((currentTime / duration) * 100, 99)
          saveProgress('IN_PROGRESS', percent, currentTime)
        } catch (e) {}
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveProgress])

  // Inițializare YouTube IFrame API
  useEffect(() => {
    if (!lesson?.videoUrl) return
    const videoId = extractYouTubeId(lesson.videoUrl)
    if (!videoId) return

    const initPlayer = () => {
      if (!playerContainerRef.current) return
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: lastPosition > 10 && status !== 'COMPLETED' ? Math.floor(lastPosition) : 0,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (event.data === 1) {
              // Incepe tracking
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = setInterval(() => {
                try {
                  const current = playerRef.current.getCurrentTime()
                  const duration = playerRef.current.getDuration()
                  if (!duration) return
                  const percent = Math.min((current / duration) * 100, 100)
                  setWatchedPercent(prev => Math.max(prev, percent))
                  setLastPosition(current)
                  if (statusRef.current === 'NOT_STARTED') {
                    setStatus('IN_PROGRESS')
                    saveProgress('IN_PROGRESS', percent, current)
                  }
                } catch (e) {}
              }, 5000) // salvează la fiecare 5 secunde
            } else if (event.data === 2) {
              // Pauza — salvează imediat
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              try {
                const current = playerRef.current.getCurrentTime()
                const duration = playerRef.current.getDuration()
                const percent = Math.min((current / duration) * 100, 100)
                setWatchedPercent(prev => Math.max(prev, percent))
                setLastPosition(current)
                saveProgress('IN_PROGRESS', percent, current)
              } catch (e) {}
            } else if (event.data === 0) {
              // Video terminat
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              setWatchedPercent(100)
              setStatus('COMPLETED')
              saveProgress('COMPLETED', 100, playerRef.current.getDuration?.() || 0)
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      try { playerRef.current?.destroy?.() } catch (e) {}
    }
  }, [lesson, lastPosition])

  // Încarcă lecția
  useEffect(() => {
    fetch(`/api/courses/lessons/${lessonId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setLesson(d.data)
        const prog = d.data?.progress?.[0]
        if (prog) {
          setStatus(prog.status)
          setWatchedPercent(prog.watchedPercent || 0)
          setLastPosition(prog.lastPositionSeconds || 0)
          // Arată dialogul de reluare dacă e în curs și a mai văzut > 10 secunde
          if (prog.status === 'IN_PROGRESS' && prog.lastPositionSeconds > 10) {
            setShowResumeDialog(true)
          }
        }
        if (!d.data?.videoUrl && d.data?.pdfUrl) setActiveTab('pdf')
      })
      .finally(() => setLoading(false))
  }, [lessonId])

  const markCompleted = async () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    setStatus('COMPLETED')
    setWatchedPercent(100)
    setSaving(true)
    try {
      await saveProgress('COMPLETED', 100, lastPosition)
    } finally { setSaving(false) }
  }

  const resumeFromPosition = () => {
    setShowResumeDialog(false)
    // Player-ul e deja inițializat cu start=lastPosition
  }

  const startFromBeginning = () => {
    setShowResumeDialog(false)
    setLastPosition(0)
    try { playerRef.current?.seekTo(0) } catch (e) {}
  }

  const moduleLessons = lesson?.module?.lessons || []
  const currentIndex = moduleLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null

  const isYouTube = lesson?.videoUrl && extractYouTubeId(lesson.videoUrl)

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
      {/* Dialog reluare */}
      {showResumeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Continuă vizionarea</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ai vizionat {Math.round(watchedPercent)}% din această lecție. Vrei să continui de unde ai rămas?
            </p>
            <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-aep-500 rounded-full" style={{ width: `${watchedPercent}%` }} />
            </div>
            <div className="flex gap-3">
              <button onClick={startFromBeginning}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                De la început
              </button>
              <button onClick={resumeFromPosition}
                className="flex-1 px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                Continuă
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Header cu status */}
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

      {/* Progress bar */}
      {status !== 'NOT_STARTED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progres vizionare</span>
            <span className="text-sm font-bold text-aep-700">{Math.round(watchedPercent)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-aep-500'}`}
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
          {status === 'COMPLETED' && (
            <p className="text-xs text-green-600 mt-2 font-medium">✓ Lecție finalizată</p>
          )}
        </div>
      )}

      {/* Tab-uri */}
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
              {isYouTube ? (
                <div ref={playerContainerRef} className="w-full h-full" />
              ) : (
                <iframe src={lesson.videoUrl} className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen title={lesson.title} />
              )}
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

      {/* Buton finalizat */}
      {status !== 'COMPLETED' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Ai terminat această lecție?</p>
            <p className="text-xs text-gray-400 mt-0.5">Marchează ca finalizată pentru a urmări progresul tău</p>
          </div>
          <button onClick={markCompleted} disabled={saving}
            className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? 'Se salvează...' : '✓ Marchează ca finalizat'}
          </button>
        </div>
      )}

      {/* Navigare prev/next */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {prevLesson ? (
          <Link href={`/dashboard/courses/lesson/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600">
            ← <span className="truncate max-w-[200px]">{prevLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/dashboard/courses/${lesson.module.category.slug}`}
            className="text-sm text-gray-500 hover:text-aep-600">
            ← Înapoi la modul
          </Link>
        )}
        {nextLesson && (
          <Link href={`/dashboard/courses/lesson/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600">
            <span className="truncate max-w-[200px]">{nextLesson.title}</span> →
          </Link>
        )}
      </div>
    </div>
  )
}
