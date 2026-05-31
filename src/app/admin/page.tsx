'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  totalLessons: number;
  totalModules: number;
  completionRate: number;
  testPassRate: number;
  recentRegistrations: number;
  usersByCounty: { countyName: string; count: number }[];
  usersByCalitate: { calitate: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { if (data.data) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aep-600" />
      </div>
    );
  }

  const quickActions = [
    { label: 'Adaugă utilizator', href: '/admin/users?action=new', icon: '👤' },
    { label: 'Adaugă modul', href: '/admin/content?action=new', icon: '📦' },
    { label: 'Adaugă întrebare', href: '/admin/tests?action=new', icon: '❓' },
    { label: 'Adaugă eveniment', href: '/admin/calendar?action=new', icon: '📅' },
    { label: 'Exportă rapoarte', href: '/admin/reports', icon: '📊' },
    { label: 'Setări aplicație', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard administrare</h1>
        <p className="text-gray-600 mt-1">Statistici și acțiuni rapide</p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-aep-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Utilizatori totali</div>
            <div className="text-xs text-success-600 mt-1">+{stats.recentRegistrations} în ultimele 7 zile</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-success-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Conturi active</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-orange-500">{stats.pendingVerification}</div>
            <div className="text-sm text-gray-600 mt-1">Neconfirmate</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
            <div className="text-sm text-gray-600 mt-1">Rată finalizare</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">{stats.totalModules}</div>
            <div className="text-sm text-gray-600 mt-1">Module publicate</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-indigo-600">{stats.totalLessons}</div>
            <div className="text-sm text-gray-600 mt-1">Lecții</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-teal-600">{stats.testPassRate}%</div>
            <div className="text-sm text-gray-600 mt-1">Promovare teste</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Acțiuni rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-aep-300 hover:bg-aep-50 transition-colors text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs text-gray-700 font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top counties table */}
      {stats && stats.usersByCounty.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Top județe (utilizatori)</h2>
            <div className="space-y-2">
              {stats.usersByCounty.slice(0, 8).map((row) => (
                <div key={row.countyName} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 flex-shrink-0">{row.countyName}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aep-400 rounded-full"
                      style={{
                        width: `${Math.round((row.count / stats.usersByCounty[0].count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Distribuție calitate</h2>
            <div className="space-y-2">
              {stats.usersByCalitate.slice(0, 8).map((row) => (
                <div key={row.calitate} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{row.calitate}</span>
                  <span className="text-sm font-medium text-gray-700">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
