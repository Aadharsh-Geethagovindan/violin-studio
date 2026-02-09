import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { SchedulingSlot, Instructor } from '@/types'
import { formatDate, formatTime, getEndTime, extractTime } from '@/lib/timeUtils'
import { useNavigate } from 'react-router-dom'
import UserManagement from '@/components/UserManagement'

interface SlotWithDetails extends SchedulingSlot {
  student_name?: string
  student_email?: string
}

export default function InstructorDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [pendingRequests, setPendingRequests] = useState<SlotWithDetails[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<SlotWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || (profile?.role !== 'instructor' && profile?.role !== 'admin')) {
      navigate('/login')
      return
    }
    fetchInstructorData()
  }, [user, profile, navigate])

  const fetchInstructorData = async () => {
    if (!profile) return

    try {
      // Get instructor profile
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructors')
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (instructorError) throw instructorError
      setInstructor(instructorData)

      // Fetch pending requests and confirmed bookings
      const { data: slotsData, error: slotsError } = await supabase
        .from('scheduling_slots')
        .select('*')
        .eq('instructor_id', instructorData.id)
        .in('status', ['pending', 'confirmed'])
        .order('start_time', { ascending: true })

      if (slotsError) throw slotsError

      // Get student details for each slot
      const slotsWithDetails = await Promise.all(
        (slotsData || []).map(async (slot) => {
          if (slot.student_id) {
            const { data: studentData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', slot.student_id)
              .single()

            return {
              ...slot,
              student_name: studentData?.full_name || 'Unknown',
              student_email: studentData?.email || ''
            }
          }
          return slot
        })
      )

      setPendingRequests(slotsWithDetails.filter(s => s.status === 'pending'))
      setConfirmedBookings(slotsWithDetails.filter(s => s.status === 'confirmed'))
    } catch (error) {
      console.error('Error fetching instructor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('scheduling_slots')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)

      if (error) throw error

      fetchInstructorData()
      alert('Booking confirmed!')
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking')
    }
  }

  const handleReject = async (slotId: string) => {
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

      fetchInstructorData()
      alert('Booking rejected - slot returned to available')
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Failed to reject booking')
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

  if (loading) {
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
            Instructor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {instructor?.name}!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/schedule')}
            className="btn-primary"
          >
            Manage Availability
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
                          {request.student_name}
                        </h3>
                        <p className="text-sm text-gray-600">{request.student_email}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                        Pending
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

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleConfirm(request.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Bookings */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Confirmed Bookings
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {confirmedBookings.length}
              </span>
            </div>

            {confirmedBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No confirmed bookings
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
                          {booking.student_name}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.student_email}</p>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
         {/* User Management Section - Admin Only */}
        {profile?.role === 'admin' && (
          <div className="mt-8">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  )
}
