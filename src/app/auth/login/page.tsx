'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Eroare la autentificare'); setLoading(false); return }
      const returnTo = searchParams.get('returnTo') || d.data?.redirectTo || '/dashboard'
      router.push(returnTo)
    } catch { setError('Eroare de rețea'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-aep-700 font-bold text-xl">AEP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Instruire Online</h1>
          <p className="text-blue-200 text-sm mt-1">Conectează-te pentru a continua călătoria ta educațională</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Autentificare</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" required autoComplete="email" className="input"
                placeholder="adresa@email.ro" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Parolă *</label>
              <input type="password" required autoComplete="current-password" className="input"
                placeholder="Parola dvs." value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm" role="alert">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Se autentifică...' : 'Autentificare'}
            </button>
          </form>
          <div className="mt-6 space-y-3 text-center text-sm">
            <p><Link href="/auth/forgot-password" className="text-aep-600 hover:underline">Ai uitat parola?</Link></p>
            <p className="text-gray-500">Nu ai cont?{' '}
              <Link href="/auth/register" className="text-aep-600 font-medium hover:underline">Înregistrare cont nou</Link>
            </p>
            <p><Link href="/" className="text-gray-400 hover:text-gray-600 text-xs">← Înapoi la pagina principală</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900"><div className="text-white">Se încarcă...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
