// src/pages/PostView.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileAvatar from '../components/ProfileAvatar';
import type { Session } from '@supabase/supabase-js';

// The PostData type is updated to include the user_id
type PostData = {
  id: number;
  user_id: string; 
  caption: string | null;
  media_url: string;
  created_at: string;
  // THIS IS THE CRITICAL FIX:
  // The type for 'profiles' is now an ARRAY of objects, which matches the data
  // that Supabase is sending. This will resolve the TypeScript error.
  profiles: {
    username: string | null;
    avatar_url: string | null;
  }[] | null;
};

// The component now accepts the session prop
export default function PostView({ session }: { session: Session }) {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostData | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function getPost() {
      if (!postId) {
        setError('Post not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          media_url,
          created_at,
          profiles(username, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.warn(error);
        setError('Could not fetch post details.');
      } else if (data) {
        // We use 'as unknown as PostData' for a safe type cast, which the error suggests.
        setPost(data as unknown as PostData);
        downloadMedia(data.media_url);
      }
      setLoading(false);
    }

    async function downloadMedia(path: string) {
      try {
        const { data, error } = await supabase.storage.from('posts').download(path);
        if (error) throw error;
        objectUrl = URL.createObjectURL(data);
        setMediaUrl(objectUrl);
      } catch (error) {
        console.log('Error downloading media: ', (error as Error).message);
        setError('Could not load media.');
      }
    }

    getPost();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [postId]);

  const handleDelete = async () => {
    if (!post) return;

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { error: storageError } = await supabase.storage
          .from('posts')
          .remove([post.media_url]);
        
        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id);

        if (dbError) throw dbError;

        alert('Post deleted successfully!');
        navigate(`/account`);

      } catch (error) {
        alert((error as Error).message);
      }
    }
  };

  const isVideo = post?.media_url?.match(/\.(mp4|webm|ogg)$/i);
  const isOwner = session.user.id === post?.user_id;
  
  // THIS IS THE SECOND CRITICAL FIX:
  // We now safely access the FIRST element of the profiles array (`[0]`) to get the author's info.
  const authorProfile = post?.profiles?.[0];

  if (loading) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading post...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ProfileAvatar url={authorProfile?.avatar_url || null} size={40} />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{authorProfile?.username}</span>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
        <div className="bg-black flex justify-center items-center">
          {mediaUrl && (
            isVideo ? (
              <video src={mediaUrl} controls className="max-h-[70vh] w-auto" />
            ) : (
              <img src={mediaUrl} alt={post?.caption || 'User post'} className="max-h-[70vh] w-auto" />
            )
          )}
        </div>
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">{post?.caption}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(post?.created_at || '').toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
