'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aep-700 to-aep-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recuperare parolă</h2>
          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                ✓ Dacă adresa <strong>{email}</strong> este înregistrată, veți primi un link de resetare în câteva minute.
              </div>
              <p className="text-sm text-gray-500">Verificați și folderul Spam dacă nu primiți emailul.</p>
              <Link href="/auth/login" className="btn-primary w-full text-center block py-2.5 rounded-lg">
                Înapoi la autentificare
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-6">Introduceți adresa de email asociată contului dvs.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" required className="input" placeholder="adresa@email.ro"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Se trimite...' : 'Trimite link de resetare'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link href="/auth/login" className="text-aep-600 hover:underline">← Înapoi la autentificare</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
