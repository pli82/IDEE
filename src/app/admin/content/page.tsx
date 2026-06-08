'use client'
import { useState, useEffect, useMemo, useRef } from 'react'

interface Category { id: string; title: string; slug: string; description?: string; published: boolean; order: number; _count: { modules: number } }
interface Module { id: string; title: string; description?: string; published: boolean; categoryId: string; category: { title: string }; _count: { lessons: number } }
interface Lesson { id: string; title: string; description?: string; published: boolean; moduleId: string; module: { title: string }; videoUrl?: string; externalUrl?: string; order: number; minWatchPercentForTest: number }
interface LessonMaterial { id: string; title: string; url: string; type: string; order: number }

const emptyForm = { title: '', slug: '', description: '', order: 0, published: false, categoryId: '', moduleId: '', videoUrl: '', externalUrl: '', minWatchPercentForTest: 0 }
const apiFetch = (url: string, options: RequestInit = {}) => fetch(url, { ...options, credentials: 'include' })

function ColumnDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-gray-600 font-medium hover:text-aep-700 text-sm">
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-[100] bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px] max-h-72 overflow-y-auto p-2">
          {children}
        </div>
      )}
    </div>
  )
}

function MaterialsManager({ moduleId, moduleTitle, onClose, onMaterialAdded }: { moduleId: string; moduleTitle: string; onClose: () => void; onMaterialAdded?: () => void }) {
  const [materials, setMaterials] = useState<LessonMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState('PDF')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadMaterials = async () => {
    try {
      const r = await apiFetch(`/api/courses/modules/${moduleId}/materials`)
      const d = await r.json()
      setMaterials(Array.isArray(d.data) ? d.data : [])
    } catch {
      setMaterials([])
    }
    setLoading(false)
  }

  useEffect(() => { loadMaterials() }, [moduleId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
    const d = await r.json()
    setUploading(false)
    if (r.ok) {
      setNewUrl(d.url)
      if (!newTitle) setNewTitle(file.name.replace(/\.[^/.]+$/, ''))
    } else {
      setError(d.error || 'Eroare la upload')
    }
  }

  const handleAdd = async () => {
    if (!newTitle || !newUrl) { setError('Titlu și URL obligatorii'); return }
    setError('')
    const r = await apiFetch(`/api/courses/modules/${moduleId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, url: newUrl, type: newType, order: materials.length }),
    })
    if (r.ok) {
      setNewTitle(''); setNewUrl(''); setNewType('PDF')
      loadMaterials()
      onMaterialAdded?.()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ștergi acest material?')) return
    await apiFetch(`/api/courses/modules/${moduleId}/materials?id=${id}`, { method: 'DELETE' })
    loadMaterials()
    onMaterialAdded?.()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">Materiale instruire</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Modul: <strong>{moduleTitle}</strong></p>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aep-600" /></div>
        ) : (
          <>
            {materials.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Niciun material adăugat încă</p>
            ) : (
              <div className="space-y-2 mb-4">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-lg">{m.type === 'PDF' ? '📄' : '📊'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                      <p className="text-xs text-gray-400 truncate">{m.url}</p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 flex-shrink-0">Șterge</button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Adaugă material nou</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Titlu *</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="ex. Suport de curs PDF" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tip</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="PDF">PDF</option>
                  <option value="PPT">PPT / PPTX</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">URL (link extern)</label>
                <input type="url" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="https://drive.google.com/..." value={newUrl} onChange={e => setNewUrl(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">sau</span>
                <label className="cursor-pointer text-xs text-aep-600 hover:underline">
                  {uploading ? 'Se încarcă...' : '📎 Încarcă fișier (PDF/PPT)'}
                  <input type="file" accept=".pdf,.ppt,.pptx" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                {newUrl && newUrl.includes('vercel-storage') && (
                  <span className="text-xs text-green-600">✓ Fișier încărcat</span>
                )}
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button onClick={handleAdd} disabled={!newTitle || !newUrl}
                className="w-full px-4 py-2 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700 disabled:opacity-50">
                + Adaugă material
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminContent() {
  const [tab, setTab] = useState<'categories' | 'modules' | 'lessons'>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [error, setError] = useState('')
  const [materialsModule, setMaterialsModule] = useState<{ id: string; title: string } | null>(null)

  const [filterCategory, setFilterCategory] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortTitle, setSortTitle] = useState<'' | 'asc' | 'desc'>('')
  const [sortLessons, setSortLessons] = useState<'' | 'asc' | 'desc'>('')
  const [sortOrder, setSortOrder] = useState<'' | 'asc' | 'desc'>('asc')
  const [searchTitle, setSearchTitle] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      if (tab === 'categories') {
        const r = await apiFetch('/api/admin/content?resource=categories')
        setCategories((await r.json()).data || [])
      } else if (tab === 'modules') {
        const [mr, cr] = await Promise.all([apiFetch('/api/admin/content?resource=modules'), apiFetch('/api/admin/content?resource=categories')])
        setModules((await mr.json()).data || [])
        setCategories((await cr.json()).data || [])
      } else {
        const [lr, mr] = await Promise.all([apiFetch('/api/admin/content?resource=lessons'), apiFetch('/api/admin/content?resource=modules')])
        setLessons((await lr.json()).data || [])
        setModules((await mr.json()).data || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    setFilterCategory(''); setFilterModule(''); setFilterStatus('')
    setSortTitle(''); setSortLessons(''); setSortOrder('asc'); setSearchTitle('')
    load()
  }, [tab])

  const filteredItems = useMemo(() => {
    let items: any[] = (tab === 'categories' ? categories : tab === 'modules' ? modules : lessons) ?? []
    if (searchTitle) items = items.filter(i => i.title.toLowerCase().includes(searchTitle.toLowerCase()))
    if (filterCategory && tab === 'modules') items = items.filter(i => i.categoryId === filterCategory)
    if (filterModule && tab === 'lessons') items = items.filter(i => i.moduleId === filterModule)
    if (filterStatus === 'published') items = items.filter(i => i.published)
    if (filterStatus === 'draft') items = items.filter(i => !i.published)
    items = [...items].sort((a, b) => {
      if (sortTitle) { const r = a.title.toLowerCase().localeCompare(b.title.toLowerCase()); return sortTitle === 'asc' ? r : -r }
      if (sortLessons) { const r = (a._count?.lessons ?? 0) - (b._count?.lessons ?? 0); return sortLessons === 'asc' ? r : -r }
      if (sortOrder) { const r = (a.order ?? 0) - (b.order ?? 0); return sortOrder === 'asc' ? r : -r }
      return 0
    })
    return items
  }, [tab, categories, modules, lessons, searchTitle, filterCategory, filterModule, filterStatus, sortTitle, sortLessons, sortOrder])

  const resetFilters = () => {
    setFilterCategory(''); setFilterModule(''); setFilterStatus('')
    setSortTitle(''); setSortLessons(''); setSortOrder('asc'); setSearchTitle('')
  }

  const hasActiveFilters = filterCategory || filterModule || filterStatus || sortTitle || sortLessons || searchTitle

  const openAdd = () => { setEditItem(null); setFormData(emptyForm); setError(''); setShowForm(true) }
  const openEdit = (item: any) => {
    setEditItem(item)
    setFormData({ title: item.title || '', slug: item.slug || '', description: item.description || '', order: item.order || 0, published: item.published || false, categoryId: item.categoryId || '', moduleId: item.moduleId || '', videoUrl: item.videoUrl || '', externalUrl: item.externalUrl || '', minWatchPercentForTest: item.minWatchPercentForTest || 0 })
    setError(''); setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const method = editItem ? 'PUT' : 'POST'
    const url = editItem ? `/api/admin/content?resource=${tab}&id=${editItem.id}` : `/api/admin/content?resource=${tab}`
    let body: any = { ...formData }
    if (tab === 'lessons') body = { title: formData.title, description: formData.description, moduleId: formData.moduleId, videoUrl: formData.videoUrl || null, externalUrl: formData.externalUrl || null, order: formData.order, published: formData.published, minWatchPercentForTest: formData.minWatchPercentForTest }
    const r = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'Eroare la salvare'); return }
    setShowForm(false); load()
  }

  const togglePublished = async (id: string, published: boolean, resource: string) => {
    await apiFetch(`/api/admin/content?resource=${resource}&id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !published }) })
    load()
  }

  const deleteItem = async (id: string, resource: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest element?')) return
    await apiFetch(`/api/admin/content?resource=${resource}&id=${id}`, { method: 'DELETE' })
    load()
  }

  const SortOptions = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 px-2 pt-1">Sortare</p>
      {[['asc', '↑ Crescător'], ['desc', '↓ Descrescător'], ['', 'Fără sortare']].map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 ${value === v ? 'text-aep-600 font-medium bg-aep-50' : 'text-gray-700'}`}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {materialsModule && (
        <MaterialsManager
          moduleId={materialsModule.id}
          moduleTitle={materialsModule.title}
          onClose={() => setMaterialsModule(null)}
          onMaterialAdded={load}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestionare conținut</h1>
        <button onClick={openAdd} className="px-4 py-2 rounded-lg bg-aep-600 text-white text-sm font-medium hover:bg-aep-700">+ Adaugă</button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['categories', 'modules', 'lessons'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'categories' ? 'Categorii' : t === 'modules' ? 'Module' : 'Lecții'}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {t === 'categories' ? categories.length : t === 'modules' ? modules.length : lessons.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          {hasActiveFilters && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <span className="text-xs text-blue-600">{filteredItems.length} rezultate filtrate</span>
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">✕ Resetează filtrele</button>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3">
                  <ColumnDropdown label="Titlu">
                    <div className="pb-2 border-b border-gray-100 mb-2">
                      <input type="text" placeholder="Caută titlu..." value={searchTitle}
                        onChange={e => setSearchTitle(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    <SortOptions value={sortTitle} onChange={v => { setSortTitle(v as any); setSortLessons(''); setSortOrder('') }} />
                  </ColumnDropdown>
                </th>
                {tab === 'modules' && (
                  <th className="text-left px-4 py-3">
                    <ColumnDropdown label="Categorie">
                      <p className="text-xs text-gray-400 px-2 pt-1 pb-1">Filtrează</p>
                      {[['', 'Toate categoriile'], ...(categories || []).map(c => [c.id, c.title])].map(([v, label]) => (
                        <button key={v} onClick={() => setFilterCategory(v)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 ${filterCategory === v ? 'text-aep-600 font-medium bg-aep-50' : 'text-gray-700'}`}>
                          {label}
                        </button>
                      ))}
                    </ColumnDropdown>
                  </th>
                )}
                {tab === 'lessons' && (
                  <th className="text-left px-4 py-3">
                    <ColumnDropdown label="Modul">
                      <p className="text-xs text-gray-400 px-2 pt-1 pb-1">Filtrează</p>
                      {[['', 'Toate modulele'], ...(modules || []).map(m => [m.id, `${m.title} — ${m.category?.title || ''}`])].map(([v, label]) => (
                        <button key={v} onClick={() => setFilterModule(v)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 ${filterModule === v ? 'text-aep-600 font-medium bg-aep-50' : 'text-gray-700'}`}>
                          {label}
                        </button>
                      ))}
                    </ColumnDropdown>
                  </th>
                )}
                <th className="text-left px-4 py-3">
                  <ColumnDropdown label="Status">
                    <p className="text-xs text-gray-400 px-2 pt-1 pb-1">Filtrează</p>
                    {[['', 'Toate'], ['published', '✅ Publicat'], ['draft', '⏳ Draft']].map(([v, label]) => (
                      <button key={v} onClick={() => setFilterStatus(v)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm hover:bg-gray-50 ${filterStatus === v ? 'text-aep-600 font-medium bg-aep-50' : 'text-gray-700'}`}>
                        {label}
                      </button>
                    ))}
                  </ColumnDropdown>
                </th>
                {tab !== 'lessons' && (
                  <th className="text-left px-4 py-3">
                    <ColumnDropdown label="Conținut">
                      <SortOptions value={sortLessons} onChange={v => { setSortLessons(v as any); setSortTitle(''); setSortOrder('') }} />
                    </ColumnDropdown>
                  </th>
                )}
                {tab !== 'categories' && (
                  <th className="text-left px-4 py-3">
                    <ColumnDropdown label="Ordine">
                      <SortOptions value={sortOrder} onChange={v => { setSortOrder(v as any); setSortTitle(''); setSortLessons('') }} />
                    </ColumnDropdown>
                  </th>
                )}
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {hasActiveFilters ? 'Niciun rezultat pentru filtrele aplicate' : 'Niciun element adăugat încă'}
                </td></tr>
              ) : filteredItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.slug && <div className="text-xs text-gray-400 mt-0.5">{item.slug}</div>}
                    {item.description && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.description}</div>}
                  </td>
                  {tab === 'modules' && <td className="px-4 py-3 text-gray-500 text-xs">{item.category?.title || '—'}</td>}
                  {tab === 'lessons' && (
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.module?.title || '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.published ? 'Publicat' : 'Draft'}
                    </span>
                  </td>
                  {tab !== 'lessons' && (
                    <td className="px-4 py-3 text-gray-500">
                      {item._count?.modules !== undefined ? `${item._count.modules} module` : `${item._count?.lessons || 0} lecții · ${item._count?.materials || 0} materiale`}
                    </td>
                  )}
                  {tab !== 'categories' && <td className="px-4 py-3 text-gray-400 text-xs">{item.order ?? 0}</td>}
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50">Modifică</button>
                    {tab === 'modules' && (
                      <button onClick={() => setMaterialsModule({ id: item.id, title: item.title })}
                        className="text-xs px-2 py-1 rounded border border-purple-200 text-purple-600 hover:bg-purple-50">
                        Materiale
                      </button>
                    )}
                    <button onClick={() => togglePublished(item.id, item.published, tab)} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">{item.published ? 'Ascunde' : 'Publică'}</button>
                    <button onClick={() => deleteItem(item.id, tab)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">Șterge</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editItem ? 'Modifică' : 'Adaugă'} {tab === 'categories' ? 'categorie' : tab === 'modules' ? 'modul' : 'lecție video'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Titlu *</label>
                <input type="text" placeholder="Titlu" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value, slug: (editItem || tab === 'lessons') ? p.slug : e.target.value.toLowerCase().replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ț/g,'t').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') }))} />
              </div>
              {tab === 'categories' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slug (URL) *</label>
                  <input type="text" placeholder="slug-url" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} />
                </div>
              )}
              {tab === 'modules' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Categorie *</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}>
                    <option value="">Selectează categoria</option>
                    {(categories || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
              {tab === 'lessons' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Modul *</label>
                    <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formData.moduleId} onChange={e => setFormData(p => ({ ...p, moduleId: e.target.value }))}>
                      <option value="">Selectează modulul</option>
                      {(modules || []).map(m => <option key={m.id} value={m.id}>{m.title} — {m.category?.title || ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">🎬 URL Video *</label>
                    <input type="url" placeholder="https://www.youtube.com/embed/..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formData.videoUrl} onChange={e => setFormData(p => ({ ...p, videoUrl: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">YouTube: youtube.com/embed/ID_VIDEO</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">🔗 Link extern (opțional)</label>
                    <input type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formData.externalUrl} onChange={e => setFormData(p => ({ ...p, externalUrl: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">% minim vizionare pentru test (0 = fără restricție)</label>
                    <input type="number" min={0} max={100} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formData.minWatchPercentForTest} onChange={e => setFormData(p => ({ ...p, minWatchPercentForTest: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    📎 Materialele PDF/PPT se adaugă din tab-ul <strong>Module → Materiale</strong>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Descriere</label>
                <textarea placeholder="Descriere (opțional)" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ordine afișare</label>
                <input type="number" min={0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.order} onChange={e => setFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={formData.published} onChange={e => setFormData(p => ({ ...p, published: e.target.checked }))} />
                Publică imediat (vizibil utilizatorilor)
              </label>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Anulează</button>
                <button type="submit" className="px-4 py-2 text-sm bg-aep-600 text-white rounded-lg hover:bg-aep-700">{editItem ? 'Salvează' : 'Adaugă'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
