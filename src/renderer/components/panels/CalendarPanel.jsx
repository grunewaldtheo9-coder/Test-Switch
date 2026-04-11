import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, CalendarDays } from 'lucide-react'
import clsx from 'clsx'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const MOCK_EVENTS = [
  { id: 1, title: 'Reunião com cliente ABC', time: '10:00', duration: '1h', type: 'meeting', day: new Date().getDate() },
  { id: 2, title: 'Almoço com equipe',       time: '12:30', duration: '1.5h', type: 'personal', day: new Date().getDate() },
  { id: 3, title: 'Review de código',         time: '15:00', duration: '30min', type: 'meeting', day: new Date().getDate() },
  { id: 4, title: 'Deadline: Proposta XYZ',  time: '18:00', duration: '',     type: 'deadline', day: new Date().getDate() + 2 },
]

const TYPE_COLOR = {
  meeting:  'bg-aria-500/20  text-aria-400  border-aria-500/30',
  personal: 'bg-green-500/20 text-green-400 border-green-500/30',
  deadline: 'bg-red-500/20   text-red-400   border-red-500/30',
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPanel({ addNotification }) {
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [showNew, setShowNew] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', time: '', date: '' })

  const daysInMonth = getDaysInMonth(current.year, current.month)
  const firstDay    = getFirstDay(current.year, current.month)

  function prevMonth() {
    setCurrent((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  }
  function nextMonth() {
    setCurrent((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })
  }

  const dayEvents = MOCK_EVENTS.filter((e) => e.day === selectedDay)

  return (
    <div className="flex gap-4 max-w-6xl mx-auto h-full">
      {/* Calendar grid */}
      <div className="card p-5 w-80 shrink-0 space-y-4 self-start">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200 text-sm">
            {MONTHS[current.month]} {current.year}
          </h3>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="btn-ghost p-1.5"><ChevronLeft size={14} /></button>
            <button onClick={nextMonth} className="btn-ghost p-1.5"><ChevronRight size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear()
            const isSelected = day === selectedDay
            const hasEvent  = MOCK_EVENTS.some((e) => e.day === day)
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={clsx(
                  'text-xs rounded-lg py-1.5 transition-colors relative',
                  isSelected ? 'bg-aria-600 text-white font-semibold'
                    : isToday   ? 'bg-aria-600/20 text-aria-400 font-semibold'
                    : 'text-slate-400 hover:bg-surface-elevated hover:text-slate-200',
                )}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-aria-400" />
                )}
              </button>
            )
          })}
        </div>

        <button onClick={() => setShowNew(true)} className="btn-primary w-full justify-center">
          <Plus size={14} /> Novo evento
        </button>
      </div>

      {/* Events list */}
      <div className="card flex-1 p-5 space-y-4 overflow-y-auto self-start">
        <h3 className="font-semibold text-slate-200 text-sm">
          Eventos — dia {selectedDay} de {MONTHS[current.month]}
        </h3>

        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <CalendarDays className="mx-auto mb-2 opacity-40" size={32} />
            Nenhum evento para este dia.
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((ev) => (
              <div key={ev.id} className={clsx('rounded-xl border p-4 space-y-2', TYPE_COLOR[ev.type])}>
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm">{ev.title}</p>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full border', TYPE_COLOR[ev.type])}>
                    {ev.type === 'meeting' ? 'Reunião' : ev.type === 'personal' ? 'Pessoal' : 'Deadline'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs opacity-80">
                  {ev.time && <span className="flex items-center gap-1"><Clock size={11} /> {ev.time}{ev.duration && ` (${ev.duration})`}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New event modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="card w-full max-w-md p-5 space-y-4 animate-slide-up">
            <h3 className="font-semibold text-slate-100">Novo Evento</h3>
            <input className="input" placeholder="Título do evento" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
            <input className="input" type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
            <input className="input" type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancelar</button>
              <button
                onClick={() => {
                  addNotification?.({ type: 'success', title: 'Evento criado!', body: newEvent.title })
                  setShowNew(false)
                  setNewEvent({ title: '', time: '', date: '' })
                }}
                className="btn-primary"
              >
                <Plus size={14} /> Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

