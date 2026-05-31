'use client'
import { useState, useEffect } from 'react'
import { COUNTIES } from '@/lib/counties'

const STUDII_OPTIONS = ['Liceale', 'Postliceale', 'Universitare (licență)', 'Master', 'Doctorat', 'Alt nivel de studii']
const CALITATE_OPTIONS = [
  'Expert electoral înscris în Corpul experților electorali',
  'Persoană care dorește să participe la examenul de admitere în Corpul experților electorali',
  'Operator de calculator în cadrul birourilor electorale',
  'Membru birou electoral',
  'Alt rol în procesul electoral',
]

interface Profile {
  email: string
  profile: {
    nume: string; prenume: string; dataNasterii: string; sex: string
    adresa: string; judetCode: string; serieCI: string; numarCI: string; dataExpirareCI: string
    studii: string; calitate: string; phone: string; profileComplete: boolean; gdprConsentAt: string
  } | null
}

export default function ProfilePage() {
  const [data, setData] = useState<Profile | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [ciWarning, setCiWarning] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      setData(d.data)
      if (d.data?.profile) {
        const p = d.data.profile
        setForm({
          nume: p.nume || '', prenume: p.prenume || '',
          dataNasterii: p.dataNasterii ? p.dataNasterii.slice(0, 10) : '',
          sex: p.sex || '', adresa: p.adresa || '', judetCode: p.judetCode || '',
          serieCI: p.serieCI || '', numarCI: p.numarCI || '',
          dataExpirareCI: p.dataExpirareCI ? p.dataExpirareCI.slice(0, 10) : '',
          studii: p.studii || '', calitate: p.calitate || '',
          phone: d.data.phone || '',
        })
        // Verificare CI
        if (p.dataExpirareCI) {
          const expDate = new Date(p.dataExpirareCI)
          const now = new Date()
          const diffDays = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays < 30) setCiWarning(true)
        }
      }
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const r = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    setSaving(false)
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    else setError(d.error || 'Eroare la salvare')
  }

  const fi = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  if (!data) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profilul meu</h1>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Salvat</span>}
      </div>

      {ciWarning && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          ⚠️ <strong>Atenție:</strong> Cartea dvs. de identitate este expirată sau expiră în curând. 
          Pentru actualizarea datelor, vă rugăm să contactați AEP conform instrucțiunilor.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prenume *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.prenume || ''} onChange={e => fi('prenume', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
            <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.nume || ''} onChange={e => fi('nume', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" disabled className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" value={data.email} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
            <input type="tel" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.phone || ''} onChange={e => fi('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data nașterii *</label>
            <input type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.dataNasterii || ''} onChange={e => fi('dataNasterii', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.sex || ''} onChange={e => fi('sex', e.target.value)}>
              <option value="">Selectați</option>
              <option value="M">Masculin</option>
              <option value="F">Feminin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Județ *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.judetCode || ''} onChange={e => fi('judetCode', e.target.value)}>
              <option value="">Selectați județul</option>
              {COUNTIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Studii *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.studii || ''} onChange={e => fi('studii', e.target.value)}>
              <option value="">Selectați</option>
              {STUDII_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calitate *</label>
          <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.calitate || ''} onChange={e => fi('calitate', e.target.value)}>
            <option value="">Selectați calitatea</option>
            {CALITATE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresă</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.adresa || ''} onChange={e => fi('adresa', e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Serie CI</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase" value={form.serieCI || ''} onChange={e => fi('serieCI', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Număr CI</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.numarCI || ''} onChange={e => fi('numarCI', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Expiră CI</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.dataExpirareCI || ''} onChange={e => fi('dataExpirareCI', e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700 disabled:opacity-60">
          {saving ? 'Se salvează...' : 'Salvează modificările'}
        </button>
      </form>
    </div>
  )
}
