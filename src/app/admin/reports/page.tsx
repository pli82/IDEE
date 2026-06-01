'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#1A5FA8', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#059669']

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'users' | 'tests' | 'stats'>('users')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [tableData, setTableData] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const r = await fetch('/api/admin/reports/stats', { credentials: 'include' })
      const d = await r.json()
      setStats(d)
    } finally { setStatsLoading(false) }
  }

  const loadTable = async () => {
    setTableLoading(true)
    setTableData([])
    try {
      const endpoint = activeTab === 'users' ? 'progress' : 'tests'
      const r = await fetch(
        `/api/admin/reports/${endpoint}?format=json&from=${dateFrom}&to=${dateTo}`,
        { credentials: 'include' }
      )
      const d = await r.json()
      setTableData(d.data || [])
    } finally { setTableLoading(false) }
  }

  useEffect(() => {
    if (activeTab !== 'stats') loadTable()
  }, [activeTab, dateFrom, dateTo])

  const exportData = (format: 'csv' | 'xlsx') => {
    const endpoint = activeTab === 'users' ? 'progress' : activeTab === 'tests' ? 'tests' : 'audit'
    window.open(`/api/admin/reports/${endpoint}?format=${format}&from=${dateFrom}&to=${dateTo}`, '_blank')
  }

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filteredData = tableData
    .filter(row => !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (!sortCol) return 0
      const va = String(a[sortCol] ?? '').toLowerCase()
      const vb = String(b[sortCol] ?? '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Rapoarte și statistici</h1>
        {activeTab !== 'stats' && (
          <div className="flex gap-2">
            <button onClick={() => exportData('csv')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
              📄 Export CSV
            </button>
            <button onClick={() => exportData('xlsx')}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1.5">
              📊 Export Excel
            </button>
          </div>
        )}
        {activeTab === 'stats' && (
          <button onClick={loadStats} disabled={statsLoading}
            className="px-3 py-1.5 bg-aep-600 text-white rounded-lg text-sm hover:bg-aep-700 disabled:opacity-50">
            {statsLoading ? 'Se încarcă...' : '↻ Reîncarcă grafice'}
          </button>
        )}
      </div>

      {/* Filtre */}
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
        {activeTab !== 'stats' && (
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-600 block mb-1">Caută</label>
            <input type="text" placeholder="Caută în rezultate..."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
        {activeTab !== 'stats' && (
          <div className="text-xs text-gray-400 self-end pb-1.5">
            {filteredData.length} / {tableData.length} înregistrări
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['users', 'tests', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'users' ? 'Progres utilizatori' : t === 'tests' ? 'Rezultate teste' : 'Grafice'}
          </button>
        ))}
      </div>

      {/* Tabel date */}
      {(activeTab === 'users' || activeTab === 'tests') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {tableLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search ? 'Niciun rezultat pentru căutarea efectuată' : 'Nu există date pentru perioada selectată'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-aep-700 text-white sticky top-0">
                  <tr>
                    {columns.map(col => (
                      <th key={col}
                        onClick={() => toggleSort(col)}
                        className="text-left px-3 py-2.5 font-medium cursor-pointer hover:bg-aep-600 whitespace-nowrap select-none">
                        <div className="flex items-center gap-1">
                          {col}
                          {sortCol === col
                            ? <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                            : <span className="text-aep-300"> ↕</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {columns.map(col => {
                        const val = row[col]
                        const isPromovat = col === 'Promovat'
                        const isStatus = col === 'Status'
                        const isCorect = val === 'CORECT'
                        const isGresit = val === 'GREȘIT'
                        return (
                          <td key={col} className="px-3 py-2 whitespace-nowrap">
                            {isPromovat ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val === 'DA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {val}
                              </span>
                            ) : isStatus ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val === 'Completat' ? 'bg-green-100 text-green-700' : val === 'În curs' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                {val}
                              </span>
                            ) : isCorect ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓ Corect</span>
                            ) : isGresit ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">✗ Greșit</span>
                            ) : (
                              <span className="text-gray-700">{String(val ?? '—')}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grafice */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {!stats ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
              <p className="text-gray-500 mb-4">Apăsați butonul pentru a încărca statisticile</p>
              <button onClick={loadStats} disabled={statsLoading}
                className="px-4 py-2 bg-aep-600 text-white rounded-lg text-sm disabled:opacity-50">
                {statsLoading ? 'Se încarcă...' : 'Încarcă statistici'}
              </button>
            </div>
          ) : (
            <>
              {/* Sumar */}
              {stats.summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total utilizatori', value: stats.summary.totalUsers, color: 'text-aep-700' },
                    { label: 'Utilizatori activi', value: stats.summary.activeUsers, color: 'text-green-600' },
                    { label: 'Total tentative', value: stats.summary.totalAttempts, color: 'text-blue-600' },
                    { label: 'Tentative promovate', value: stats.summary.passedAttempts, color: 'text-green-600' },
                    { label: 'Rată promovare globală', value: `${stats.summary.globalPassRate}%`, color: 'text-aep-700' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

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
            </>
          )}
        </div>
      )}
    </div>
  )
}
