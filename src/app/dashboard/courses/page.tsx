'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  id: string; title: string; slug: string; description?: string; published: boolean
  children: Category[]
  modules: { id: string; title: string; _count: { lessons: number } }[]
}

export default function CoursesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/courses/categories')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Materiale de instruire</h1>
      <p className="text-gray-500 text-sm">Selectați categoria electorală pentru a accesa materialele și testele specifice</p>
      
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">Niciun material disponibil momentan. Reveniți mai târziu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(cat => (
            <Link key={cat.id} href={`/dashboard/courses/${cat.slug}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-aep-300 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-aep-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-aep-100">
                <span className="text-2xl">🗳️</span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-aep-700">{cat.title}</h3>
              {cat.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>}
              {cat.children && cat.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {cat.children.map(sub => (
                    <span key={sub.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{sub.title}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
