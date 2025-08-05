// src/pages/EditProfile.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';

export default function EditProfile({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const getProfile = useCallback(async () => {
    setLoading(true);
    const { user } = session;

    const { data, error } = await supabase
      .from('profiles')
      .select(`username, instrument, avatar_url`)
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn(error);
    } else if (data) {
      setUsername(data.username);
      setInstrument(data.instrument);
      setAvatarUrl(data.avatar_url);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile({
    username,
    instrument,
    avatar_url,
  }: {
    username: string | null;
    instrument: string | null;
    avatar_url: string | null;
  }) {
    setLoading(true);
    const { user } = session;

    const updates = {
      id: user.id,
      username,
      instrument,
      avatar_url,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
      navigate('/account');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Your Profile</h1>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-transparent dark:border-gray-700">
        
        <Avatar
          session={session}
          url={avatar_url}
          onUpload={(url: string) => {
            setAvatarUrl(url);
            updateProfile({ username, instrument, avatar_url: url });
          }}
        />
        
        <div className="space-y-6 mt-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input id="email" type="text" value={session.user.email} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input
              id="username"
              type="text"
              required
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            {/* This label has been updated */}
            <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Skill</label>
            <input
              id="instrument"
              type="text"
              required
              value={instrument || ''}
              onChange={(e) => setInstrument(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              onClick={() => updateProfile({ username, instrument, avatar_url })}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}