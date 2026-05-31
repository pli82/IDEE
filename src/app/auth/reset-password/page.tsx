'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Parolele nu coincid'); return }
    setError(''); setLoading(true)
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error || 'Link invalid sau expirat'); return }
    setDone(true)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900 p-4">
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-red-600">Link de resetare invalid.</p>
        <Link href="/auth/forgot-password" className="text-aep-600 hover:underline mt-2 block">Solicită un link nou</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Parolă nouă</h2>
          {done ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
              ✓ Parola a fost schimbată. Vei fi redirecționat la autentificare...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Parolă nouă *</label>
                <input type="password" required className="input"
                  placeholder="Min. 8 caractere, literă mare, cifră, special"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">Confirmă parola *</label>
                <input type="password" required className="input"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Se salvează...' : 'Setează parola nouă'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
