import { useState, useEffect } from 'react'
import { getDaysInMonth, isSameDay, getMonthYearString, isWithinNextMonth, getDateKey, extractDatePrefix } from '@/lib/timeUtils'
import { SchedulingSlot } from '@/types'

interface SchedulingCalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  slots: SchedulingSlot[]
  viewMode: 'student' | 'instructor'
}

export default function SchedulingCalendar({
  selectedDate,
  onDateSelect,
  slots,
  viewMode
}: SchedulingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [days, setDays] = useState<Date[]>([])

  useEffect(() => {
    const daysInMonth = getDaysInMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    )
    setDays(daysInMonth)
  }, [currentMonth])

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const canGoToNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)
    
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
    
    return nextMonth <= oneMonthFromNow
  }

  const getAvailabilityForDate = (date: Date): 'available' | 'partial' | 'none' => {
  if (!isWithinNextMonth(date)) return 'none'
  
  const dateKey = getDateKey(date)
  const daySlots = slots.filter(slot => {
    const slotDatePrefix = extractDatePrefix(slot.start_time)
    return slotDatePrefix === dateKey
  })

  if (daySlots.length === 0) return 'none'

  const hasAvailable = daySlots.some(s => s.status === 'available')
  const allAvailable = daySlots.every(s => s.status === 'available')

  if (allAvailable) return 'available'
  if (hasAvailable) return 'partial'
  return 'none'
}

  const getDayClassName = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isPast = date < today
    const isToday = isSameDay(date, today)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const availability = getAvailabilityForDate(date)
    const isSelectable = isWithinNextMonth(date)

    let classes = 'relative aspect-square p-2 rounded-lg transition-all border-2 '

    if (!isSelectable || isPast) {
      classes += 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
    } else if (isSelected) {
      classes += 'bg-violet-600 text-white border-violet-700 font-bold shadow-lg'
    } else if (isToday) {
      classes += 'bg-violet-50 text-violet-900 border-violet-300 font-semibold cursor-pointer hover:bg-violet-100'
    } else {
      classes += 'bg-white text-gray-800 border-gray-200 cursor-pointer hover:border-violet-300 hover:shadow-md'
    }

    return classes
  }

  const getAvailabilityIndicator = (date: Date) => {
    if (!isWithinNextMonth(date)) return null
    
    const availability = getAvailabilityForDate(date)
    
    if (availability === 'available') {
      return <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
    }
    if (availability === 'partial') {
      return <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
    }
    return null
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get the first day of the month to calculate offset
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Create empty cells for days before the month starts
  const emptyCells = Array(startingDayOfWeek).fill(null)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-2xl font-display font-bold text-gray-900">
          {getMonthYearString(currentMonth)}
        </h2>

        <button
          onClick={goToNextMonth}
          disabled={!canGoToNextMonth()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => (
          <button
            key={day.toISOString()}
            onClick={() => isWithinNextMonth(day) && onDateSelect(day)}
            className={getDayClassName(day)}
            disabled={!isWithinNextMonth(day)}
          >
            <span className="text-sm md:text-base">{day.getDate()}</span>
            {getAvailabilityIndicator(day)}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Availability:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>None</span>
          </div>
        </div>
      </div>
    </div>
  )
}
