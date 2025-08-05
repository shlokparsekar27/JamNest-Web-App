// src/components/ProfileAvatar.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ProfileAvatar({ url, size }: { url: string | null, size: number }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      downloadImage(url);
    } else {
      // If no URL is provided, ensure we don't show an old image
      setAvatarUrl(null);
    }
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      // Clean up the previous object URL to prevent memory leaks
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
      const newUrl = URL.createObjectURL(data);
      setAvatarUrl(newUrl);
    } catch (error) {
      console.log('Error downloading image: ', (error as Error).message);
    }
  }

  return (
    <div
      className="bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 overflow-hidden"
      style={{ height: size, width: size }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="User avatar"
          className="object-cover w-full h-full"
        />
      ) : (
        // A simple placeholder icon for users without a photo
        <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </div>
  );
}
