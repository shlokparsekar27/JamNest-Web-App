// src/pages/CreatePost.tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export default function CreatePost({ session }: { session: Session }) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

      // 1. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. If upload is successful, insert a new record into the 'posts' table
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: session.user.id,
        media_url: filePath,
        caption: caption,
      });

      if (insertError) {
        throw insertError;
      }

      alert('Post created successfully!');
      // Navigate to the user's own profile page after success
      navigate(`/profile/${session.user.id}`);

    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create a New Post</h1>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-transparent dark:border-gray-700">
        <form onSubmit={handleCreatePost} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Photo or Video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
            />
          </div>
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Caption
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
