import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { SchedulingSlot, Instructor } from '@/types'
import { formatDate, formatTime, getEndTime, extractTime } from '@/lib/timeUtils'
import { useNavigate } from 'react-router-dom'

interface SlotWithInstructor extends SchedulingSlot {
  instructor_name?: string
}

export default function StudentDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [pendingRequests, setPendingRequests] = useState<SlotWithInstructor[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<SlotWithInstructor[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)


  useEffect(() => {
  if (authLoading) return

  if (!user) {
    navigate('/login', { replace: true })
    return
  }

  if (!profile) return

  const ok = profile.role === 'student' || profile.role === 'parent'
  if (!ok) {
    navigate('/login', { replace: true })
    return
  }

  setBookingsLoading(true)
  fetchBookings()
}, [authLoading, user, profile?.id, profile?.role, navigate])


    

  const fetchBookings = async () => {
    if (!profile) return

    try {
      // Fetch all slots where student is the current user
      const { data: slotsData, error: slotsError } = await supabase
        .from('scheduling_slots')
        .select('*')
        .eq('student_id', profile.id)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })

      if (slotsError) throw slotsError

      // Get instructor details for each slot
      const slotsWithInstructor = await Promise.all(
        (slotsData || []).map(async (slot) => {
          const { data: instructorData } = await supabase
            .from('instructors')
            .select('name')
            .eq('id', slot.instructor_id)
            .single()

          return {
            ...slot,
            instructor_name: instructorData?.name || 'Unknown Instructor'
          }
        })
      )

      setPendingRequests(slotsWithInstructor.filter(s => s.status === 'pending'))
      setConfirmedBookings(slotsWithInstructor.filter(s => s.status === 'confirmed'))
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setBookingsLoading(false)
    }
  }

  const handleCancelRequest = async (slotId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const { error } = await supabase
        .from('scheduling_slots')
        .update({ 
          status: 'available',
          student_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)

      if (error) throw error

      fetchBookings()
      alert('Request cancelled')
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Failed to cancel request')
    }
  }

  const formatSlotTime = (slot: SchedulingSlot) => {
    const startTime = extractTime(slot.start_time)
    const endTime = getEndTime(startTime)
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const formatSlotDate = (slot: SchedulingSlot) => {
    const date = new Date(slot.start_time)
    return formatDate(date)
  }

  if (bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            My Lessons
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {profile?.full_name}!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/schedule')}
            className="btn-primary"
          >
            Book a New Lesson
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pending Requests */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Pending Requests
              </h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {pendingRequests.length}
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending requests
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-violet-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.instructor_name}
                        </h3>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Awaiting Confirmation
                      </span>
                    </div>
                    
                    <div className="mb-3 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Date:</span> {formatSlotDate(request)}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Time:</span> {formatSlotTime(request)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Bookings */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Confirmed Lessons
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {confirmedBookings.length}
              </span>
            </div>

            {confirmedBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No confirmed lessons yet
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {confirmedBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 bg-green-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.instructor_name}
                        </h3>
                      </div>
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Confirmed
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Date:</span> {formatSlotDate(booking)}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Time:</span> {formatSlotTime(booking)}
                      </p>
                    </div>

                    {booking.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
