import { useState } from 'react'
import { SchedulingSlot } from '@/types'
import { TIME_SLOTS,  formatTimeRange, getEndTime, isConsecutiveSlot, extractTime } from '@/lib/timeUtils'
interface TimeSlotPickerProps {
  date: Date
  instructorId: string
  slots: SchedulingSlot[]
  onBook: (startTimes: string[]) => void
  onClose: () => void
  isInstructor?: boolean
}

export default function TimeSlotPicker({
  date,
  slots,
  onBook,
  onClose,
  isInstructor = false
}: TimeSlotPickerProps) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const getSlotStatus = (time: string): 'available' | 'booked' | 'unavailable' => {
  const slot = slots.find(s => {
    const slotTimeString = extractTime(s.start_time)
    return slotTimeString === time
  })

  if (!slot) return 'unavailable'
  if (slot.status === 'available') return 'available'
  return 'booked'
}

  const canSelectSlot = (time: string): boolean => {
    const status = getSlotStatus(time)
    if (status !== 'available') return false

    if (selectedSlots.length === 0) return true
    if (selectedSlots.length >= 2) return false

    // Check if consecutive
    return isConsecutiveSlot(selectedSlots[0], time)
  }

  const handleSlotClick = (time: string) => {
    if (isInstructor) return // Instructors use different interface

    if (!canSelectSlot(time)) {
      if (selectedSlots.includes(time)) {
        setSelectedSlots(selectedSlots.filter(t => t !== time))
      }
      return
    }

    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(t => t !== time))
    } else {
      setSelectedSlots([...selectedSlots, time].sort((a, b) => 
        TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)
      ))
    }
  }

  const handleBook = () => {
    if (selectedSlots.length > 0) {
      onBook(selectedSlots)
    }
  }

  const getSlotClassName = (time: string): string => {
    const status = getSlotStatus(time)
    const isSelected = selectedSlots.includes(time)

    const baseClasses = 'px-4 py-3 rounded-lg text-sm font-medium transition-all border-2'

    if (isSelected) {
      return `${baseClasses} bg-violet-600 text-white border-violet-600`
    }

    if (status === 'available') {
      const canSelect = canSelectSlot(time)
      if (canSelect) {
        return `${baseClasses} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer`
      }
      return `${baseClasses} bg-green-50 text-green-400 border-green-200 cursor-not-allowed opacity-50`
    }

    if (status === 'booked') {
      return `${baseClasses} bg-blue-50 text-blue-600 border-blue-200 cursor-not-allowed`
    }

    return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`
  }

  const getSlotLabel = (time: string): string => {
    const status = getSlotStatus(time)
    const endTime = getEndTime(time)

    if (status === 'available') {
      return formatTimeRange(time, endTime)
    }
    if (status === 'booked') {
      return `${formatTimeRange(time, endTime)} - Booked`
    }
    return formatTimeRange(time, endTime)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-violet-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">
                {isInstructor ? 'Manage Availability' : 'Book a Lesson'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isInstructor && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tip:</span> Select 1-2 consecutive time slots. 
                {selectedSlots.length > 0 && ` Selected: ${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''}`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TIME_SLOTS.map(time => (
              <button
                key={time}
                onClick={() => handleSlotClick(time)}
                className={getSlotClassName(time)}
                disabled={isInstructor || (!canSelectSlot(time) && !selectedSlots.includes(time))}
              >
                {getSlotLabel(time)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legend:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-violet-600 border-2 border-violet-600 rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isInstructor && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={selectedSlots.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book {selectedSlots.length} Slot{selectedSlots.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
