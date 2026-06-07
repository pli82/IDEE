'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  id: string; title: string; slug: string; description?: string; published: boolean
  children: Category[]
  modules: { id: string; title: string; _count: { lessons: number } }[]
}

const BLUE_VISUALS = [
  {
    icon: '🏛️',
    gradient: 'linear-gradient(135deg, #e8f4fd 0%, #b8d9f5 100%)',
    border: '#5aaae0',
    iconBg: 'linear-gradient(145deg, #7ec4f0, #2d8fd0)',
  },
  {
    icon: '🗳️',
    gradient: 'linear-gradient(135deg, #d0e9f9 0%, #90c4ee 100%)',
    border: '#2d8fd0',
    iconBg: 'linear-gradient(145deg, #5aaae0, #1a7cc0)',
  },
  {
    icon: '🏙️',
    gradient: 'linear-gradient(135deg, #b8daf6 0%, #6ab5eb 100%)',
    border: '#1a7cc0',
    iconBg: 'linear-gradient(145deg, #378add, #0a5fa0)',
  },
  {
    icon: '🇪🇺',
    gradient: 'linear-gradient(135deg, #9ecbf2 0%, #4aa0e6 100%)',
    border: '#0a5fa0',
    iconBg: 'linear-gradient(145deg, #2d8fd0, #004b87)',
  },
  {
    icon: '📋',
    gradient: 'linear-gradient(135deg, #e0eefa 0%, #a8ccf0 100%)',
    border: '#378add',
    iconBg: 'linear-gradient(145deg, #4aa0e6, #185fa5)',
  },
  {
    icon: '📍',
    gradient: 'linear-gradient(135deg, #cce0f5 0%, #80b8e8 100%)',
    border: '#185fa5',
    iconBg: 'linear-gradient(145deg, #2d8fd0, #003d6e)',
  },
]

export default function CoursesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/courses/categories', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materiale de instruire</h1>
        <p className="text-gray-500 text-sm mt-1">Selectați categoria electorală pentru a accesa materialele și testele specifice</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">Niciun material disponibil momentan. Reveniți mai târziu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat, i) => {
            const visual = BLUE_VISUALS[i % BLUE_VISUALS.length]
            return (
              <Link key={cat.id} href={`/dashboard/courses/${cat.slug}`}
                className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  border: `1.5px solid ${visual.border}`,
                  boxShadow: '3px 4px 12px rgba(0,75,135,0.12), -2px -2px 8px rgba(255,255,255,0.9)',
                }}>

                {/* Banner colorat */}
                <div style={{ background: visual.gradient, padding: '20px 20px 16px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: visual.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                    boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3), 2px 3px 8px rgba(0,50,120,0.2)',
                  }}>
                    {visual.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white px-5 py-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-aep-700 transition-colors">{cat.title}</h3>
                  {cat.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                  {cat.children && cat.children.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {cat.children.map(sub => (
                        <span key={sub.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{sub.title}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: visual.border }}>
                    <span>Accesează materialele</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
