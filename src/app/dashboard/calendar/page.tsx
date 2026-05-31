'use client'
import { useState, useEffect } from 'react'
import { COUNTIES } from '@/lib/counties'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Event {
  id: string; title: string; description?: string; countyCode?: string
  startAt: string; endAt: string; location?: string; onlineLink?: string
  targetAudience?: string; county?: { name: string }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedCounty, setSelectedCounty] = useState('')
  const [loading, setLoading] = useState(false)

  const loadEvents = async (county?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (county) params.set('county', county)
    const r = await fetch(`/api/events?${params}`)
    const d = await r.json()
    setEvents(d.data || [])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  const handleCountyChange = (code: string) => {
    setSelectedCounty(code)
    loadEvents(code || undefined)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendar instruiri</h1>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <label className="text-sm font-medium text-gray-700 block mb-2">Filtrare după județ:</label>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => handleCountyChange('')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${!selectedCounty ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:border-aep-300'}`}>
            Toate
          </button>
          {COUNTIES.map(c => (
            <button key={c.code} onClick={() => handleCountyChange(c.code)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCounty === c.code ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:border-aep-300'}`}
              title={c.name}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" /></div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">Niciun eveniment disponibil{selectedCounty ? ` pentru ${COUNTIES.find(c => c.code === selectedCounty)?.name}` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                  {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      📅 {format(parseISO(ev.startAt), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                    </span>
                    {ev.location && <span className="flex items-center gap-1">📍 {ev.location}</span>}
                    {ev.county && <span className="flex items-center gap-1">🗺️ {ev.county.name}</span>}
                    {ev.targetAudience && <span className="flex items-center gap-1">👥 {ev.targetAudience}</span>}
                  </div>
                </div>
                {ev.onlineLink && (
                  <a href={ev.onlineLink} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 px-4 py-2 bg-aep-600 text-white text-sm rounded-lg hover:bg-aep-700">
                    Participă online
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
