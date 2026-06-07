'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CALITATE_OPTIONS = [
  'Expert electoral (Corpul Experților Electorali)',
  'Membru de partid',
  'Persoană care dorește să facă parte din Corpul Experților Electorali',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', phone: '', calitate: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Parolele nu coincid'); return }
    if (!form.calitate) { setError('Selectează calitatea deținută'); return }
    setError(''); setLoading(true)
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password, phone: form.phone, calitate: form.calitate }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error || 'Eroare la înregistrare'); return }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-600 to-aep-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-aep-600 font-bold text-xl">AEP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Instruire online – IDEE_ROAEP.</h1>
          <p className="text-blue-200 text-sm mt-1">Conectează-te pentru a continua călătoria ta educațională</p>
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
                  <label className="label">Telefon *</label>
                  <input type="tel" required className="input" placeholder="07xx xxx xxx"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Parolă *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required className="input pr-10"
                      placeholder="Min. 8 caractere, literă mare, cifră, special"
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirmă parola *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required className="input pr-10"
                      value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Calitate *</label>
                  <select required className="input"
                    value={form.calitate}
                    onChange={e => setForm(p => ({ ...p, calitate: e.target.value }))}>
                    <option value="">Selectează calitatea deținută</option>
                    {CALITATE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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

              {/* Chenar informativ */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                După completarea corectă a datelor, vei primi un e-mail de confirmare necesar pentru activarea contului.
              </div>

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
              <button onClick={() => setStep('form')} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600">
                ← Înapoi la formular
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
