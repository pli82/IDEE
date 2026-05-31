'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Category { id: string; title: string; slug: string; published: boolean; order: number; _count: { modules: number } }
interface Module { id: string; title: string; published: boolean; categoryId: string; category: { title: string }; _count: { lessons: number } }

export default function AdminContent() {
  const [tab, setTab] = useState<'categories' | 'modules' | 'lessons'>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', slug: '', description: '', order: 0, published: false })

  const load = async () => {
    setLoading(true)
    try {
      if (tab === 'categories') {
        const r = await fetch('/api/admin/content?resource=categories')
        const d = await r.json()
        setCategories(d.data || [])
      } else if (tab === 'modules') {
        const r = await fetch('/api/admin/content?resource=modules')
        const d = await r.json()
        setModules(d.data || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await fetch(`/api/admin/content?resource=${tab}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (r.ok) { setShowForm(false); load() }
  }

  const togglePublished = async (id: string, published: boolean, resource: string) => {
    await fetch(`/api/admin/content?resource=${resource}&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    })
    load()
  }

  const deleteItem = async (id: string, resource: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest element?')) return
    await fetch(`/api/admin/content?resource=${resource}&id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestionare conținut</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 rounded-lg bg-aep-600 text-white text-sm font-medium hover:bg-aep-700">
          + Adaugă
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['categories', 'modules', 'lessons'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'categories' ? 'Categorii' : t === 'modules' ? 'Module' : 'Lecții'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titlu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Conținut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(tab === 'categories' ? categories : modules).map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.published ? 'Publicat' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item._count?.modules !== undefined ? `${item._count.modules} module` : `${item._count?.lessons || 0} lecții`}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => togglePublished(item.id, item.published, tab)}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                      {item.published ? 'Ascunde' : 'Publică'}
                    </button>
                    <button onClick={() => deleteItem(item.id, tab)}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Adaugă {tab === 'categories' ? 'categorie' : 'modul'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Titlu" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))} />
              {tab === 'categories' && (
                <input type="text" placeholder="Slug (URL)" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.slug}
                  onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} />
              )}
              <textarea placeholder="Descriere (opțional)" rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formData.published}
                  onChange={e => setFormData(p => ({ ...p, published: e.target.checked }))} />
                Publică imediat
              </label>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Anulează</button>
                <button type="submit" className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
