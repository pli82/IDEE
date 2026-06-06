'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category {
  id: string; title: string; slug: string; description?: string; published: boolean
  children: Category[]
  modules: { id: string; title: string; _count: { lessons: number } }[]
}

// Configurare vizuală per categorie — bazată pe slug sau titlu
const CATEGORY_VISUALS: Record<string, { icon: string; gradient: string; border: string; iconBg: string }> = {
  'alegeri-presedinte': {
    icon: '🏛️',
    gradient: 'linear-gradient(135deg, #e8f4fd 0%, #b8d9f5 100%)',
    border: '#5aaae0',
    iconBg: 'linear-gradient(145deg, #5aaae0, #1a7cc0)',
  },
  'alegeri-parlamentare': {
    icon: '🗳️',
    gradient: 'linear-gradient(135deg, #eaf6ec 0%, #b8e5bf 100%)',
    border: '#5ec885',
    iconBg: 'linear-gradient(145deg, #5ec885, #1a9a50)',
  },
  'alegeri-locale': {
    icon: '🏙️',
    gradient: 'linear-gradient(135deg, #fef9e7 0%, #fde9a0 100%)',
    border: '#fbd660',
    iconBg: 'linear-gradient(145deg, #fde060, #d4a000)',
  },
  'alegeri-europarlamentare': {
    icon: '🇪🇺',
    gradient: 'linear-gradient(135deg, #f0eafd 0%, #d4b8f5 100%)',
    border: '#a07ae0',
    iconBg: 'linear-gradient(145deg, #a07ae0, #6a1ac0)',
  },
  'referendum': {
    icon: '📋',
    gradient: 'linear-gradient(135deg, #fdecea 0%, #f9bfba 100%)',
    border: '#f07070',
    iconBg: 'linear-gradient(145deg, #f07070, #c02020)',
  },
  'referendum-local': {
    icon: '📍',
    gradient: 'linear-gradient(135deg, #fdecea 0%, #f9bfba 100%)',
    border: '#f07070',
    iconBg: 'linear-gradient(145deg, #f07070, #c02020)',
  },
}

// Fallback vizual — rotație de culori pentru categorii necunoscute
const FALLBACK_VISUALS = [
  { icon: '📚', gradient: 'linear-gradient(135deg, #e8f4fd 0%, #b8d9f5 100%)', border: '#5aaae0', iconBg: 'linear-gradient(145deg, #5aaae0, #1a7cc0)' },
  { icon: '📗', gradient: 'linear-gradient(135deg, #eaf6ec 0%, #b8e5bf 100%)', border: '#5ec885', iconBg: 'linear-gradient(145deg, #5ec885, #1a9a50)' },
  { icon: '📙', gradient: 'linear-gradient(135deg, #fef9e7 0%, #fde9a0 100%)', border: '#fbd660', iconBg: 'linear-gradient(145deg, #fde060, #d4a000)' },
  { icon: '📘', gradient: 'linear-gradient(135deg, #f0eafd 0%, #d4b8f5 100%)', border: '#a07ae0', iconBg: 'linear-gradient(145deg, #a07ae0, #6a1ac0)' },
  { icon: '📕', gradient: 'linear-gradient(135deg, #fdecea 0%, #f9bfba 100%)', border: '#f07070', iconBg: 'linear-gradient(145deg, #f07070, #c02020)' },
  { icon: '📓', gradient: 'linear-gradient(135deg, #e8fdf4 0%, #b8f5da 100%)', border: '#5ae0b0', iconBg: 'linear-gradient(145deg, #5ae0b0, #1ac080)' },
]

function getVisual(cat: Category, index: number) {
  // Caută după slug exact
  if (CATEGORY_VISUALS[cat.slug]) return CATEGORY_VISUALS[cat.slug]
  // Caută dacă slug-ul conține cuvinte cheie
  const slug = cat.slug.toLowerCase()
  if (slug.includes('presedint') || slug.includes('prezident')) return CATEGORY_VISUALS['alegeri-presedinte']
  if (slug.includes('parlament')) return CATEGORY_VISUALS['alegeri-parlamentare']
  if (slug.includes('local') && slug.includes('referendum')) return CATEGORY_VISUALS['referendum-local']
  if (slug.includes('local') || slug.includes('administratie')) return CATEGORY_VISUALS['alegeri-locale']
  if (slug.includes('europ')) return CATEGORY_VISUALS['alegeri-europarlamentare']
  if (slug.includes('referendum')) return CATEGORY_VISUALS['referendum']
  // Fallback rotativ
  return FALLBACK_VISUALS[index % FALLBACK_VISUALS.length]
}

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
            const visual = getVisual(cat, i)
            return (
              <Link key={cat.id} href={`/dashboard/courses/${cat.slug}`}
                className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ border: `1.5px solid ${visual.border}`, boxShadow: '3px 4px 12px rgba(0,0,0,0.08), -2px -2px 8px rgba(255,255,255,0.9)' }}>

                {/* Banner colorat */}
                <div style={{ background: visual.gradient, padding: '20px 20px 16px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: visual.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                    boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3), 2px 3px 8px rgba(0,0,0,0.15)',
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
                        <span key={sub.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{sub.title}</span>
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
