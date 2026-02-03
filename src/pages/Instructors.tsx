import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Instructor } from '@/types'
import EditableInstructorCard from '@/components/EditableInstructorCard'
import EditableText from '@/components/EditableText'

export default function Instructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [pageIntro, setPageIntro] = useState('')
  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
  try {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    setInstructors(data || [])

    // Fetch page intro
    const { data: introData } = await supabase
      .from('content_sections')
      .select('content')
      .eq('page', 'instructors')
      .eq('section_key', 'page_intro')
      .single()

    if (introData) {
      setPageIntro(introData.content)
    }
  } catch (error) {
    console.error('Error fetching instructors:', error)
  } finally {
    setLoading(false)
  }
}
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading instructors...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">
            Meet the Instructors
          </h1>
          <div className="max-w-3xl mx-auto">
            <EditableText
              content={pageIntro || 'Our talented team of violin educators brings years of experience and passion to every lesson'}
              onSave={async (newContent) => {
                // Try to update, if doesn't exist, insert
                const { error: updateError } = await supabase
                  .from('content_sections')
                  .update({ content: newContent })
                  .eq('page', 'instructors')
                  .eq('section_key', 'page_intro')

                // If update didn't work, insert new row
                if (updateError) {
                  await supabase
                    .from('content_sections')
                    .insert({
                      page: 'instructors',
                      section_key: 'page_intro',
                      content: newContent,
                      content_type: 'text'
                    })
                }
                
                setPageIntro(newContent)
              }}
              className="text-xl text-gray-600"
              multiline
            />
          </div>
        </div>

        <div className="space-y-12">
          {instructors.map(instructor => (
            <EditableInstructorCard
              key={instructor.id}
              instructor={instructor}
              onUpdate={fetchInstructors}
            />
          ))}

          {instructors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No instructors available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
