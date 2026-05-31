'use client'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import { COUNTIES } from '@/lib/counties'

interface Event {
  id: string
  title: string
  description?: string
  countyCode?: string
  startAt: string
  endAt: string
  location?: string
  onlineLink?: string
  targetAudience?: string
  published: boolean
  county?: { name: string }
}

const emptyForm = { title: '', description: '', countyCode: '', startAt: '', endAt: '', location: '', onlineLink: '', targetAudience: '', published: false }

export default function AdminCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadEvents() }, [])

  const loadEvents = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/calendar')
    const d = await r.json()
    setEvents(d.data || [])
    setLoading(false)
  }

  const openNew = () => { setEditEvent(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (ev: Event) => {
    setEditEvent(ev)
    setForm({ title: ev.title, description: ev.description || '', countyCode: ev.countyCode || '',
      startAt: ev.startAt.slice(0, 16), endAt: ev.endAt.slice(0, 16),
      location: ev.location || '', onlineLink: ev.onlineLink || '',
      targetAudience: ev.targetAudience || '', published: ev.published })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editEvent ? 'PUT' : 'POST'
    const url = editEvent ? `/api/admin/calendar?id=${editEvent.id}` : '/api/admin/calendar'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { setShowForm(false); loadEvents() }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Ștergi evenimentul?')) return
    await fetch(`/api/admin/calendar?id=${id}`, { method: 'DELETE' })
    loadEvents()
  }

  const fi = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar evenimente</h1>
        <button onClick={openNew} className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700">
          + Eveniment nou
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titlu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Județ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.county?.name || ev.countyCode || 'Național'}</td>
                  <td className="px-4 py-3 text-gray-500">{format(parseISO(ev.startAt), 'dd.MM.yyyy HH:mm', { locale: ro })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ev.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {ev.published ? 'Publicat' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(ev)} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">Editează</button>
                    <button onClick={() => deleteEvent(ev.id)} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">Șterge</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-4">{editEvent ? 'Editează eveniment' : 'Eveniment nou'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Titlu eveniment" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.title} onChange={e => fi('title', e.target.value)} />
              <textarea placeholder="Descriere" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.description} onChange={e => fi('description', e.target.value)} />
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.countyCode} onChange={e => fi('countyCode', e.target.value)}>
                <option value="">Național (toate județele)</option>
                {COUNTIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Data/ora start</label>
                  <input type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                    value={form.startAt} onChange={e => fi('startAt', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Data/ora final</label>
                  <input type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                    value={form.endAt} onChange={e => fi('endAt', e.target.value)} />
                </div>
              </div>
              <input type="text" placeholder="Locație" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.location} onChange={e => fi('location', e.target.value)} />
              <input type="url" placeholder="Link online (Zoom, Teams etc.)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.onlineLink} onChange={e => fi('onlineLink', e.target.value)} />
              <input type="text" placeholder="Public țintă (ex: Experți electorali)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.targetAudience} onChange={e => fi('targetAudience', e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.published} onChange={e => fi('published', e.target.checked)} />
                Publică evenimentul
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
