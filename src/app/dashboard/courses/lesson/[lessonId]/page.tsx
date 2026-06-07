'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Option { id: string; text: string; isCorrect?: boolean }
interface Question { id: string; text: string; type: string; options: Option[] }
interface TestData {
  id: string; title: string; questionsPerAttempt: number; passingScore: number
  totalQuestions: number; questions: Question[]
}
interface TestResult {
  score: number; maxScore: number; passingScore: number; passed: boolean; percentage: number
  results: { questionId: string; questionText: string; selectedOptionId: string | null; correctOptionId: string | null; isCorrect: boolean; options: Option[] }[]
}
interface Lesson {
  id: string; title: string; description?: string; videoUrl?: string; pdfUrl?: string; externalUrl?: string
  moduleId: string
  module: { title: string; category: { title: string; slug: string }; lessons: { id: string; title: string; order: number }[] }
  minWatchPercentForTest: number
  tests: { id: string; title: string; questionsPerAttempt: number; passingScore: number }[]
  progress?: { status: string; watchedPercent: number; lastPositionSeconds: number }[]
}

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void } }

// ─── Componenta Test ────────────────────────────────────────────────────────
function TestModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'quiz' | 'results'>('loading')
  const [testData, setTestData] = useState<TestData | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/tests/${testId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setTestData(d.data); setPhase('quiz') })
  }, [testId])

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers(p => ({ ...p, [questionId]: optionId }))
  }

  const submitTest = async () => {
    if (!testData) return
    setSubmitting(true)
    const answersArr = testData.questions.map(q => ({
      questionId: q.id,
      selectedOptionId: answers[q.id] || null,
    }))
    const r = await fetch(`/api/tests/${testId}/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answersArr }),
    })
    const d = await r.json()
    setResult(d.data)
    setPhase('results')
    setSubmitting(false)
  }

  const retakeTest = () => {
    setPhase('loading')
    setAnswers({})
    setCurrentIdx(0)
    setResult(null)
    fetch(`/api/tests/${testId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setTestData(d.data); setPhase('quiz') })
  }

  const currentQ = testData?.questions[currentIdx]
  const totalQ = testData?.questions.length || 0
  const answeredCount = Object.keys(answers).length
  const allAnswered = testData ? answeredCount === totalQ : false

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">{testData?.title || 'Test'}</h2>
            {phase === 'quiz' && testData && (
              <p className="text-xs text-gray-500 mt-0.5">
                Întrebarea {currentIdx + 1} din {totalQ} · {answeredCount}/{totalQ} răspunse
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {phase === 'loading' && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
            </div>
          )}

          {/* Quiz */}
          {phase === 'quiz' && currentQ && testData && (
            <div className="p-6 space-y-6">
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-aep-500 rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }} />
              </div>

              {/* Întrebare */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 leading-relaxed">{currentQ.text}</p>
              </div>

              {/* Opțiuni */}
              <div className="space-y-2">
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id] === opt.id
                  return (
                    <button key={opt.id}
                      onClick={() => selectAnswer(currentQ.id, opt.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-aep-500 bg-aep-50 text-aep-800'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-aep-500 bg-aep-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm">{opt.text}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Navigare întrebări */}
              <div className="flex flex-wrap gap-2 pt-2">
                {testData.questions.map((q, i) => (
                  <button key={q.id} onClick={() => setCurrentIdx(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      i === currentIdx ? 'bg-aep-600 text-white' :
                      answers[q.id] ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rezultate */}
          {phase === 'results' && result && testData && (
            <div className="p-6 space-y-6">
              {/* Scor */}
              <div className={`rounded-2xl p-6 text-center ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-5xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.score}/{result.maxScore}
                </div>
                <div className={`text-lg font-semibold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                  {result.passed ? '🎉 Felicitări, ai promovat!' : '❌ Nu ai promovat'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Prag promovare: {result.passingScore} puncte · Ai obținut {result.percentage}%
                </div>
                <div className="mt-4 h-3 bg-white/60 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div className={`h-full rounded-full transition-all ${result.passed ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${result.percentage}%` }} />
                </div>
              </div>

              {/* Detalii răspunsuri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Răspunsurile tale:</h3>
                {result.results.map((r, i) => (
                  <div key={r.questionId}
                    className={`rounded-xl border-2 p-4 ${r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-start gap-2 mb-3">
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        r.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {r.isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="text-sm font-medium text-gray-900">{i + 1}. {r.questionText}</p>
                    </div>
                    <div className="space-y-1.5 ml-8">
                      {r.options.map(opt => {
                        const isSelected = opt.id === r.selectedOptionId
                        const isCorrect = opt.id === r.correctOptionId
                        return (
                          <div key={opt.id}
                            className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                              isCorrect ? 'bg-green-200 text-green-800 font-medium' :
                              isSelected && !isCorrect ? 'bg-red-200 text-red-800' :
                              'text-gray-500'
                            }`}>
                            {isCorrect ? '✓' : isSelected && !isCorrect ? '✗' : '○'}
                            {opt.text}
                            {isCorrect && <span className="ml-auto text-green-700 font-semibold">Corect</span>}
                            {isSelected && !isCorrect && <span className="ml-auto text-red-700">Ales</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer butoane */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {phase === 'quiz' && testData && (
            <>
              <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                ← Înapoi
              </button>
              <span className="text-xs text-gray-400">{answeredCount}/{totalQ} răspunse</span>
              {currentIdx < totalQ - 1 ? (
                <button onClick={() => setCurrentIdx(i => i + 1)}
                  className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                  Înainte →
                </button>
              ) : (
                <button onClick={submitTest} disabled={submitting || !allAnswered}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                  {submitting ? 'Se trimite...' : allAnswered ? '✓ Trimite testul' : `Mai ai ${totalQ - answeredCount} răspunsuri`}
                </button>
              )}
            </>
          )}
          {phase === 'results' && (
            <>
              <button onClick={retakeTest} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                🔄 Reia testul
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                Închide
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pagina de lecție ────────────────────────────────────────────────────────
export default function LessonPage() {
  const params = useParams()
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video')
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('NOT_STARTED')
  const [watchedPercent, setWatchedPercent] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [activeTestId, setActiveTestId] = useState<string | null>(null)

  const playerRef = useRef<any>(null)
  const playerDivRef = useRef<HTMLDivElement>(null)
  const playerInitialized = useRef(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const savedPosition = useRef(0)
  const statusRef = useRef('NOT_STARTED')
  const watchedPercentRef = useRef(0)
  const lessonIdRef = useRef(lessonId)

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { watchedPercentRef.current = watchedPercent }, [watchedPercent])

  const extractYouTubeId = (url: string) => {
    const patterns = [/youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtu\.be\/([^?]+)/]
    for (const p of patterns) { const m = url.match(p); if (m) return m[1] }
    return null
  }

  const saveProgress = useCallback(async (percent: number, positionSeconds: number) => {
    try {
      await fetch(`/api/courses/lessons/${lessonIdRef.current}/progress`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchedPercent: percent, lastPositionSeconds: positionSeconds }),
      })
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const handleUnload = () => {
      if (playerRef.current && statusRef.current !== 'COMPLETED') {
        try {
          const t = playerRef.current.getCurrentTime?.() || 0
          const d = playerRef.current.getDuration?.() || 1
          const p = Math.min((t / d) * 100, 99)
          navigator.sendBeacon(`/api/courses/lessons/${lessonIdRef.current}/progress`,
            JSON.stringify({ watchedPercent: p, lastPositionSeconds: t }))
        } catch (e) {}
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  const initYouTubePlayer = useCallback((videoId: string, startSeconds: number) => {
    if (playerInitialized.current) return
    playerInitialized.current = true

    const doInit = () => {
      if (!playerDivRef.current) return
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, start: startSeconds > 10 ? Math.floor(startSeconds) : 0 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = setInterval(() => {
                try {
                  const current = playerRef.current.getCurrentTime()
                  const duration = playerRef.current.getDuration()
                  if (!duration || duration <= 0) return
                  const percent = Math.min((current / duration) * 100, 100)
                  setWatchedPercent(prev => { const nv = Math.max(prev, percent); watchedPercentRef.current = nv; return nv })
                  if (statusRef.current === 'NOT_STARTED') { statusRef.current = 'IN_PROGRESS'; setStatus('IN_PROGRESS') }
                  saveProgress(watchedPercentRef.current, current)
                } catch (e) {}
              }, 10000)
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              try {
                const current = playerRef.current.getCurrentTime()
                const duration = playerRef.current.getDuration()
                if (duration > 0) {
                  const percent = Math.min((current / duration) * 100, 100)
                  setWatchedPercent(prev => Math.max(prev, percent))
                  saveProgress(Math.max(watchedPercentRef.current, percent), current)
                }
              } catch (e) {}
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              setWatchedPercent(100); setStatus('COMPLETED'); statusRef.current = 'COMPLETED'
              try { saveProgress(100, playerRef.current.getDuration()) } catch (e) { saveProgress(100, 0) }
            }
          },
        },
      })
    }

    if (window.YT?.Player) { doInit() }
    else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(tag)
      }
      window.onYouTubeIframeAPIReady = doInit
    }
  }, [saveProgress])

  useEffect(() => {
    fetch(`/api/courses/lessons/${lessonId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const l = d.data; setLesson(l)
        const prog = l?.progress?.[0]
        if (prog) {
          setStatus(prog.status); setWatchedPercent(prog.watchedPercent || 0)
          watchedPercentRef.current = prog.watchedPercent || 0; statusRef.current = prog.status
          savedPosition.current = prog.lastPositionSeconds || 0
          if (prog.status === 'IN_PROGRESS' && prog.lastPositionSeconds > 10) setShowResumeDialog(true)
        }
        if (!l?.videoUrl && l?.pdfUrl) setActiveTab('pdf')
      })
      .finally(() => setLoading(false))
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      try { playerRef.current?.destroy?.() } catch (e) {}
      playerInitialized.current = false
    }
  }, [lessonId])

  useEffect(() => {
    if (!lesson?.videoUrl || !playerDivRef.current) return
    const videoId = extractYouTubeId(lesson.videoUrl)
    if (!videoId) return
    initYouTubePlayer(videoId, savedPosition.current)
  }, [lesson, initYouTubePlayer])

  const markCompleted = async () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    setStatus('COMPLETED'); setWatchedPercent(100); setSaving(true)
    try { await saveProgress(100, savedPosition.current) } finally { setSaving(false) }
  }

  const openTest = (testId: string) => { setActiveTestId(testId); setShowTest(true) }

  const moduleLessons = lesson?.module?.lessons || []
  const currentIndex = moduleLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null
  const isYouTube = lesson?.videoUrl ? !!extractYouTubeId(lesson.videoUrl) : false

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
  if (!lesson) return <div className="text-center py-12 text-gray-400">Lecția nu a fost găsită.</div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Modal test */}
      {showTest && activeTestId && (
        <TestModal testId={activeTestId} onClose={() => { setShowTest(false); setActiveTestId(null) }} />
      )}

      {/* Dialog reluare */}
      {showResumeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Continuă vizionarea</h3>
            <p className="text-sm text-gray-500 mb-4">Ai vizionat {Math.round(watchedPercent)}% din această lecție. Vrei să continui de unde ai rămas?</p>
            <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-aep-500 rounded-full" style={{ width: `${watchedPercent}%` }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowResumeDialog(false); try { playerRef.current?.seekTo(0, true) } catch (e) {} }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">De la început</button>
              <button onClick={() => setShowResumeDialog(false)}
                className="flex-1 px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">Continuă</button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href="/dashboard/courses" className="hover:text-aep-600">Materiale</Link>
        <span>/</span>
        <Link href={`/dashboard/courses/${lesson.module.category.slug}`} className="hover:text-aep-600">{lesson.module.category.title}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.description && <p className="text-gray-500 mt-1">{lesson.description}</p>}
        </div>
        <div className="shrink-0">
          {status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Completat
            </span>
          ) : status === 'IN_PROGRESS' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />În curs
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Neînceput</span>
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
            <div className={`h-full rounded-full transition-all duration-300 ${status === 'COMPLETED' ? 'bg-green-500' : 'bg-aep-500'}`}
              style={{ width: `${watchedPercent}%` }} />
          </div>
          {status === 'COMPLETED' && <p className="text-xs text-green-600 mt-2 font-medium">✓ Lecție finalizată</p>}
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
                📄 Material de învățare
              </button>
            )}
            {lesson.externalUrl && (
              <a href={lesson.externalUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium border-b-2 -mb-px border-transparent text-gray-500 hover:text-gray-700 transition-colors">
                🔗 Link extern - Invățare prin joc ↗
              </a>
            )}
          </div>

          {activeTab === 'video' && lesson.videoUrl && (
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              {isYouTube ? <div ref={playerDivRef} className="w-full h-full" />
                : <iframe src={lesson.videoUrl} className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={lesson.title} />}
            </div>
          )}

          {activeTab === 'pdf' && lesson.pdfUrl && (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
      <span className="text-sm font-medium text-gray-700">📄 Material de învățare</span>
      <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-aep-600 hover:underline">Deschide în tab nou ↗</a>
    </div>
    {lesson.pdfUrl.includes('drive.google.com') ? (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <span className="text-5xl">📄</span>
        <p className="text-gray-500 text-sm">Documentul este disponibil pe Google Drive</p>
        <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer"
          className="px-6 py-3 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700 flex items-center gap-2">
          📂 Vizualizează documentul
        </a>
      </div>
    ) : (
      <iframe src={lesson.pdfUrl} className="w-full" style={{ height: '70vh' }} title="Material de învățare" />
    )}
  </div>
)}
          )}
        </div>
      )}

      {/* Teste disponibile */}
      {lesson.tests && lesson.tests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">📝 Teste disponibile</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {lesson.tests.map(test => {
              const canTake = lesson.minWatchPercentForTest === 0 || watchedPercent >= lesson.minWatchPercentForTest
              return (
                <div key={test.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{test.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {test.questionsPerAttempt} întrebări · Promovare la {test.passingScore}/{test.questionsPerAttempt} puncte
                    </div>
                    {!canTake && (
                      <div className="text-xs text-orange-500 mt-1">
                        ⚠ Trebuie să vizionezi cel puțin {lesson.minWatchPercentForTest}% din video (ai {Math.round(watchedPercent)}%)
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openTest(test.id)}
                    disabled={!canTake}
                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      canTake ? 'bg-aep-600 text-white hover:bg-aep-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {canTake ? '▶ Start test' : '🔒 Blocat'}
                  </button>
                </div>
              )
            })}
          </div>
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
            className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Se salvează...' : '✓ Marchează ca finalizat'}
          </button>
        </div>
      )}

      {/* Navigare */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {prevLesson ? (
          <Link href={`/dashboard/courses/lesson/${prevLesson.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600">
            ← <span className="truncate max-w-[200px]">{prevLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/dashboard/courses/${lesson.module.category.slug}`} className="text-sm text-gray-500 hover:text-aep-600">← Înapoi la modul</Link>
        )}
        {nextLesson && (
          <Link href={`/dashboard/courses/lesson/${nextLesson.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-aep-600">
            <span className="truncate max-w-[200px]">{nextLesson.title}</span> →
          </Link>
        )}
      </div>
    </div>
  )
}
