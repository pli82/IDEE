'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CALITATE_OPTIONS = [
  'Expert electoral înscris în Corpul experților electorali',
  'Persoană care dorește să participe la examenul de admitere în Corpul experților electorali',
  'Operator de calculator în cadrul birourilor electorale',
  'Membru birou electoral',
  'Alt rol în procesul electoral',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', phone: '', calitate: '' })
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCalitateModal, setShowCalitateModal] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Parolele nu coincid'); return }
    setError(''); setLoading(true)
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password, phone: form.phone }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error || 'Eroare la înregistrare'); return }
    setShowCalitateModal(true)
  }

  const handleCalitateSelect = (c: string) => {
    setForm(p => ({ ...p, calitate: c }))
    setShowCalitateModal(false)
    setStep('otp')
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const r = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, code: otp }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error || 'Cod incorect'); return }
    router.push('/profile/complete')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-aep-700 font-bold text-xl">AEP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Instruire Online</h1>
          <p className="text-blue-200 text-sm mt-1">Autoritatea Electorală Permanentă</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'form' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Creare cont nou</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Email *</label>
                  <input type="email" required className="input" placeholder="adresa@email.ro"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input type="tel" className="input" placeholder="07xx xxx xxx"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Parolă *</label>
                  <input type="password" required className="input" placeholder="Min. 8 caractere, literă mare, cifră, special"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Confirmă parola *</label>
                  <input type="password" required className="input"
                    value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <input type="checkbox" required className="mt-0.5 flex-shrink-0" id="gdpr" />
                  <label htmlFor="gdpr">
                    Sunt de acord cu{' '}
                    <Link href="/termeni-utilizare" target="_blank" className="text-aep-600 hover:underline">Termenii de utilizare</Link>
                    {' '}și{' '}
                    <Link href="/politica-confidentialitate" target="_blank" className="text-aep-600 hover:underline">Politica de confidențialitate</Link>
                  </label>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Se creează contul...' : 'Creează cont'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                Ai deja cont?{' '}
                <Link href="/auth/login" className="text-aep-600 font-medium hover:underline">Autentificare</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verificare email</h2>
              <p className="text-gray-500 text-sm mb-6">
                Am trimis un cod de 6 cifre la <strong>{form.email}</strong>. Introduceți-l mai jos:
              </p>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input type="text" required maxLength={6} pattern="[0-9]{6}"
                  className="input text-center text-2xl tracking-widest font-bold"
                  placeholder="000000" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full justify-center">
                  {loading ? 'Se verifică...' : 'Verifică codul'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal calitate — obligatoriu */}
      {showCalitateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ce calitate aveți?</h2>
            <p className="text-sm text-gray-500 mb-5">Alegeți calitatea deținută în procesul electoral. Aceasta va fi inclusă în profilul dvs.</p>
            <div className="space-y-2">
              {CALITATE_OPTIONS.map(opt => (
                <button key={opt} onClick={() => handleCalitateSelect(opt)}
                  className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-aep-400 hover:bg-aep-50 text-sm font-medium text-gray-800 transition-colors">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
