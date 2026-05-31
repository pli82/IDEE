'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Lesson {
  id: string; title: string; description?: string
  videoUrl?: string; videoFile?: { storagePath: string }
  pdfFile?: { storagePath: string }
  minWatchPercentForTest: number
  module: { id: string; title: string; lessons: { id: string; title: string; order: number }[] }
  tests: { id: string; title: string }[]
}

interface Progress { watchedPercent: number; lastPositionSeconds: number; status: string }

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTest, setShowTest] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const saveTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/lessons/${lessonId}`).then(r => r.json()),
      fetch(`/api/courses/lessons/${lessonId}/progress`).then(r => r.json()),
    ]).then(([lessonRes, progressRes]) => {
      setLesson(lessonRes.data)
      setProgress(progressRes.data)
      setLoading(false)
    })
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [lessonId])

  const saveProgress = async (percent: number, position: number) => {
    const r = await fetch(`/api/courses/lessons/${lessonId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchedPercent: percent, lastPositionSeconds: position }),
    })
    const d = await r.json()
    setProgress(d.data)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const percent = (video.currentTime / video.duration) * 100
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveProgress(percent, video.currentTime), 3000)
  }

  const canAccessTest = lesson && progress
    ? (progress.watchedPercent >= lesson.minWatchPercentForTest || lesson.minWatchPercentForTest === 0)
    : false

  const currentIndex = lesson?.module.lessons.findIndex(l => l.id === lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? lesson?.module.lessons[currentIndex - 1] : null
  const nextLesson = lesson?.module.lessons[currentIndex + 1] ?? null

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
  if (!lesson) return <div className="text-center py-12 text-gray-400">Lecție inexistentă</div>

  const videoSrc = lesson.videoUrl || (lesson.videoFile ? `/api/files/${lesson.videoFile.storagePath}` : null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/courses" className="hover:text-aep-600">Materiale</Link>
        <span>/</span>
        <span className="text-gray-400">{lesson.module.title}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{lesson.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Player + conținut */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-black rounded-xl overflow-hidden aspect-video">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => saveProgress(100, videoRef.current?.duration || 0)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Video indisponibil
              </div>
            )}
          </div>

          {/* Bară progres video */}
          {progress && (
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Progres vizionare</span>
                <span className={progress.status === 'COMPLETED' ? 'text-green-600 font-medium' : 'text-aep-600'}>
                  {Math.round(progress.watchedPercent)}%{progress.status === 'COMPLETED' ? ' ✓ Finalizat' : ''}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-aep-500 rounded-full transition-all" style={{ width: `${progress.watchedPercent}%` }} />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
            {lesson.description && <p className="mt-2 text-gray-600 text-sm leading-relaxed">{lesson.description}</p>}

            <div className="flex flex-wrap gap-3 mt-5">
              {lesson.pdfFile && (
                <a href={`/api/files/${lesson.pdfFile.storagePath}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-aep-600 text-aep-600 rounded-lg text-sm font-medium hover:bg-aep-50 transition-colors">
                  📄 Suport de curs PDF
                </a>
              )}
              {lesson.tests.length > 0 && (
                <button
                  onClick={() => canAccessTest ? setShowTest(true) : undefined}
                  disabled={!canAccessTest}
                  title={!canAccessTest ? `Vizionați ${lesson.minWatchPercentForTest}% din video pentru a accesa testul` : ''}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${canAccessTest ? 'bg-aep-600 text-white hover:bg-aep-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  ✅ Testare {!canAccessTest && `(vizionați ${lesson.minWatchPercentForTest}%)`}
                </button>
              )}
            </div>
          </div>

          {/* Navigare */}
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Link href={`/dashboard/courses/lesson/${prevLesson.id}`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                ← {prevLesson.title}
              </Link>
            ) : <div />}
            {nextLesson && (
              <Link href={`/dashboard/courses/lesson/${nextLesson.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                {nextLesson.title} →
              </Link>
            )}
          </div>
        </div>

        {/* Lista lecții modul */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{lesson.module.title}</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {lesson.module.lessons.map((l, i) => (
              <Link key={l.id} href={`/dashboard/courses/lesson/${l.id}`}
                className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${l.id === lessonId ? 'bg-aep-50 border-l-2 border-aep-600' : ''}`}>
                <span className="text-gray-400 flex-shrink-0 text-xs w-5 text-center">{i + 1}</span>
                <span className={l.id === lessonId ? 'text-aep-700 font-medium' : 'text-gray-700'}>{l.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Test modal */}
      {showTest && lesson.tests[0] && (
        <TestModal testId={lesson.tests[0].id} onClose={() => setShowTest(false)} />
      )}
    </div>
  )
}

// ── Test Modal ────────────────────────────────────────────
function TestModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'active' | 'result'>('loading')
  const [attempt, setAttempt] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/tests/${testId}/start`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setAttempt(d.data); setPhase('active') })
  }, [])

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers(p => ({ ...p, [questionId]: optionId }))
  }

  const submit = async () => {
    const r = await fetch(`/api/tests/attempts/${attempt.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    const d = await r.json()
    setResult(d.data)
    setPhase('result')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{phase === 'result' ? 'Rezultatul testului' : 'Test de evaluare'}</h2>
          {phase !== 'active' && <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>}
          {phase === 'active' && attempt && (
            <span className="text-sm text-gray-500">Întrebarea {current + 1} din {attempt.questions.length}</span>
          )}
        </div>

        <div className="p-5">
          {phase === 'loading' && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>}

          {phase === 'active' && attempt && (
            <div className="space-y-5">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-aep-500 rounded-full transition-all" style={{ width: `${((current + 1) / attempt.questions.length) * 100}%` }} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{attempt.questions[current].text}</p>
                <div className="mt-4 space-y-2">
                  {attempt.questions[current].options.map((opt: any) => (
                    <button key={opt.id} onClick={() => selectAnswer(attempt.questions[current].id, opt.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-colors ${
                        answers[attempt.questions[current].id] === opt.id
                          ? 'border-aep-600 bg-aep-50 text-aep-700 font-medium'
                          : 'border-gray-200 hover:border-aep-300 hover:bg-gray-50'
                      }`}>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                  ← Înapoi
                </button>
                {current < attempt.questions.length - 1 ? (
                  <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[attempt.questions[current].id]}
                    className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-aep-700">
                    Următoarea →
                  </button>
                ) : (
                  <button onClick={submit}
                    disabled={Object.keys(answers).length < attempt.questions.length}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-green-700">
                    Trimite testul ✓
                  </button>
                )}
              </div>
            </div>
          )}

          {phase === 'result' && result && (
            <div className="space-y-5">
              <div className={`rounded-xl p-6 text-center ${result.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="text-4xl mb-2">{result.passed ? '✓' : '✗'}</div>
                <div className={`text-2xl font-bold ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
                  {result.score}/{result.maxScore} puncte
                </div>
                <div className={`text-lg font-medium mt-1 ${result.passed ? 'text-green-700' : 'text-red-600'}`}>
                  {result.passed ? 'PROMOVAT' : 'NEPROMOVAT'}
                </div>
              </div>

              {result.answers && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Răspunsurile dvs.:</h3>
                  {result.answers.map((a: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border ${a.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-2">
                        <span className={a.isCorrect ? 'text-green-600' : 'text-red-500'}>{a.isCorrect ? '✓' : '✗'}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{a.question}</div>
                          <div className="text-sm mt-1">
                            <span className="text-gray-500">Răspuns dvs.: </span>
                            <span className={a.isCorrect ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>{a.selectedOption}</span>
                          </div>
                          {!a.isCorrect && a.correctOption && (
                            <div className="text-sm mt-0.5">
                              <span className="text-gray-500">Răspuns corect: </span>
                              <span className="text-green-700 font-medium">{a.correctOption}</span>
                            </div>
                          )}
                          {a.explanation && <div className="text-xs text-gray-500 mt-1 italic">{a.explanation}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={onClose} className="w-full px-4 py-2.5 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
                Închide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
