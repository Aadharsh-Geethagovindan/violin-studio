import { useState } from 'react'
import { TIME_SLOTS, formatTime, getEndTime, createTimeSlot, extractTime } from '@/lib/timeUtils'
import { SchedulingSlot } from '@/types'
import { supabase } from '@/lib/supabase'

interface InstructorAvailabilityManagerProps {
  date: Date
  instructorId: string
  slots: SchedulingSlot[]
  onClose: () => void
  onUpdate: () => void
}

export default function InstructorAvailabilityManager({
  date,
  instructorId,
  slots,
  onClose,
  onUpdate
}: InstructorAvailabilityManagerProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
  new Set(
    slots
      .filter(s => s.status === 'available')
      .map(s => extractTime(s.start_time))
      .filter(t => t !== '')
  )
)

  const [saving, setSaving] = useState(false)

  const bookedSlots = new Set(
  slots
    .filter(s => s.status !== 'available')
    .map(s => extractTime(s.start_time))
    .filter(t => t !== '')
)

  const toggleSlot = (time: string) => {
    if (bookedSlots.has(time)) return // Can't toggle booked slots

    const newSelected = new Set(selectedSlots)
    if (newSelected.has(time)) {
      newSelected.delete(time)
    } else {
      newSelected.add(time)
    }
    setSelectedSlots(newSelected)
  }

  const setFullDayAvailability = () => {
    const newSelected = new Set<string>()
    TIME_SLOTS.forEach(time => {
      if (!bookedSlots.has(time)) {
        newSelected.add(time)
      }
    })
    setSelectedSlots(newSelected)
  }

  const clearAll = () => {
    setSelectedSlots(new Set())
  }

  const handleSave = async () => {
  setSaving(true)
  try {
    // Determine which slots to add and which to remove based on current slots prop
    const slotsToAdd: string[] = []
    const slotsToRemove: string[] = []

    // Build a map of existing slots from the props
   const existingSlotsMap = new Map(
  slots.map(s => {
    const timeKey = extractTime(s.start_time)
    return [timeKey, s]
  })
)

    TIME_SLOTS.forEach(time => {
      const existing = existingSlotsMap.get(time)
      const shouldBeAvailable = selectedSlots.has(time)

      if (shouldBeAvailable && !existing) {
        // Need to add new slot
        slotsToAdd.push(time)
      } else if (!shouldBeAvailable && existing && existing.status === 'available') {
        // Need to remove slot (only if it's just available, not booked)
        slotsToRemove.push(existing.id)
      }
    })

    // Remove slots that are no longer available
    if (slotsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('scheduling_slots')
        .delete()
        .in('id', slotsToRemove)

      if (deleteError) throw deleteError
    }

    // Add new available slots
    if (slotsToAdd.length > 0) {
      const newSlots = slotsToAdd.map(time => {
        const { start_time, end_time } = createTimeSlot(date, time)
        return {
          instructor_id: instructorId,
          start_time,
          end_time,
          status: 'available' as const
        }
      })

      const { error: insertError } = await supabase
        .from('scheduling_slots')
        .insert(newSlots)

      if (insertError) throw insertError
    }

    onUpdate()
    onClose()
  } catch (error) {
    console.error('Error saving availability:', error)
    alert('Failed to save availability. Please try again.')
  } finally {
    setSaving(false)
  }
}

  const getSlotClassName = (time: string): string => {
    const baseClasses = 'px-4 py-3 rounded-lg text-sm font-medium transition-all border-2'
    
    if (bookedSlots.has(time)) {
      return `${baseClasses} bg-blue-50 text-blue-600 border-blue-200 cursor-not-allowed`
    }

    if (selectedSlots.has(time)) {
      return `${baseClasses} bg-green-500 text-white border-green-600 cursor-pointer hover:bg-green-600`
    }

    return `${baseClasses} bg-gray-100 text-gray-600 border-gray-300 cursor-pointer hover:bg-gray-200`
  }

  const getSlotLabel = (time: string): string => {
    const endTime = getEndTime(time)
    const timeRange = `${formatTime(time)} - ${formatTime(endTime)}`
    
    if (bookedSlots.has(time)) {
      return `${timeRange} • Booked`
    }
    
    return timeRange
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-violet-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Set Availability
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

        {/* Quick Actions */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={setFullDayAvailability}
              className="btn-primary text-sm"
            >
              Set Full Day Available (9 AM - 9 PM)
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
            <p className="text-sm text-violet-800">
              <span className="font-semibold">Click slots</span> to toggle availability. 
              Green = available for booking. Booked slots cannot be changed.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TIME_SLOTS.map(time => (
              <button
                key={time}
                onClick={() => toggleSlot(time)}
                className={getSlotClassName(time)}
                disabled={bookedSlots.has(time)}
              >
                {getSlotLabel(time)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legend:</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''} marked as available
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
