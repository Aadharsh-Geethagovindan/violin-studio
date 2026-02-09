import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile, Instructor } from '@/types'

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('')
  const [linkedInstructor, setLinkedInstructor] = useState<Instructor | null>(null)

  // Fetch all instructors for linking
  useEffect(() => {
    fetchInstructors()
  }, [])

  // Fetch linked instructor when user is selected
  useEffect(() => {
    if (selectedUser?.role === 'instructor') {
      fetchLinkedInstructor()
    } else {
      setLinkedInstructor(null)
      setSelectedInstructorId('')
    }
  }, [selectedUser])

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setInstructors(data || [])
    } catch (error) {
      console.error('Error fetching instructors:', error)
    }
  }

  const fetchLinkedInstructor = async () => {
    if (!selectedUser) return

    try {
      const { data } = await supabase
        .from('instructors')
        .select('*')
        .eq('profile_id', selectedUser.id)
        .single()

      if (data) {
        setLinkedInstructor(data)
        setSelectedInstructorId(data.id)
      } else {
        setLinkedInstructor(null)
        setSelectedInstructorId('')
      }
    } catch (error) {
      setLinkedInstructor(null)
      setSelectedInstructorId('')
    }
  }

  // Search users as they type
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const searchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .limit(5)

        if (error) throw error
        setSearchResults(data || [])
        setShowDropdown(true)
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user)
    setSearchTerm(user.email)
    setShowDropdown(false)
  }

  const handleLinkToExistingInstructor = async () => {
    if (!selectedUser || !selectedInstructorId) return

    if (!confirm('Link this account to the selected instructor profile?')) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('instructors')
        .update({ profile_id: selectedUser.id })
        .eq('id', selectedInstructorId)

      if (error) throw error

      alert('Account linked to instructor profile successfully!')
      await fetchLinkedInstructor()
    } catch (error) {
      console.error('Error linking instructor:', error)
      alert('Failed to link instructor')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateNewInstructorProfile = async () => {
    if (!selectedUser) return

    if (!confirm(`Create a new instructor profile for ${selectedUser.full_name}?`)) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('instructors')
        .insert({
          profile_id: selectedUser.id,
          name: selectedUser.full_name,
          teaching_experience: 'Add teaching experience',
          bio: 'Add bio here',
          display_order: 999
        })

      if (error) throw error

      alert('New instructor profile created! They can now edit their profile on the Instructors page.')
      await fetchInstructors()
      await fetchLinkedInstructor()
    } catch (error) {
      console.error('Error creating instructor profile:', error)
      alert('Failed to create instructor profile')
    } finally {
      setUpdating(false)
    }
  }

  const handlePromoteToInstructor = async () => {
    if (!selectedUser) return
    
    if (!confirm(`Promote ${selectedUser.full_name} to Instructor?`)) return

    setUpdating(true)
    try {
      // Update role to instructor (no profile created yet)
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'instructor' })
        .eq('id', selectedUser.id)

      if (roleError) throw roleError

      alert('User promoted to Instructor! You can now link them to an existing profile or create a new one.')
      
      // Refresh user data
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedUser.id)
        .single()

      if (updatedUser) {
        setSelectedUser(updatedUser)
      }
    } catch (error) {
      console.error('Error promoting user:', error)
      alert('Failed to promote user')
    } finally {
      setUpdating(false)
    }
  }

  const handleDemoteToStudent = async () => {
    if (!selectedUser) return

    // Protect the main admin account
    if (selectedUser.email === 'gregoryepan@gmail.com') {
      alert('Cannot demote the primary admin account')
      return
    }

    if (!confirm(`Demote ${selectedUser.full_name} to Student? This will unlink their instructor profile.`)) return

    setUpdating(true)
    try {
      // Unlink instructor profile if exists (don't delete the profile)
      if (linkedInstructor) {
        const { error: unlinkError } = await supabase
          .from('instructors')
          .update({ profile_id: null })
          .eq('id', linkedInstructor.id)

        if (unlinkError) throw unlinkError
      }

      // Update role to student
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', selectedUser.id)

      if (roleError) throw roleError

      alert('User demoted to Student successfully!')
      
      // Refresh user data
      const { data: updatedUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedUser.id)
        .single()

      if (updatedUser) {
        setSelectedUser(updatedUser)
      }
      setLinkedInstructor(null)
      setSelectedInstructorId('')
    } catch (error) {
      console.error('Error demoting user:', error)
      alert('Failed to demote user')
    } finally {
      setUpdating(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'instructor':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
        User Management
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side - Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search users by name or email
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search name here"
              className="input-field"
            />

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchTerm.length >= 2 && searchResults.length === 0 && !showDropdown && (
            <p className="text-sm text-gray-500 mt-2">No users found</p>
          )}
        </div>

        {/* Right Side - Selected User Details */}
        <div>
          {selectedUser ? (
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4">Selected User</h3>
              
              <div className="space-y-3 mb-6">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium text-gray-900">{selectedUser.full_name}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Role:</span>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Instructor Linking/Creation */}
                {selectedUser.role === 'instructor' && (
                  <div className="pt-4 border-t border-gray-300 space-y-4">
                    {linkedInstructor ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✓ Linked to: <span className="font-semibold">{linkedInstructor.name}</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link to Existing Instructor:
                          </label>
                          <select
                            value={selectedInstructorId}
                            onChange={(e) => setSelectedInstructorId(e.target.value)}
                            className="input-field mb-2"
                          >
                            <option value="">Select instructor profile...</option>
                            {instructors.filter(i => !i.profile_id).map((inst) => (
                              <option key={inst.id} value={inst.id}>
                                {inst.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleLinkToExistingInstructor}
                            disabled={updating || !selectedInstructorId}
                            className="w-full bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating ? 'Linking...' : 'Link to Existing Profile'}
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">OR</span>
                          </div>
                        </div>

                        <button
                          onClick={handleCreateNewInstructorProfile}
                          disabled={updating}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Creating...' : 'Create New Instructor Profile'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {selectedUser.role === 'student' && (
                  <button
                    onClick={handlePromoteToInstructor}
                    disabled={updating}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Processing...' : 'Promote to Instructor'}
                  </button>
                )}

                {selectedUser.role === 'instructor' && (
                  <button
                    onClick={handleDemoteToStudent}
                    disabled={updating || selectedUser.email === 'gregoryepan@gmail.com'}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Processing...' : 'Demote to Student'}
                  </button>
                )}

                {selectedUser.role === 'admin' && (
                  <div className="text-sm text-gray-600 text-center py-2">
                    Admin accounts cannot be modified
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>Select a user to manage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}