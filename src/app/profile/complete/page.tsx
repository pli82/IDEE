'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COUNTIES } from '@/lib/counties'

const STUDII_OPTIONS = ['Liceale', 'Postliceale', 'Universitare (licență)', 'Master', 'Doctorat', 'Alt nivel']

export default function ProfileCompletePage() {
  const router = useRouter()
  const [form, setForm] = useState({ prenume: '', nume: '', dataNasterii: '', sex: '', judetCode: '', studii: '', gdprConsent: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fi = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.gdprConsent) { setError('Consimțământul GDPR este obligatoriu'); return }
    setError(''); setLoading(true)
    const r = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error || 'Eroare la salvare'); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aep-600 to-aep-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-lg mb-3">
            <span className="text-aep-600 font-bold">AEP</span>
          </div>
          <h1 className="text-xl font-bold text-white">Completați profilul</h1>
          <p className="text-blue-200 text-sm mt-1">Datele sunt necesare pentru accesul la materialele de instruire</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Prenume *</label>
                <input required className="input" value={form.prenume} onChange={e => fi('prenume', e.target.value)} />
              </div>
              <div>
                <label className="label">Nume *</label>
                <input required className="input" value={form.nume} onChange={e => fi('nume', e.target.value)} />
              </div>
              <div>
                <label className="label">Data nașterii *</label>
                <input type="date" required className="input" value={form.dataNasterii} onChange={e => fi('dataNasterii', e.target.value)} />
              </div>
              <div>
                <label className="label">Sex *</label>
                <select required className="input" value={form.sex} onChange={e => fi('sex', e.target.value)}>
                  <option value="">Selectați</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
              </div>
              <div>
                <label className="label">Județ *</label>
                <select required className="input" value={form.judetCode} onChange={e => fi('judetCode', e.target.value)}>
                  <option value="">Selectați</option>
                  {COUNTIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Studii *</label>
                <select required className="input" value={form.studii} onChange={e => fi('studii', e.target.value)}>
                  <option value="">Selectați</option>
                  {STUDII_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 flex-shrink-0"
                  checked={form.gdprConsent} onChange={e => fi('gdprConsent', e.target.checked)} />
                <span className="text-sm text-gray-700">
                  Sunt de acord cu prelucrarea datelor cu caracter personal în conformitate cu{' '}
                  <a href="/politica-confidentialitate" target="_blank" className="text-aep-600 hover:underline font-medium">
                    Politica de confidențialitate
                  </a>. *
                </span>
              </label>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Se salvează...' : 'Salvează și continuă →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
