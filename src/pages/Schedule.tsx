import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { Instructor, SchedulingSlot } from '@/types'
import SchedulingCalendar from '@/components/SchedulingCalendar'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import InstructorAvailabilityManager from '@/components/InstructorAvailabilityManager'
import {getDateKey, extractDatePrefix, extractTime } from '@/lib/timeUtils'
import { useNavigate } from 'react-router-dom'

export default function Schedule() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<SchedulingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin'
  const isStudent = profile?.role === 'student' || profile?.role === 'parent'

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchInstructors()
  }, [user, navigate])

  useEffect(() => {
    if (selectedInstructor) {
      fetchSlots()
    }
  }, [selectedInstructor])

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setInstructors(data || [])

      // Auto-select instructor for instructor users
      if (isInstructor && profile && data) {
        const myInstructor = data.find(i => i.profile_id === profile.id)
        if (myInstructor) {
          setSelectedInstructor(myInstructor)
        }
      } else if (data && data.length > 0) {
        setSelectedInstructor(data[0])
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async () => {
  if (!selectedInstructor) return

  try {
    const { data, error } = await supabase
      .from('scheduling_slots')
      .select('*')
      .eq('instructor_id', selectedInstructor.id)

    if (error) throw error

    //console.log('Fetched slots:', data)
    //console.log('Selected instructor:', selectedInstructor)
    setSlots(data || [])
  } catch (error) {
    console.error('Error fetching slots:', error)
  }
}


  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedDate(null)
  }

 const handleBookSlots = async (startTimes: string[]) => {
  if (!selectedDate || !selectedInstructor || !profile) return

  try {
    const updatePromises = startTimes.map(async (time) => {
      const dateKey = getDateKey(selectedDate)
      const matchingSlot = slots.find(s => {
        const slotDatePrefix = extractDatePrefix(s.start_time)
        const slotTime = extractTime(s.start_time)
        
        const matches = slotDatePrefix === dateKey && slotTime === time
        if (matches) console.log('  ✓ MATCH FOUND!')
        return matches
      })
      if (matchingSlot) {
        const result = await supabase
          .from('scheduling_slots')
          .update({
            student_id: profile.id,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', matchingSlot.id)
        
        console.log('Update result:', result)
        return result
      }
      
      return Promise.resolve({ data: null, error: null })
    })

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const hasError = results.some(r => r.error)
    if (hasError) {
      throw new Error('Failed to book some slots')
    }

    alert(`Booking request sent! The instructor will review your request for ${startTimes.length} time slot${startTimes.length > 1 ? 's' : ''}.`)
    
    handleCloseModal()
    fetchSlots()
  } catch (error) {
    console.error('Error booking slots:', error)
    alert('Failed to book slots. Please try again.')
  }
}

  const getSlotsForSelectedDate = (): SchedulingSlot[] => {
  if (!selectedDate) return []
  
  const dateKey = getDateKey(selectedDate)
  
  return slots.filter(slot => {
    const slotDatePrefix = extractDatePrefix(slot.start_time)
    return slotDatePrefix === dateKey
  })
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            {isInstructor ? 'Manage Your Schedule' : 'Book a Lesson'}
          </h1>
          <p className="text-lg text-gray-600">
            {isInstructor 
              ? 'Set your availability and manage student bookings' 
              : 'Select a date to view available time slots'}
          </p>
        </div>

        {/* Instructor Selector (for students) */}
        {isStudent && instructors.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Instructor
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {instructors.map(instructor => (
                <button
                  key={instructor.id}
                  onClick={() => setSelectedInstructor(instructor)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedInstructor?.id === instructor.id
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{instructor.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {instructor.teaching_experience}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        {selectedInstructor && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SchedulingCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                slots={slots}
                viewMode={isInstructor ? 'instructor' : 'student'}
              />
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isInstructor ? 'Your Schedule' : 'How to Book'}
                </h3>
                
                {isInstructor ? (
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">📅 Click a date</span> to set your availability
                    </p>
                    <p>
                      <span className="font-semibold">🟢 Green dots</span> indicate days with availability
                    </p>
                    <p>
                      <span className="font-semibold">🟡 Yellow dots</span> indicate partial availability
                    </p>
                    <p className="pt-3 border-t border-gray-200">
                      Use the "Set Full Day Available" button for quick setup!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">1.</span> Select an instructor above
                    </p>
                    <p>
                      <span className="font-semibold">2.</span> Click a date with a green or yellow dot
                    </p>
                    <p>
                      <span className="font-semibold">3.</span> Choose 1-2 consecutive time slots
                    </p>
                    <p>
                      <span className="font-semibold">4.</span> Submit your booking request
                    </p>
                    <p className="pt-3 border-t border-gray-200">
                      Your instructor will confirm your request!
                    </p>
                  </div>
                )}
              </div>

              <div className="card bg-violet-50 border-2 border-violet-200">
                <h3 className="text-lg font-semibold text-violet-900 mb-2">
                  Current Selection
                </h3>
                <div className="text-sm text-violet-800">
                  <p className="mb-1">
                    <span className="font-semibold">Instructor:</span> {selectedInstructor.name}
                  </p>
                  {selectedDate && (
                    <p>
                      <span className="font-semibold">Date:</span>{' '}
                      {selectedDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showModal && selectedDate && selectedInstructor && (
          <>
            {isInstructor ? (
              <InstructorAvailabilityManager
                date={selectedDate}
                instructorId={selectedInstructor.id}
                slots={getSlotsForSelectedDate()}
                onClose={handleCloseModal}
                onUpdate={fetchSlots}
              />
            ) : (
              <TimeSlotPicker
                date={selectedDate}
                instructorId={selectedInstructor.id}
                slots={getSlotsForSelectedDate()}
                onBook={handleBookSlots}
                onClose={handleCloseModal}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
