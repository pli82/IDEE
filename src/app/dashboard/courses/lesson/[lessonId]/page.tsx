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
  module: { title: string; category: { title: string; slug: string } }
  minWatchPercentForTest: number
}

export default function LessonPage() {
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video')

  useEffect(() => {
    fetch(`/api/courses/lessons/${lessonId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setLesson(d.data)
        // dacă nu există video dar există PDF, arată PDF-ul implicit
        if (!d.data?.videoUrl && d.data?.pdfUrl) setActiveTab('pdf')
      })
      .finally(() => setLoading(false))
  }, [lessonId])

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  if (!lesson) return (
    <div className="text-center py-12 text-gray-400">Lecția nu a fost găsită.</div>
  )

  const embedUrl = lesson.videoUrl?.includes('youtube.com/watch')
    ? lesson.videoUrl.replace('watch?v=', 'embed/')
    : lesson.videoUrl?.includes('youtu.be/')
    ? lesson.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
    : lesson.videoUrl

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

      <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
      {lesson.description && <p className="text-gray-500">{lesson.description}</p>}

      {/* Tab-uri Video / PDF */}
      {(lesson.videoUrl || lesson.pdfUrl) && (
        <div>
          <div className="flex gap-2 border-b border-gray-200 mb-4">
            {lesson.videoUrl && (
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'video'
                    ? 'border-aep-600 text-aep-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🎬 Video
              </button>
            )}
            {lesson.pdfUrl && (
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'pdf'
                    ? 'border-aep-600 text-aep-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📄 Suport de curs
              </button>
            )}
          </div>

          {/* Video player */}
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

          {/* PDF viewer */}
          {activeTab === 'pdf' && lesson.pdfUrl && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">📄 Suport de curs</span>
                <a
                  href={lesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-aep-600 hover:underline"
                >
                  Deschide în tab nou ↗
                </a>
              </div>
              <iframe
                src={lesson.pdfUrl}
                className="w-full"
                style={{ height: '70vh' }}
                title="Suport de curs"
              />
            </div>
          )}
        </div>
      )}

      {/* Navigare */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Link
          href={`/dashboard/courses/${lesson.module.category.slug}`}
          className="text-sm text-gray-500 hover:text-aep-600 flex items-center gap-1"
        >
          ← Înapoi la modul
        </Link>
      </div>
    </div>
  )
}
