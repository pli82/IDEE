'use client'
import { useState, useEffect } from 'react'

interface Category { id: string; title: string; slug: string; description?: string; published: boolean; order: number; _count: { modules: number } }
interface Module { id: string; title: string; description?: string; published: boolean; categoryId: string; category: { title: string }; _count: { lessons: number } }

const emptyForm = { title: '', slug: '', description: '', order: 0, published: false, categoryId: '' }

export default function AdminContent() {
  const [tab, setTab] = useState<'categories' | 'modules' | 'lessons'>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [error, setError] = useState('')

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

  const openAdd = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      order: item.order || 0,
      published: item.published || false,
      categoryId: item.categoryId || '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const method = editItem ? 'PUT' : 'POST'
    const url = editItem
      ? `/api/admin/content?resource=${tab}&id=${editItem.id}`
      : `/api/admin/content?resource=${tab}`
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'Eroare la salvare'); return }
    setShowForm(false)
    load()
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
    if (!confirm('Ești sigur că vrei să ștergi acest element? Acțiunea este ireversibilă.')) return
    await fetch(`/api/admin/content?resource=${resource}&id=${id}`, { method: 'DELETE' })
    load()
  }

  const items = tab === 'categories' ? categories : modules

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestionare conținut</h1>
        <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-aep-600 text-white text-sm font-medium hover:bg-aep-700">
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
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 mb-4">Niciun element adăugat încă</p>
          <button onClick={openAdd} className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
            + Adaugă primul element
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titlu</th>
                {tab === 'modules' && <th className="text-left px-4 py-3 font-medium text-gray-600">Categorie</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Conținut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.slug && <div className="text-xs text-gray-400 mt-0.5">{item.slug}</div>}
                    {item.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.description}</div>}
                  </td>
                  {tab === 'modules' && (
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.category?.title || '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.published ? 'Publicat' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item._count?.modules !== undefined ? `${item._count.modules} module` : `${item._count?.lessons || 0} lecții`}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(item)}
                      className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50">
                      Modifică
                    </button>
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
            <h2 className="text-lg font-bold mb-4">
              {editItem ? 'Modifică' : 'Adaugă'} {tab === 'categories' ? 'categorie' : tab === 'modules' ? 'modul' : 'lecție'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Titlu *</label>
                <input type="text" placeholder="Titlu" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.title}
                  onChange={e => setFormData(p => ({
                    ...p,
                    title: e.target.value,
                    slug: editItem ? p.slug : e.target.value.toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                      .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
                      .replace(/ș/g, 's').replace(/ț/g, 't')
                  }))} />
              </div>

              {tab === 'categories' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slug (URL) *</label>
                  <input type="text" placeholder="slug-url" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    value={formData.slug}
                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} />
                  <p className="text-xs text-gray-400 mt-1">Doar litere mici, cifre și cratime</p>
                </div>
              )}

              {tab === 'modules' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Categorie *</label>
                  <select required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.categoryId}
                    onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}>
                    <option value="">Selectează categoria</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-1">Descriere</label>
                <textarea placeholder="Descriere (opțional)" rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Ordine afișare</label>
                <input type="number" min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.order}
                  onChange={e => setFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formData.published}
                  onChange={e => setFormData(p => ({ ...p, published: e.target.checked }))} />
                Publică imediat (vizibil utilizatorilor)
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Anulează
                </button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700">
                  {editItem ? 'Salvează modificările' : 'Adaugă'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
