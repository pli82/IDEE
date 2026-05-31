'use client'
import { useState, useEffect } from 'react'

interface User {
  id: string; email: string; status: string; emailVerified: boolean
  createdAt: string; lastLoginAt: string | null
  profile: { nume: string; prenume: string; judetCode: string; calitate: string; studii: string; profileComplete: boolean; sex: string } | null
  roles: { role: string }[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const r = await fetch(`/api/admin/users?${params}`)
    const d = await r.json()
    setUsers(d.data || [])
    setTotal(d.total || 0)
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadUsers() }

  const exportUsers = (fmt: 'csv' | 'xlsx') => {
    window.open(`/api/admin/users/export?format=${fmt}`, '_blank')
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/users?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadUsers()
    setSelected(null)
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Activ', PENDING: 'În așteptare', SUSPENDED: 'Suspendat', DELETED: 'Șters'
  }
  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    SUSPENDED: 'bg-red-100 text-red-600',
    DELETED: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilizatori</h1>
          <p className="text-sm text-gray-500 mt-1">{total} utilizatori înregistrați</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportUsers('csv')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">CSV</button>
          <button onClick={() => exportUsers('xlsx')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Excel</button>
        </div>
      </div>

      {/* Filtre */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
        <input type="text" placeholder="Caută email, nume..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Toate statusurile</option>
          <option value="ACTIVE">Activ</option>
          <option value="PENDING">În așteptare</option>
          <option value="SUSPENDED">Suspendat</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">Caută</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Utilizator</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Județ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Calitate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Profil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Înregistrat</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {u.profile ? `${u.profile.prenume} ${u.profile.nume}`.trim() || u.email : u.email}
                    </div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.profile?.judetCode || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{u.profile?.calitate || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[u.status] || ''}`}>
                      {statusLabel[u.status] || u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${u.profile?.profileComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                      {u.profile?.profileComplete ? 'Complet' : 'Incomplet'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('ro')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(u)} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100">
                      Detalii
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Paginare */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Pagina {page} din {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">
                ← Înapoi
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">
                Următor →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalii utilizator */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Detalii utilizator</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd className="font-medium">{selected.email}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Nume:</dt><dd>{selected.profile ? `${selected.profile.prenume} ${selected.profile.nume}` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Județ:</dt><dd>{selected.profile?.judetCode || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Calitate:</dt><dd>{selected.profile?.calitate || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Sex:</dt><dd>{selected.profile?.sex || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Studii:</dt><dd>{selected.profile?.studii || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status cont:</dt><dd>{selected.status}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Email verificat:</dt><dd>{selected.emailVerified ? 'Da' : 'Nu'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Profil complet:</dt><dd>{selected.profile?.profileComplete ? 'Da' : 'Nu'}</dd></div>
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Schimbă status:</p>
              <div className="flex flex-wrap gap-2">
                {['ACTIVE', 'SUSPENDED'].map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${selected.status === s ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {s === 'ACTIVE' ? 'Activează' : 'Suspendă'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="mt-4 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Închide
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
