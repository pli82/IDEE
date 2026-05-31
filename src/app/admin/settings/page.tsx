'use client'
import { useState, useEffect } from 'react'

const SETTING_GROUPS = [
  { key: 'app.name', label: 'Numele aplicației', type: 'text' },
  { key: 'homepage.presentation', label: 'Text prezentare homepage', type: 'textarea' },
  { key: 'app.logo_url', label: 'URL logo AEP', type: 'text' },
  { key: 'gdpr.policy_version', label: 'Versiunea politicii GDPR', type: 'text' },
  { key: 'gdpr.terms_text', label: 'Text termeni utilizare', type: 'textarea' },
  { key: 'ci.update_instructions', label: 'Instrucțiuni actualizare CI (text)', type: 'textarea' },
  { key: 'otp.expires_minutes', label: 'Expirare OTP (minute)', type: 'number' },
  { key: 'auth.max_failed_attempts', label: 'Maxim încercări autentificare', type: 'number' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(d.data || {}))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Setări aplicație</h1>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Salvat cu succes</span>}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {SETTING_GROUPS.map(s => (
          <div key={s.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{s.label}</label>
            <p className="text-xs text-gray-400 mb-1.5">Cheie: <code className="bg-gray-100 px-1 rounded">{s.key}</code></p>
            {s.type === 'textarea' ? (
              <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={settings[s.key] || ''}
                onChange={e => setSettings(p => ({ ...p, [s.key]: e.target.value }))} />
            ) : (
              <input type={s.type} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={settings[s.key] || ''}
                onChange={e => setSettings(p => ({ ...p, [s.key]: e.target.value }))} />
            )}
          </div>
        ))}
        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-aep-600 text-white rounded-lg text-sm font-medium hover:bg-aep-700 disabled:opacity-60">
            {saving ? 'Se salvează...' : 'Salvează setările'}
          </button>
        </div>
      </form>
    </div>
  )
}
