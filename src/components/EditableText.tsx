import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

interface EditableTextProps {
  content: string
  onSave: (newContent: string) => Promise<void>
  className?: string
  multiline?: boolean
}

export default function EditableText({ 
  content, 
  onSave, 
  className = '',
  multiline = false 
}: EditableTextProps) {
  const { profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'instructor'

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  if (!isAdmin) {
    return multiline ? (
      <p className={className}>{content}</p>
    ) : (
      <span className={className}>{content}</span>
    )
  }

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className={`${className} w-full p-2 border-2 border-violet-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600`}
            rows={5}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className={`${className} w-full p-2 border-2 border-violet-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600`}
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group inline-block">
      {multiline ? (
        <p className={className}>{content}</p>
      ) : (
        <span className={className}>{content}</span>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 text-white p-1 rounded hover:bg-violet-700"
        title="Edit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  )
}
