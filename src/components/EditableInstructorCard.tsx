import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Instructor } from '@/types'

interface EditableInstructorCardProps {
  instructor: Instructor
  onUpdate: () => void
}

export default function EditableInstructorCard({ 
  instructor, 
  onUpdate 
}: EditableInstructorCardProps) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: instructor.name,
    age: instructor.age || '',
    teaching_experience: instructor.teaching_experience,
    bio: instructor.bio,
    contact_info: instructor.contact_info || ''
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'instructor'
  const canEdit = isAdmin && (
    profile.role === 'admin' || 
    profile.id === instructor.profile_id
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('instructors')
        .update({
          name: formData.name,
          age: formData.age ? parseInt(formData.age as string) : null,
          teaching_experience: formData.teaching_experience,
          bio: formData.bio,
          contact_info: formData.contact_info,
          updated_at: new Date().toISOString()
        })
        .eq('id', instructor.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
      alert('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: instructor.name,
      age: instructor.age || '',
      teaching_experience: instructor.teaching_experience,
      bio: instructor.bio,
      contact_info: instructor.contact_info || ''
    })
    setIsEditing(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setUploading(true)
  try {
    
    const fileName = `instructors/${instructor.id}.jpg`

    

    // Upload new image with upsert to overwrite
    const { error: uploadError } = await supabase.storage
      .from('instructor-images')
      .upload(fileName, file, { 
        upsert: true,
        cacheControl: '0' // Prevent caching issues
      })

    if (uploadError) throw uploadError

    // Get public URL with cache busting
    const timestamp = new Date().getTime()
    const { data: { publicUrl } } = supabase.storage
      .from('instructor-images')
      .getPublicUrl(fileName)
    
    const urlWithCacheBust = `${publicUrl}?t=${timestamp}`

    // Update database
    const { error: dbError } = await supabase
      .from('instructors')
      .update({ 
        image_url: urlWithCacheBust,
        updated_at: new Date().toISOString()
      })
      .eq('id', instructor.id)

    if (dbError) throw dbError

    onUpdate()
    alert('Image uploaded successfully!')
  } catch (error) {
    console.error('Error uploading:', error)
    alert('Failed to upload image')
  } finally {
    setUploading(false)
    e.target.value = ''
  }
}

  if (isEditing) {
    return (
      <div className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (optional)</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Experience</label>
            <input
              type="text"
              value={formData.teaching_experience}
              onChange={(e) => setFormData({ ...formData, teaching_experience: e.target.value })}
              className="input-field"
              placeholder="e.g., 15 years of teaching experience"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-field"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (optional)</label>
            <input
              type="text"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              className="input-field"
              placeholder="Email or phone number"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 relative group">
          <div className="aspect-w-3 aspect-h-4 bg-gray-200 rounded-lg overflow-hidden">
            {instructor.image_url ? (
              <img
                src={
                  instructor.image_url
                    ? `${instructor.image_url}${instructor.image_url.includes('?') ? '&' : '?'}t=${instructor.updated_at ?? Date.now()}`
                    : ''
                }
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
          </div>
          {canEdit && (
            <label className="absolute bottom-2 right-2 bg-violet-600 text-white p-2 rounded-lg cursor-pointer hover:bg-violet-700 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {instructor.name}
            </h2>
            {instructor.age && (
              <p className="text-gray-600">Age: {instructor.age}</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-violet-600 mb-2">
              Teaching Experience
            </h3>
            <p className="text-gray-700">{instructor.teaching_experience}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-violet-600 mb-2">
              About
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{instructor.bio}</p>
          </div>

          {instructor.contact_info && (
            <div>
              <h3 className="text-lg font-semibold text-violet-600 mb-2">
                Contact
              </h3>
              <p className="text-gray-700">{instructor.contact_info}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button className="btn-primary">
              Schedule with {instructor.name.split(' ')[0]}
            </button>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
