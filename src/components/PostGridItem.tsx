// src/components/PostGridItem.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PostGridItem({ postId, mediaUrl }: { postId: number, mediaUrl: string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function downloadMedia() {
      try {
        const { data, error } = await supabase.storage.from('posts').download(mediaUrl);
        if (error) throw error;
        if (isMounted) {
          const url = URL.createObjectURL(data);
          setFileUrl(url);
        }
      } catch (error) {
        console.log('Error downloading media: ', (error as Error).message);
      }
    }

    if (mediaUrl) downloadMedia();

    return () => {
      isMounted = false;
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [mediaUrl]);

  const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/i);

  return (
    <Link to={`/post/${postId}`} className="group aspect-square block bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden relative">
      {fileUrl ? (
        <img src={fileUrl} alt="User post" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-xs text-gray-500">Loading...</p>
        </div>
      )}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2l-4 3.001L8 6v8l4-3.001L16 14V6z"></path></svg>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
    </Link>
  );
}
