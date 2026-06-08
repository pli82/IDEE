'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#1A5FA8', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#BE185D', '#059669']

interface UserProgress {
  email: string; nume: string; prenume: string; judet: string; calitate: string
  totalModules: number; completedModules: number; overallPercent: number
  modules: {
    modul: string; categorie: string
    video: string; materiale: string; test: string; progres: string; procent: string
  }[]
}

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'users' | 'tests' | 'stats'>('users')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [rawData, setRawData] = useState<any[]>([])
  const [usersData, setUsersData] = useState<UserProgress[]>([])
  const [testsData, setTestsData] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})

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
    setRawData([])
    try {
      const endpoint = activeTab === 'users' ? 'progress' : 'tests'
      const r = await fetch(
        `/api/admin/reports/${endpoint}?format=json&from=${dateFrom}&to=${dateTo}`,
        { credentials: 'include' }
      )
      const d = await r.json()
      const data = d.data || []
      setRawData(data)

      if (activeTab === 'users') {
        const userMap: Record<string, UserProgress> = {}
        data.forEach((row: any) => {
          const key = row['Email']
          if (!userMap[key]) {
            userMap[key] = {
              email: row['Email'],
              nume: row['Nume'],
              prenume: row['Prenume'],
              judet: row['Județ'],
              calitate: row['Calitate'],
              totalModules: 0,
              completedModules: 0,
              overallPercent: 0,
              modules: [],
            }
          }
          userMap[key].modules.push({
            modul: row['Modul'],
            categorie: row['Categorie'],
            video: row['Video'],
            materiale: row['Materiale'],
            test: row['Test'],
            progres: row['Progres'],
            procent: row['Procent'],
          })
        })
        Object.values(userMap).forEach(u => {
          u.totalModules = u.modules.length
          u.completedModules = u.modules.filter(m => m.procent === '100%').length
          const percents = u.modules.map(m => parseInt(m.procent) || 0)
          u.overallPercent = percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0
        })
        setUsersData(Object.values(userMap))
      } else {
        setTestsData(data)
      }
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

  const toggleUser = (email: string) => {
    setExpandedUsers(p => ({ ...p, [email]: !p[email] }))
  }

  const filteredUsers = usersData
    .filter(u => !search || [u.email, u.nume, u.prenume, u.judet, u.calitate].some(v => v.toLowerCase().includes(search.toLowerCase())))

  const filteredTests = testsData
    .filter(row => !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (!sortCol) return 0
      const va = String(a[sortCol] ?? '').toLowerCase()
      const vb = String(b[sortCol] ?? '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const testColumns = testsData.length > 0 ? Object.keys(testsData[0]) : []

  return (
    <div className="space-y-6">
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
            {activeTab === 'users' ? filteredUsers.length : activeTab === 'tests' ? filteredTests.length : 0} înregistrări
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['users', 'tests', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === t ? 'border-aep-600 text-aep-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'users' ? 'Progres utilizatori' : t === 'tests' ? 'Rezultate teste' : 'Grafice'}
          </button>
        ))}
      </div>

      {/* Tabel progres utilizatori - expandabil */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {tableLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search ? 'Niciun rezultat pentru căutarea efectuată' : 'Nu există date pentru perioada selectată'}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-aep-700 text-white sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2.5 w-6"></th>
                  <th className="text-left px-3 py-2.5">Utilizator</th>
                  <th className="text-left px-3 py-2.5">Județ</th>
                  <th className="text-left px-3 py-2.5">Calitate</th>
                  <th className="text-left px-3 py-2.5">Module</th>
                  <th className="text-right px-3 py-2.5">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, i) => (
                  <>
                    <tr key={user.email}
                      className={`cursor-pointer hover:bg-gray-50 ${expandedUsers[user.email] ? 'bg-aep-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => toggleUser(user.email)}>
                      <td className="px-3 py-2.5">
                        <i className={`ti ${expandedUsers[user.email] ? 'ti-chevron-down' : 'ti-chevron-right'}`}
                          style={{ fontSize: '12px', color: '#6b7280' }} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-gray-900">{user.prenume} {user.nume}</div>
                        <div className="text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{user.judet}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{user.calitate}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-gray-600">{user.completedModules}/{user.totalModules} completate</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                          user.overallPercent === 100 ? 'bg-green-100 text-green-700' :
                          user.overallPercent >= 50 ? 'bg-blue-100 text-blue-700' :
                          user.overallPercent > 0 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {user.overallPercent}%
                        </span>
                      </td>
                    </tr>
                    {expandedUsers[user.email] && user.modules.map((mod, j) => (
                      <tr key={`${user.email}-${j}`} className="bg-aep-50/50 border-l-2 border-aep-300">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 pl-6" colSpan={1}>
                          <div className="font-medium text-gray-800">{mod.modul}</div>
                          <div className="text-gray-400 truncate max-w-xs">{mod.categorie}</div>
                        </td>
                        <td className="px-3 py-2" colSpan={2}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`flex items-center gap-1 ${mod.video.startsWith(mod.video.split('/')[1]) ? 'text-green-600' : 'text-gray-400'}`}>
                              <i className="ti ti-player-play" style={{ fontSize: '11px' }} />
                              Video: {mod.video}
                            </span>
                            <span className="text-gray-400">
                              <i className="ti ti-files" style={{ fontSize: '11px' }} />
                              {' '}Mat: {mod.materiale}
                            </span>
                            <span className={mod.test === 'Promovat' ? 'text-green-600' : mod.test === 'N/A' ? 'text-gray-300' : 'text-red-500'}>
                              <i className="ti ti-clipboard-check" style={{ fontSize: '11px' }} />
                              {' '}{mod.test}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{mod.progres}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                            mod.procent === '100%' ? 'bg-green-100 text-green-700' :
                            parseInt(mod.procent) >= 50 ? 'bg-blue-100 text-blue-700' :
                            parseInt(mod.procent) > 0 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {mod.procent}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tabel teste */}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {tableLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search ? 'Niciun rezultat' : 'Nu există date pentru perioada selectată'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-aep-700 text-white sticky top-0">
                  <tr>
                    {testColumns.map(col => (
                      <th key={col} onClick={() => toggleSort(col)}
                        className="text-left px-3 py-2.5 font-medium cursor-pointer hover:bg-aep-600 whitespace-nowrap select-none">
                        <div className="flex items-center gap-1">
                          {col}
                          {sortCol === col ? <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span> : <span className="text-aep-300"> ↕</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTests.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {testColumns.map(col => {
                        const val = row[col]
                        const isRezultat = col === 'Rezultat' || col === 'Promovat'
                        return (
                          <td key={col} className="px-3 py-2 whitespace-nowrap">
                            {isRezultat ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                (val === 'Promovat' || val === 'DA') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{val}</span>
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
