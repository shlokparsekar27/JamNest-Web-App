// src/components/Avatar.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Session } from '@supabase/supabase-js'

export default function Avatar({ session, url, onUpload }: { session: Session, url: string | null, onUpload: (url: string) => void }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error) {
      console.log('Error downloading image: ', (error as Error).message)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${session.user.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) throw uploadError
      onUpload(filePath)
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-sm text-gray-500">No Photo</span>
        )}
      </div>
      <div>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors" htmlFor="single">
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </label>
        <input
          style={{ visibility: 'hidden', position: 'absolute' }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  )
}