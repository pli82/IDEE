'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#1A5FA8', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#059669']

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'users' | 'tests' | 'stats'>('users')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/reports?type=stats')
      const d = await r.json()
      setStats(d)
    } finally { setLoading(false) }
  }

  const exportData = (format: 'csv' | 'xlsx') => {
    const url = `/api/admin/reports?type=${activeTab}&format=${format}&from=${dateFrom}&to=${dateTo}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapoarte și statistici</h1>
        <div className="flex gap-2">
          <button onClick={() => exportData('csv')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Export CSV
          </button>
          <button onClick={() => exportData('xlsx')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            Export Excel
          </button>
          <button onClick={loadStats} className="px-3 py-1.5 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700">
            Reîncarcă grafice
          </button>
        </div>
      </div>

      {/* Filtre perioadă */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-600 block mb-1">De la</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Până la</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['users', 'tests', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'users' ? 'Utilizatori' : t === 'tests' ? 'Teste' : 'Grafice'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {!stats ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <p className="text-gray-500 mb-4">Apăsați "Reîncarcă grafice" pentru a încărca statisticile</p>
              <button onClick={loadStats} disabled={loading} className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm">
                {loading ? 'Se încarcă...' : 'Încarcă statistici'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Utilizatori pe județe (top 15)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.usersByCounty?.slice(0, 15) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="county" width={30} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1A5FA8" name="Utilizatori" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Distribuție calitate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stats.usersByCalitate || []} dataKey="count" nameKey="calitate" cx="50%" cy="50%" outerRadius={100} label>
                      {(stats.usersByCalitate || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4">Rată promovare pe teste</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.passRateByModule || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Bar dataKey="passRate" fill="#16A34A" name="Rată promovare" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
      
      {(activeTab === 'users' || activeTab === 'tests') && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 mb-4">Exportați datele pentru raportul selectat</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => exportData('csv')} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              📄 Export CSV
            </button>
            <button onClick={() => exportData('xlsx')} className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              📊 Export Excel (.xlsx)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
