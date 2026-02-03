import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EditableText from '@/components/EditableText'
import ImageGallery from '@/components/ImageGallery'


export default function Home() {
  const [studioIntro, setStudioIntro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from('content_sections')
        .select('*')
        .eq('page', 'home')
        .eq('section_key', 'studio_intro')
        .single()

      if (data) {
        setStudioIntro(data.content)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Violet Violin Studio
            </h1>
            <p className="text-xl md:text-2xl text-violet-100 max-w-3xl mx-auto">
              Where passion meets precision in violin education
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Welcome to Our Studio
          </h2>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <EditableText
                content={studioIntro || 'Discover the art of violin playing in a nurturing, professional environment.'}
                onSave={async (newContent) => {
                  await supabase
                    .from('content_sections')
                    .update({ content: newContent })
                    .eq('page', 'home')
                    .eq('section_key', 'studio_intro')
                  setStudioIntro(newContent)
                }}
                className="text-lg text-gray-600"
                multiline
              />
            </div>
          )}
        </div>
      </div>
    </section>

      {/* Media Gallery Placeholder */}
      <section className="py-16 bg-gray-50">
    `  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-display font-bold text-gray-900 mb-12 text-center">
          Our Studio
        </h2>
        <ImageGallery galleryId="homepage" editable={true} />
      </div>
    </section>`

      {/* Quick CTA */}
      <section className="py-16 bg-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to Begin Your Musical Journey?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Schedule your first lesson with one of our experienced instructors
          </p>
          <button className="bg-white text-violet-600 px-8 py-3 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors">
            Schedule a Lesson
          </button>
        </div>
      </section>
    </div>
  )
}
