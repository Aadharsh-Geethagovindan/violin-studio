import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

interface GalleryImage {
  id: string
  url: string
  display_order: number
}

interface ImageGalleryProps {
  galleryId: string
  editable?: boolean
}

export default function ImageGallery({ galleryId, editable = false }: ImageGalleryProps) {
  const { profile } = useAuth()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'instructor'
  const canEdit = editable && isAdmin

  useEffect(() => {
    fetchImages()
  }, [galleryId])

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('display_order', { ascending: true })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${galleryId}/${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName)

        // Save to database
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            gallery_id: galleryId,
            url: publicUrl,
            display_order: images.length
          })

        if (dbError) throw dbError
      }

      fetchImages()
      alert('Images uploaded successfully!')
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('Delete this image?')) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/gallery-images/')
      const filePath = urlParts[1]

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from('gallery-images')
          .remove([filePath])
      }

      fetchImages()
      alert('Image deleted successfully!')
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete image')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading gallery...</div>
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((image) => (
          <div key={image.id} className="relative group aspect-video bg-gray-200 rounded-xl overflow-hidden">
            <img
              src={image.url}
              alt="Gallery image"
              className="w-full h-full object-cover"
            />
            {canEdit && (
              <button
                onClick={() => handleDelete(image.id, image.url)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="Delete image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {images.length === 0 && !canEdit && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No images in gallery yet
          </div>
        )}
      </div>

      {canEdit && (
        <div className="mt-8">
          <label className="btn-primary cursor-pointer inline-block">
            {uploading ? 'Uploading...' : '+ Add Images'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-600 mt-2">
            Upload JPG, PNG, or WebP images
          </p>
        </div>
      )}
    </div>
  )
}
