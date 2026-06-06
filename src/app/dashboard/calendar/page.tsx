'use client'
import { useState, useEffect, useMemo } from 'react'
import { COUNTIES } from '@/lib/counties'
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Event {
  id: string; title: string; description?: string; countyCode?: string
  startAt: string; endAt: string; location?: string; onlineLink?: string
  targetAudience?: string; county?: { name: string }
}

const EV_COLORS = ['#B5D4F4', '#85B7EB', '#9FE1CB', '#FAC775']
const EV_TEXT_COLORS = ['#0C447C', '#185FA5', '#085041', '#633806']

function getEventColor(index: number) {
  return { bg: EV_COLORS[index % EV_COLORS.length], text: EV_TEXT_COLORS[index % EV_TEXT_COLORS.length] }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedCounty, setSelectedCounty] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadEvents = async (county?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (county) params.set('county', county)
    const r = await fetch(`/api/events?${params}`, { credentials: 'include' })
    const d = await r.json()
    setEvents(d.data || [])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  const handleCountyChange = (code: string) => {
    setSelectedCounty(code)
    loadEvents(code || undefined)
  }

  // Calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    const days = []
    let day = start
    while (day <= end) { days.push(day); day = addDays(day, 1) }
    return days
  }, [currentDate])

  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    events.forEach(ev => {
      const key = format(parseISO(ev.startAt), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const upcomingEvents = useMemo(() =>
    [...events]
      .filter(ev => new Date(ev.startAt) >= new Date())
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 10)
  , [events])

  const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Calendar instruiri</h1>

      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            ← Anterior
          </button>
          <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: ro }).replace(/^\w/, c => c.toUpperCase())}
          </span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            Următor →
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs border border-aep-200 rounded-lg text-aep-600 hover:bg-aep-50">
            Azi
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('month')}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${view === 'month' ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Lună
          </button>
          <button onClick={() => setView('list')}
            className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${view === 'list' ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Listă
          </button>
        </div>
      </div>

      {/* County filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => handleCountyChange('')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!selectedCounty ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:border-aep-300'}`}>
            Toate
          </button>
          {COUNTIES.map(c => (
            <button key={c.code} onClick={() => handleCountyChange(c.code)}
              title={c.name}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCounty === c.code ? 'bg-aep-600 text-white border-aep-600' : 'border-gray-200 text-gray-600 hover:border-aep-300'}`}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aep-600" />
        </div>
      ) : (
        <>
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-white bg-aep-600 py-2.5">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 border-t border-gray-100">
                {calendarDays.map((day, i) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDay[key] || []
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isTodays = isToday(day)
                  return (
                    <div key={i}
                      className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 ${!isCurrentMonth ? 'bg-gray-50' : isTodays ? 'bg-blue-50' : 'bg-white'}`}>
                      <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full font-medium
                        ${isTodays ? 'bg-aep-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </div>
                      {dayEvents.slice(0, 2).map((ev, ei) => {
                        const color = getEventColor(ei)
                        return (
                          <div key={ev.id} title={ev.title}
                            style={{ background: color.bg, color: color.text }}
                            className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium">
                            {ev.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-aep-600 font-medium px-1">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                  <p className="text-gray-400">Niciun eveniment disponibil{selectedCounty ? ` pentru județul selectat` : ''}.</p>
                </div>
              ) : upcomingEvents.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex">
                  {/* Date box */}
                  <div className="bg-aep-600 text-white flex flex-col items-center justify-center px-5 min-w-[72px]">
                    <span className="text-2xl font-bold leading-none">
                      {format(parseISO(ev.startAt), 'd')}
                    </span>
                    <span className="text-xs text-blue-200 mt-1 uppercase">
                      {format(parseISO(ev.startAt), 'MMM', { locale: ro })}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{ev.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        🕐 {format(parseISO(ev.startAt), 'HH:mm', { locale: ro })} – {format(parseISO(ev.endAt), 'HH:mm', { locale: ro })}
                      </span>
                      {ev.location && <span className="flex items-center gap-1">📍 {ev.location}</span>}
                      {ev.county && <span className="flex items-center gap-1">🗺️ {ev.county.name}</span>}
                      {ev.targetAudience && <span className="flex items-center gap-1">👥 {ev.targetAudience}</span>}
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex flex-col items-end justify-between px-4 py-4 gap-2">
                    {ev.countyCode && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-aep-600 border border-blue-100">
                        {ev.countyCode}
                      </span>
                    )}
                    {ev.onlineLink && (
                      <a href={ev.onlineLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-aep-600 text-white rounded-lg hover:bg-aep-700">
                        Online →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming events summary (only in month view) */}
          {view === 'month' && upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Evenimente următoare</h2>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 4).map(ev => (
                  <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex">
                    <div className="bg-aep-600 text-white flex flex-col items-center justify-center px-4 min-w-[60px]">
                      <span className="text-lg font-bold leading-none">{format(parseISO(ev.startAt), 'd')}</span>
                      <span className="text-xs text-blue-200 uppercase">{format(parseISO(ev.startAt), 'MMM', { locale: ro })}</span>
                    </div>
                    <div className="flex-1 px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>🕐 {format(parseISO(ev.startAt), 'HH:mm')}</span>
                        {ev.location && <span>📍 {ev.location}</span>}
                      </div>
                    </div>
                    {ev.countyCode && (
                      <div className="flex items-center px-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-aep-600 border border-blue-100">{ev.countyCode}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
